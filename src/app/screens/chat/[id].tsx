import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Alert, KeyboardAvoidingView, Platform, View, Keyboard, Text, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

import { ChatHeader } from '../../../components/chat/ChatHeader';
import { MessageList } from '../../../components/chat/MessageList';
import { ChatInputArea } from '../../../components/chat/ChatInputArea';
import { AttachmentMenu } from '../../../components/chat/AttachmentMenu';
import { MessageType } from '../../../components/chat/MessageBubble';
import { BottomSheetModal } from '../../../components/ui/BottomSheetModal';
import { useAppStore } from '../../../store';
import {
  deleteConversation,
  fetchConversationBlockStatus,
  fetchMessages,
  sendTextMessage,
  sendMessageWithMedia,
  uploadChatAttachment,
} from '../../../api/conversations/conversation.api';
import {
  useChatSocket,
  socketJoinConversation,
  socketLeaveConversation,
  socketSendMessage,
  socketTyping,
  socketMarkRead,
  socketBlockUser,
  socketUnblockUser,
} from '../../../hooks/chat/useChatSocket';
import type { Message as SocketMessage } from '../../../api/conversations/conversation.types';

interface ChatUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

const MESSAGE_PAGE_SIZE = 10;

// Convert socket message to MessageType for the list
const convertMessage = (msg: SocketMessage): MessageType => ({
  id: msg.id,
  text: msg.text || '',
  time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  sender: msg.sender.id === useAppStore.getState().user?.id ? 'me' : 'other',
  avatar: msg.sender.avatarUrl,
  isRead: msg.isRead,
  attachmentType: msg.attachmentType || inferAttachmentType(msg.mediaUrl),
  attachmentUrl: msg.mediaUrl,
});

const upsertMessage = (items: MessageType[], next: MessageType) => {
  if (items.some((item) => item.id === next.id)) {
    return items.map((item) => item.id === next.id ? next : item);
  }

  return [...items, next];
};

