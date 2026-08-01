import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useVideoPlayer, VideoView } from 'expo-video';

const INITIAL_MESSAGES = [
  { id: '1', text: 'Hey! How was the new design project coming along?', time: '10:30 AM', sender: 'other', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' },
  { id: '2', text: 'Hey! How was the new design project coming along?', time: '10:30 AM', sender: 'me' },
  { id: '3', text: 'Hey! How was the new design project coming along?', time: '10:30 AM', sender: 'other', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' },
  { id: '4', text: 'Hey! How was the new design project coming along?', time: '10:30 AM', sender: 'me' },
  { id: '5', text: 'Hey! How was the new design project coming along?', time: '10:30 AM', sender: 'other', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' },
];

function VideoMessage({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = true;
  });
  return <VideoView player={player} style={{ width: 200, height: 200, borderRadius: 12, marginBottom: 8 }} />;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>(INITIAL_MESSAGES);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0A0A0A' }}
      behavior="padding"
    >
      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: isKeyboardVisible ? 0 : insets.bottom }}>

        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#1C1C1E]">
          <View className="flex-row items-center flex-1">
            <Pressable onPress={() => router.back()} className="mr-3 p-1">
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </Pressable>

            <View className="relative">
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' }}
                style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
                contentFit="cover"
              />
              <View className="absolute bottom-0 right-3 w-3 h-3 bg-[#00C853] rounded-full border-2 border-[#0A0A0A]" />
            </View>

            <View>
              <Text className="text-white font-bold text-base">Rokey</Text>
              <Text className="text-[#888] text-xs">Online</Text>
            </View>
          </View>

          <Pressable className="p-1">
            <Ionicons name="ellipsis-horizontal" size={24} color="#FFF" />
          </Pressable>
        </View>

        {/* Messages */}
        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map((msg) => {
            const isMe = msg.sender === 'me';
            return (
              <View
                key={msg.id}
                className={`flex-row mb-6 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <View className="mr-2 justify-end pb-1 relative">
                    <Image
                      source={{ uri: msg.avatar }}
                      style={{ width: 32, height: 32, borderRadius: 16 }}
                      contentFit="cover"
                    />
                    <View className="absolute bottom-1 right-0 w-2.5 h-2.5 bg-[#00C853] rounded-full border-2 border-[#0A0A0A]" />
                  </View>
                )}

                <View
                  className={`max-w-[75%] px-4 py-3 rounded-2xl ${isMe
                    ? 'bg-[#1C1C1E] rounded-br-sm'
                    : 'bg-[#A3E635] rounded-bl-sm'
                    }`}
                >
                  {msg.attachmentType === 'image' && (
                    <Image source={{ uri: msg.attachmentUrl }} style={{ width: 200, height: 200, borderRadius: 12, marginBottom: 8 }} contentFit="cover" />
                  )}
                  {msg.attachmentType === 'video' && (
                    <VideoMessage uri={msg.attachmentUrl} />
                  )}
                  {msg.attachmentType === 'audio' && (
                    <View className="flex-row items-center mb-2 bg-[#333] p-2 rounded-lg">
                      <Ionicons name="musical-notes" size={24} color="#FFF" />
                      <Text className="text-white ml-2">Audio File</Text>
                    </View>
                  )}
                  {msg.attachmentType === 'file' && (
                    <View className="flex-row items-center mb-2 bg-[#333] p-2 rounded-lg">
                      <Ionicons name="document" size={24} color="#FFF" />
                      <Text className="text-white ml-2">Document</Text>
                    </View>
                  )}
                  <Text className={`text-base ${isMe ? 'text-white' : 'text-black'}`}>
                    {msg.text}
                  </Text>
                  <Text className={`text-[10px] mt-1 ${isMe ? 'text-[#888]' : 'text-black/60'}`}>
                    {msg.time}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Attachment Menu */}
        {showAttachMenu && (
          <View className="px-4 py-4 bg-[#1C1C1E] rounded-t-2xl flex-row justify-around border-t border-[#333]">
            <Pressable className="items-center" onPress={handleCamera}>
              <View className="w-12 h-12 rounded-full bg-[#3b82f6] items-center justify-center mb-1">
                <Ionicons name="camera" size={24} color="#FFF" />
              </View>
              <Text className="text-white text-xs">Camera</Text>
            </Pressable>
            <Pressable className="items-center" onPress={handleGallery}>
              <View className="w-12 h-12 rounded-full bg-[#10b981] items-center justify-center mb-1">
                <Ionicons name="image" size={24} color="#FFF" />
              </View>
              <Text className="text-white text-xs">Gallery</Text>
            </Pressable>
            <Pressable className="items-center" onPress={() => handleDocumentPick('video')}>
              <View className="w-12 h-12 rounded-full bg-[#f59e0b] items-center justify-center mb-1">
                <Ionicons name="videocam" size={24} color="#FFF" />
              </View>
              <Text className="text-white text-xs">Video</Text>
            </Pressable>
            <Pressable className="items-center" onPress={() => handleDocumentPick('audio')}>
              <View className="w-12 h-12 rounded-full bg-[#ef4444] items-center justify-center mb-1">
                <Ionicons name="musical-notes" size={24} color="#FFF" />
              </View>
              <Text className="text-white text-xs">Audio</Text>
            </Pressable>
            <Pressable className="items-center" onPress={() => handleDocumentPick('file')}>
              <View className="w-12 h-12 rounded-full bg-[#8b5cf6] items-center justify-center mb-1">
                <Ionicons name="document" size={24} color="#FFF" />
              </View>
              <Text className="text-white text-xs">File</Text>
            </Pressable>
          </View>
        )}

        {/* Input Area */}
        <View className="flex-row items-center px-4 py-3 bg-[#0A0A0A] z-20 border-t border-[#1C1C1E]">
          <Pressable
            className="w-12 h-12 rounded-full border border-[#333] items-center justify-center mr-3"
            onPress={() => setShowAttachMenu(!showAttachMenu)}
          >
            <Ionicons name={showAttachMenu ? "close" : "add"} size={36} color="#FFF" />
          </Pressable>

          <View className="flex-1 h-12 border border-[#333] rounded-full px-4 justify-center mr-3">
            <TextInput
              className="text-white text-sm"
              placeholder="Type a message..."
              placeholderTextColor="#888"
              value={message}
              onChangeText={setMessage}
              onFocus={() => setShowAttachMenu(false)}
            />
          </View>

          <Pressable 
            className="w-12 h-12 rounded-full border border-[#333] items-center justify-center"
            onPress={handleSend}
          >
            <Image
              source={require('../../../../assets/icon/send.svg')}
              style={{ width: 24, height: 24, tintColor: '#FFF', marginLeft: -2, marginTop: -2 }}
              contentFit="contain"
            />
          </Pressable>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}
