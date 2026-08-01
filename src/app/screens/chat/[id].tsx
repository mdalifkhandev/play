import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, View, Keyboard, Text, Pressable } from 'react-native';
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

const INITIAL_MESSAGES: MessageType[] = [
  { id: '1', text: 'Hey! How was the new design project coming along?', time: '10:30 AM', sender: 'other', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' },
  { id: '2', text: 'Hey! How was the new design project coming along?', time: '10:30 AM', sender: 'me' },
  { id: '3', text: 'Hey! How was the new design project coming along?', time: '10:30 AM', sender: 'other', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' },
  { id: '4', text: 'Hey! How was the new design project coming along?', time: '10:30 AM', sender: 'me' },
  { id: '5', text: 'Hey! How was the new design project coming along?', time: '10:30 AM', sender: 'other', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MessageType[]>(INITIAL_MESSAGES);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Bottom Sheet States
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'block' | null>(null);

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

  const handleSend = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        {
          id: Date.now().toString(),
          text: message.trim(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender: 'me',
        },
      ]);
      setMessage('');
    }
  };

  const sendAttachment = (uri: string, type: 'image' | 'video' | 'audio' | 'file') => {
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        text: type === 'image' ? 'Sent an image' : type === 'video' ? 'Sent a video' : type === 'audio' ? 'Sent an audio file' : 'Sent a file',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: 'me',
        attachmentType: type,
        attachmentUrl: uri,
      },
    ]);
    setShowAttachMenu(false);
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
          userName="Rokey"
          avatarUrl="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100"
          status="Online"
        />

        <MessageList messages={messages} />

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
          onChangeMessage={setMessage}
          onFocus={() => setShowAttachMenu(false)}
          onSend={handleSend}
          onToggleAttachMenu={() => setShowAttachMenu(!showAttachMenu)}
          showAttachMenu={showAttachMenu}
        />
        
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