export default function ChatScreen() {
  const { id, userId, name, username, avatar } = useLocalSearchParams<{
    id: string;
    userId?: string;
    name?: string;
    username?: string;
    avatar?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUserId = useAppStore((s) => s.user?.id);
  const routeChatUser = useMemo<ChatUser | null>(() => {
    if (!userId && !name && !username && !avatar) return null;

    return {
      id: userId || '',
      username: username || name || 'user',
      displayName: name || username || 'User',
      ...(avatar ? { avatarUrl: avatar } : {}),
    };
  }, [avatar, name, userId, username]);
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [messagePage, setMessagePage] = useState(1);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTypingOther, setIsTypingOther] = useState(false);
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'block' | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [blockStatus, setBlockStatus] = useState({
    blockedByMe: false,
    blockedMe: false,
    canUnblock: false,
  });
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetUserId = chatUser?.id || routeChatUser?.id || userId || '';
  const isChatBlocked = blockStatus.blockedByMe || blockStatus.blockedMe;

  const refreshBlockStatus = useCallback(async () => {
    if (!targetUserId) return;

    try {
      const status = await fetchConversationBlockStatus(targetUserId);
      setBlockStatus(status);
      console.log('Conversation block status:', status);
    } catch (error) {
      console.log('Block status check failed:', error);
    }
  }, [targetUserId]);

  // Socket callbacks
  const handleNewMessage = useCallback((socketMsg: SocketMessage) => {
    if (socketMsg.conversationId === id) {
      const converted = convertMessage(socketMsg);
      setMessages((prev) => upsertMessage(prev.filter((item) => !item.id.startsWith('optimistic-')), converted));
      // Mark as read if from other user
      if (converted.sender !== 'me') {
        void socketMarkRead(id);
      }
    }
  }, [id]);

  const handleTyping = useCallback((event: { userId: string; username?: string; isTyping: boolean; conversationId: string }) => {
    if (event.conversationId === id && event.userId !== currentUserId) {
      setIsTypingOther(event.isTyping);
    }
  }, [id, currentUserId]);

  const handleReadReceipt = useCallback((event: { conversationId: string; userId?: string; readBy?: string; messageIds: string[]; readAt?: string }) => {
    const actorId = event.userId || event.readBy;
    if (event.conversationId === id && actorId && actorId !== currentUserId) {
      setMessages((prev) => 
        prev.map((m) => event.messageIds.includes(m.id) ? { ...m, isRead: true } : m)
      );
    }
  }, [id, currentUserId]);

  const handleError = useCallback((error: { code: string; message: string }) => {
    console.log('Chat socket status:', error.message);
  }, []);

  const handleBlockStatusChanged = useCallback((event: {
    conversationId?: string;
    userId: string;
    blockedByMe: boolean;
    blockedMe: boolean;
    canUnblock: boolean;
  }) => {
    if (event.conversationId && event.conversationId !== id) return;

    const possiblePartnerIds = [targetUserId, chatUser?.id, routeChatUser?.id, userId].filter(Boolean);
    if (!possiblePartnerIds.includes(event.userId)) {
      void refreshBlockStatus();
      return;
    }

    setBlockStatus({
      blockedByMe: event.blockedByMe,
      blockedMe: event.blockedMe,
      canUnblock: event.canUnblock,
    });
    setShowAttachMenu(false);
    console.log('Live block status changed:', event);
  }, [chatUser?.id, id, refreshBlockStatus, routeChatUser?.id, targetUserId, userId]);

  const { connect } = useChatSocket({
    onNewMessage: handleNewMessage,
    onTyping: handleTyping,
    onReadReceipt: handleReadReceipt,
    onBlockStatusChanged: handleBlockStatusChanged,
    onError: handleError,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshBlockStatus();
    }, 0);

    return () => clearTimeout(timer);
  }, [refreshBlockStatus]);

  const loadOlderMessages = useCallback(async () => {
    if (!id || isLoadingOlder || !hasOlderMessages) return;

    const nextPage = messagePage + 1;
    try {
      setIsLoadingOlder(true);
      const data = await fetchMessages(id, nextPage, MESSAGE_PAGE_SIZE);
      const loadedMessages = data.items || data.messages || [];
      const olderMessages = [...loadedMessages].reverse().map(convertMessage);

      setMessages((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const uniqueOlder = olderMessages.filter((item) => !existingIds.has(item.id));
        return [...uniqueOlder, ...prev];
      });
      setMessagePage(nextPage);
      setHasOlderMessages(Boolean(data.hasMore));
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [hasOlderMessages, id, isLoadingOlder, messagePage]);

  // Load messages on mount
  useEffect(() => {
    let cancelled = false;
    
    const loadMessages = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setMessagePage(1);
        setHasOlderMessages(false);
        const data = await fetchMessages(id, 1, MESSAGE_PAGE_SIZE);
        if (!cancelled) {
          const loadedMessages = data.items || data.messages || [];
          const converted = [...loadedMessages].reverse().map(convertMessage);
          setMessages(converted);
          setMessagePage(1);
          setHasOlderMessages(Boolean(data.hasMore));
          
          // Get user info from first message
          if (loadedMessages.length > 0) {
            const otherMsg = loadedMessages.find(m => m.sender.id !== currentUserId);
            if (otherMsg) {
              setChatUser({
                id: otherMsg.sender.id,
                username: otherMsg.sender.username,
                displayName: otherMsg.sender.displayName,
                ...(otherMsg.sender.avatarUrl ? { avatarUrl: otherMsg.sender.avatarUrl } : {}),
              });
            }
          }
          
          // Mark all as read
          void socketMarkRead(id);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadMessages();
    
    const joinTimer = setTimeout(() => {
      connect();
      void socketJoinConversation(id).then((ack) => {
        if (!ack.success) {
          setTimeout(() => {
            void socketJoinConversation(id);
          }, 800);
        }
      });
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(joinTimer);
      void socketLeaveConversation(id);
    };
  }, [connect, currentUserId, id]);

  // Keyboard listener
  useEffect(() => {
    const showSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleSend = async () => {
    if (!message.trim() || isSending || isChatBlocked) return;
    
    const text = message.trim();
    setMessage('');
    setIsSending(true);
    
    // Optimistic update
    const optimisticMessage: MessageType = {
      id: `optimistic-${Date.now()}`,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'me',
      isRead: true,
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    
    try {
      // Send via socket (real-time)
      const socketResult = await socketSendMessage(id, text);
      
      // If socket fails, try REST API as fallback
      if (!socketResult.success) {
        const apiMessage = await sendTextMessage(id, text);
        setMessages((prev) => 
          prev.map((m) => m.id === optimisticMessage.id ? convertMessage(apiMessage) : m)
        );
      } else {
        // Replace optimistic with real message
        setMessages((prev) => 
          prev.map((m) => m.id === optimisticMessage.id ? convertMessage(socketResult.data as SocketMessage) : m)
        );
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      const status = (err as any)?.response?.status;
      const code = (err as any)?.response?.data?.code;
      if (status === 403 || code === 'USER_BLOCKED') {
        void refreshBlockStatus();
      }
      // Show error on optimistic message
      setMessages((prev) => 
        prev.map((m) => 
          m.id === optimisticMessage.id 
            ? { ...m, text: `${text} (failed to send)` }
            : m
        )
      );
      setMessage(text);
    } finally {
      setIsSending(false);
      socketTyping(id, false);
    }
  };

  const sendAttachment = async (
    uri: string,
    type: 'image' | 'video' | 'audio' | 'file',
    file?: { name?: string | null; mimeType?: string | null },
  ) => {
    if (isChatBlocked) return;

    const optimisticMessage: MessageType = {
      id: `optimistic-${Date.now()}`,
      text: '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'me',
      attachmentType: type,
      attachmentUrl: uri,
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    setShowAttachMenu(false);
    
    try {
      const uploaded = await uploadChatAttachment({
        uri,
        name: file?.name || fileNameFromUri(uri, type),
        mimeType: file?.mimeType || mimeTypeFromUri(uri, type),
        attachmentType: type,
      });
      const socketResult = await socketSendMessage(
        id,
        undefined,
        uploaded.url,
        uploaded.attachmentType,
      );
      if (!socketResult.success) {
        // Fallback to REST
        const apiMessage = await sendMessageWithMedia(id, uploaded.url, uploaded.attachmentType);
        setMessages((prev) => prev.map((m) => m.id === optimisticMessage.id ? convertMessage(apiMessage) : m));
      } else {
        setMessages((prev) => prev.map((m) => m.id === optimisticMessage.id ? convertMessage(socketResult.data as SocketMessage) : m));
      }
    } catch (err) {
      console.error('Failed to send attachment:', err);
      const status = (err as any)?.response?.status;
      const code = (err as any)?.response?.data?.code;
      if (status === 403 || code === 'USER_BLOCKED') {
        void refreshBlockStatus();
      }
      setMessages((prev) => prev.filter(m => m.id !== optimisticMessage.id));
    }
  };

  const handleMessageChange = (text: string) => {
    setMessage(text);
    
    // Typing indicator
    void socketTyping(id, text.length > 0);
    
    // Stop typing after 2s of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (text.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        void socketTyping(id, false);
      }, 2000);
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      sendAttachment(
        asset.uri,
        asset.type === 'video' ? 'video' : 'image',
        { name: asset.fileName, mimeType: asset.mimeType },
      );
    }
  };

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      sendAttachment(
        asset.uri,
        asset.type === 'video' ? 'video' : 'image',
        { name: asset.fileName, mimeType: asset.mimeType },
      );
    }
  };

  const handleDocumentPick = async (type: 'audio' | 'video' | 'file') => {
    const result = await DocumentPicker.getDocumentAsync({
      type: documentPickerMimeTypes(type),
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];

      if (type === 'file' && isMediaDocument(asset.name, asset.mimeType)) {
        Alert.alert('Select document only', 'Audio, video, and image files should be sent from Audio, Video, or Gallery.');
        return;
      }

      sendAttachment(asset.uri, type, { name: asset.name, mimeType: asset.mimeType });
    }
  };

  const handleConfirmAction = async () => {
    if (isActionLoading || !confirmAction) return;

    try {
      setIsActionLoading(true);

      if (confirmAction === 'delete') {
        await deleteConversation(id);
        console.log('Conversation deleted:', id);
      } else {
        if (!targetUserId) {
          Alert.alert('Unable to block', 'User information is not available.');
          return;
        }

        const blockResult = await socketBlockUser(targetUserId, id);
        if (!blockResult.success) {
          throw new Error(blockResult.error.message);
        }
        setBlockStatus(blockResult.data);
        setShowAttachMenu(false);
        console.log('User blocked:', targetUserId);
      }

      setShowOptionsSheet(false);
      setConfirmAction(null);
      if (confirmAction === 'delete') {
        setTimeout(() => router.back(), 200);
      }
    } catch (error) {
      console.error(`Failed to ${confirmAction} conversation action:`, error);
      Alert.alert(
        confirmAction === 'delete' ? 'Delete failed' : 'Block failed',
        'Please try again.',
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!targetUserId || isActionLoading || !blockStatus.canUnblock) return;

    try {
      setIsActionLoading(true);
      const unblockResult = await socketUnblockUser(targetUserId, id);
      if (!unblockResult.success) {
        throw new Error(unblockResult.error.message);
      }
      setBlockStatus(unblockResult.data);
      console.log('User unblocked:', targetUserId);
    } catch (error) {
      console.error('Failed to unblock user:', error);
      Alert.alert('Unblock failed', 'Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0A0A0A' }}
      behavior="padding"
    >
      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: isKeyboardVisible ? 0 : insets.bottom }}>
        
        <ChatHeader 
          onBack={() => router.back()}
          onOptions={() => {
            setConfirmAction(null);
            setShowOptionsSheet(true);
          }}
          userName={chatUser?.displayName ?? routeChatUser?.displayName ?? chatUser?.username ?? routeChatUser?.username ?? 'User'}
          avatarUrl={chatUser?.avatarUrl ?? routeChatUser?.avatarUrl ?? ''}
          status={isTypingOther ? 'Typing...' : 'Online'}
        />

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#A3E635" />
          </View>
        ) : (
          <>
            <MessageList
              messages={messages}
              isTyping={isTypingOther}
              hasMore={hasOlderMessages}
              isLoadingOlder={isLoadingOlder}
              onLoadOlder={loadOlderMessages}
            />

            {showAttachMenu && !isChatBlocked && (
              <AttachmentMenu 
                onCamera={handleCamera}
                onGallery={handleGallery}
                onVideo={() => handleDocumentPick('video')}
                onAudio={() => handleDocumentPick('audio')}
                onFile={() => handleDocumentPick('file')}
              />
            )}

            {isChatBlocked ? (
              <BlockedChatNotice
                blockedByMe={blockStatus.blockedByMe}
                blockedMe={blockStatus.blockedMe}
                isLoading={isActionLoading}
                onUnblock={handleUnblock}
              />
            ) : (
              <ChatInputArea 
                message={message}
                onChangeMessage={handleMessageChange}
                onFocus={() => setShowAttachMenu(false)}
                onSend={handleSend}
                onToggleAttachMenu={() => setShowAttachMenu(!showAttachMenu)}
                showAttachMenu={showAttachMenu}
              />
            )}
            
            {isSending && (
              <View className="absolute bottom-20 left-0 right-0 items-center">
                <ActivityIndicator size="small" color="#888" />
              </View>
            )}
          </>
        )}
        
      </View>

      {/* Options Bottom Sheet */}
      <BottomSheetModal 
        visible={showOptionsSheet} 
        onClose={() => setShowOptionsSheet(false)}
      >
        {!confirmAction ? (
          <View>
            <View className="items-center mb-6">
              <Text className="text-white text-lg font-bold">Chat Options</Text>
            </View>
            <Pressable 
              className="flex-row items-center py-4 border-b border-[#333]"
              onPress={() => setConfirmAction('delete')}
            >
              <View className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center mr-4">
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </View>
              <Text className="text-red-500 font-semibold text-base">Delete Conversation</Text>
            </Pressable>
            <Pressable 
              className="flex-row items-center py-4"
              onPress={() => setConfirmAction('block')}
            >
              <View className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center mr-4">
                <Ionicons name="ban-outline" size={20} color="#ef4444" />
              </View>
              <Text className="text-red-500 font-semibold text-base">Block User</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <View className="items-center mb-6">
              <Text className="text-white text-lg font-bold">Are you sure?</Text>
              <Text className="text-[#888] text-sm mt-2 text-center">
                {confirmAction === 'delete' 
                  ? 'This conversation will be permanently deleted from your inbox.' 
                  : 'You will no longer receive messages from this user.'}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Pressable 
                className="flex-1 bg-[#333] py-3 rounded-xl mr-2 items-center"
                disabled={isActionLoading}
                onPress={() => setConfirmAction(null)}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </Pressable>
              <Pressable 
                className="flex-1 bg-red-500 py-3 rounded-xl ml-2 items-center"
                disabled={isActionLoading}
                onPress={handleConfirmAction}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Confirm</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </BottomSheetModal>
    </KeyboardAvoidingView>
  );
}

function BlockedChatNotice({
  blockedByMe,
  blockedMe,
  isLoading,
  onUnblock,
}: {
  blockedByMe: boolean;
  blockedMe: boolean;
  isLoading: boolean;
  onUnblock: () => void;
}) {
  return (
    <View className="px-4 py-3 bg-[#0A0A0A] border-t border-[#1C1C1E]">
      <View className="rounded-2xl bg-[#1C1C1E] px-4 py-3">
        <Text className="text-white font-semibold text-sm text-center">
          {blockedByMe ? 'You blocked this user.' : 'You cannot message this user.'}
        </Text>
        <Text className="text-[#888] text-xs text-center mt-1">
          {blockedByMe
            ? 'Unblock to send messages again.'
            : blockedMe
              ? 'Only the user who blocked can unblock this chat.'
              : 'Messaging is unavailable.'}
        </Text>
        {blockedByMe && (
          <Pressable
            className="mt-3 rounded-full bg-[#A3E635] py-2 items-center"
            disabled={isLoading}
            onPress={onUnblock}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text className="text-black font-bold">Unblock</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

function inferAttachmentType(url?: string): 'image' | 'video' | 'audio' | 'file' | undefined {
  if (!url) return undefined;
  if (/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url)) return 'image';
  if (/\.(mp4|mov|m4v|webm)(\?|$)/i.test(url)) return 'video';
  if (/\.(mp3|m4a|wav|aac|ogg)(\?|$)/i.test(url)) return 'audio';
  return 'file';
}

function fileNameFromUri(uri: string, type: 'image' | 'video' | 'audio' | 'file') {
  const rawName = uri.split('/').pop()?.split('?')[0];
  if (rawName && rawName.includes('.')) {
    return rawName;
  }

  const extension =
    type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : type === 'audio' ? 'm4a' : 'bin';

  return `chat-${Date.now()}.${extension}`;
}

function mimeTypeFromUri(uri: string, type: 'image' | 'video' | 'audio' | 'file') {
  const extension = uri.split('?')[0]?.split('.').pop()?.toLowerCase();
  const byExtension: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    m4v: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    aac: 'audio/aac',
    pdf: 'application/pdf',
    txt: 'text/plain',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    zip: 'application/zip',
  };

  if (extension && byExtension[extension]) {
    return byExtension[extension];
  }

  if (type === 'image') return 'image/jpeg';
  if (type === 'video') return 'video/mp4';
  if (type === 'audio') return 'audio/mp4';
  return 'application/octet-stream';
}

function documentPickerMimeTypes(type: 'audio' | 'video' | 'file') {
  if (type === 'audio') return 'audio/*';
  if (type === 'video') return 'video/*';

  return [
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'application/json',
  ];
}

function isMediaDocument(name?: string | null, mimeType?: string | null) {
  const mime = (mimeType || '').toLowerCase();
  if (mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/')) {
    return true;
  }

  return /\.(jpg|jpeg|png|webp|gif|heic|mp4|mov|m4v|webm|mp3|m4a|wav|aac|ogg)$/i.test(name || '');
}
