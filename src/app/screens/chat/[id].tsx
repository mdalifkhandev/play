import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { KeyboardAvoidingView, Platform, View, Keyboard, Text, Pressable, ActivityIndicator } from 'react-native';
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
  fetchMessages,
  sendTextMessage,
  sendMessageWithMedia,
} from '../../../api/conversations/conversation.api';
import {
  useChatSocket,
  socketJoinConversation,
  socketLeaveConversation,
  socketSendMessage,
  socketTyping,
  socketMarkRead,
} from '../../../hooks/chat/useChatSocket';
import type { Message as SocketMessage } from '../../../api/conversations/conversation.types';

interface ChatUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

// Convert socket message to MessageType for the list
const convertMessage = (msg: SocketMessage): MessageType => ({
  id: msg.id,
  text: msg.text || '',
  time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  sender: msg.sender.id === useAppStore.getState().user?.id ? 'me' : 'other',
  avatar: undefined,
  isRead: msg.isRead,
  attachmentType: msg.mediaUrl ? ('image' as const) : undefined,
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
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTypingOther, setIsTypingOther] = useState(false);
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'block' | null>(null);
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId && !name && !username && !avatar) return;

    setChatUser({
      id: userId || '',
      username: username || name || 'user',
      displayName: name || username || 'User',
      ...(avatar ? { avatarUrl: avatar } : {}),
    });
  }, [avatar, name, userId, username]);

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

  const handleError = useCallback((error: { code: string; message: string }) => {
    console.log('Chat socket status:', error.message);
  }, []);

  const { connect } = useChatSocket({
    onNewMessage: handleNewMessage,
    onTyping: handleTyping,
    onError: handleError,
  });

  // Load messages on mount
  useEffect(() => {
    let cancelled = false;
    
    const loadMessages = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const data = await fetchMessages(id);
        if (!cancelled) {
          const loadedMessages = data.items || data.messages || [];
          const converted = [...loadedMessages].reverse().map(convertMessage);
          setMessages(converted);
          
          // Get user info from first message
          if (loadedMessages.length > 0) {
            const otherMsg = loadedMessages.find(m => m.sender.id !== currentUserId);
            if (otherMsg) {
              setChatUser({
                id: otherMsg.sender.id,
                username: otherMsg.sender.username,
                displayName: otherMsg.sender.displayName,
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
    if (!message.trim() || isSending) return;
    
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

  const sendAttachment = async (uri: string, type: 'image' | 'video' | 'audio' | 'file') => {
    const text = type === 'image' ? '[Image]' : type === 'video' ? '[Video]' : type === 'audio' ? '[Audio]' : '[File]';
    
    const optimisticMessage: MessageType = {
      id: `optimistic-${Date.now()}`,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'me',
      attachmentType: type,
      attachmentUrl: uri,
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    setShowAttachMenu(false);
    
    try {
      const socketResult = await socketSendMessage(id, undefined, uri);
      if (!socketResult.success) {
        // Fallback to REST
        const apiMessage = await sendMessageWithMedia(id, uri);
        setMessages((prev) => prev.map((m) => m.id === optimisticMessage.id ? convertMessage(apiMessage) : m));
      } else {
        setMessages((prev) => prev.map((m) => m.id === optimisticMessage.id ? convertMessage(socketResult.data as SocketMessage) : m));
      }
    } catch (err) {
      console.error('Failed to send attachment:', err);
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
      sendAttachment(result.assets[0].uri, result.assets[0].type === 'video' ? 'video' : 'image');
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
      sendAttachment(result.assets[0].uri, result.assets[0].type === 'video' ? 'video' : 'image');
    }
  };

  const handleDocumentPick = async (type: 'audio' | 'video' | 'file') => {
    const result = await DocumentPicker.getDocumentAsync({
      type: type === 'audio' ? 'audio/*' : type === 'video' ? 'video/*' : '*/*',
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      sendAttachment(result.assets[0].uri, type);
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction === 'delete') {
      alert('Conversation deleted');
      setShowOptionsSheet(false);
      setTimeout(() => router.back(), 300);
    } else if (confirmAction === 'block') {
      alert('User blocked');
      setShowOptionsSheet(false);
      setTimeout(() => router.back(), 300);
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
          userName={chatUser?.displayName ?? chatUser?.username ?? 'User'}
          avatarUrl={chatUser?.avatarUrl ?? ''}
          status={isTypingOther ? 'Typing...' : 'Online'}
        />

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#A3E635" />
          </View>
        ) : (
          <>
            <MessageList messages={messages} isTyping={isTypingOther} />

            {showAttachMenu && (
              <AttachmentMenu 
                onCamera={handleCamera}
                onGallery={handleGallery}
                onVideo={() => handleDocumentPick('video')}
                onAudio={() => handleDocumentPick('audio')}
                onFile={() => handleDocumentPick('file')}
              />
            )}

            <ChatInputArea 
              message={message}
              onChangeMessage={handleMessageChange}
              onFocus={() => setShowAttachMenu(false)}
              onSend={handleSend}
              onToggleAttachMenu={() => setShowAttachMenu(!showAttachMenu)}
              showAttachMenu={showAttachMenu}
            />
            
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
                onPress={() => setConfirmAction(null)}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </Pressable>
              <Pressable 
                className="flex-1 bg-red-500 py-3 rounded-xl ml-2 items-center"
                onPress={handleConfirmAction}
              >
                <Text className="text-white font-semibold">Confirm</Text>
              </Pressable>
            </View>
          </View>
        )}
      </BottomSheetModal>
    </KeyboardAvoidingView>
  );
}
