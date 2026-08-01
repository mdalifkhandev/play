import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CHATS = [
  { id: '1', name: 'Jhon Doe', lastMessage: 'Hey there!!!', time: '12 mins', unread: 1, avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' },
  { id: '2', name: 'Anna Smith', lastMessage: 'Can\'t wait for the meeting tomorrow.', time: '5 mins', unread: 3, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
  { id: '3', name: 'Mike Johnson', lastMessage: 'Did you see the latest update?', time: '2 hrs', unread: 1, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
];

const RECOMMENDED = [
  { id: 'r1', name: 'Jhon Doe', subtitle: 'People you may know', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' },
  { id: 'r2', name: 'Anna Smith', subtitle: 'People you may know', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
];

export default function InboxScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable>
          <Image source={require('../../../assets/icon/user-add.svg')} style={{ width: 24, height: 24, tintColor: '#FFF' }} contentFit="contain" />
        </Pressable>
        <Text className="text-white text-lg font-bold">Inbox</Text>
        <Pressable>
          <Image source={require('../../../assets/icon/search.svg')} style={{ width: 24, height: 24, tintColor: '#FFF' }} contentFit="contain" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Notification Item */}
        <Pressable className="flex-row items-center justify-between px-4 py-3 mb-2">
          <View className="flex-row items-center flex-1">
            <Image 
              source={require('../../../assets/icon/message-notification.svg')} 
              style={{ width: 56, height: 56, marginRight: 12 }} 
              contentFit="contain" 
            />
            <View className="flex-1 pr-4">
              <Text className="text-white font-bold text-base mb-1">Notification</Text>
              <Text className="text-[#888] text-sm" numberOfLines={1}>32123xdzx12zx0z2x1zx</Text>
            </View>
          </View>
          <View className="w-3 h-3 rounded-full border-2 border-[#A3E635]" />
        </Pressable>

        {/* Chats List */}
        {CHATS.map((chat) => (
          <Link key={chat.id} href={{ pathname: '/screens/chat/[id]', params: { id: chat.id } }} asChild>
            <Pressable className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center flex-1">
                <Image 
                  source={{ uri: chat.avatar }} 
                  style={{ width: 56, height: 56, borderRadius: 28, marginRight: 12 }} 
                  contentFit="cover"
                />
                <View className="flex-1 pr-4">
                  <Text className="text-white font-bold text-base mb-1">{chat.name}</Text>
                  <View className="flex-row items-center">
                    <Text className="text-[#888] text-sm flex-1" numberOfLines={1}>{chat.lastMessage}</Text>
                    <Text className="text-[#888] text-xs ml-1">• {chat.time}</Text>
                  </View>
                </View>
              </View>
              {chat.unread > 0 && (
                <View className="w-6 h-6 bg-[#A3E635] rounded-full items-center justify-center">
                  <Text className="text-black font-bold text-xs">{chat.unread}</Text>
                </View>
              )}
            </Pressable>
          </Link>
        ))}

        {/* Recommended for you */}
        <Text className="text-white font-semibold text-lg px-4 mt-6 mb-2">Recommended for you</Text>
        
        {RECOMMENDED.map((user) => (
          <Pressable key={user.id} className="flex-row items-center justify-between px-4 py-3">
            <View className="flex-row items-center flex-1">
              <Image 
                source={{ uri: user.avatar }} 
                style={{ width: 56, height: 56, borderRadius: 28, marginRight: 12 }} 
                contentFit="cover"
              />
              <View className="flex-1 pr-4">
                <Text className="text-white font-bold text-base mb-1">{user.name}</Text>
                <Text className="text-[#888] text-sm" numberOfLines={1}>{user.subtitle}</Text>
              </View>
            </View>
            <Pressable className="bg-[#A3E635] px-4 py-1.5 rounded-full">
              <Text className="text-black font-semibold text-sm">Follow back</Text>
            </Pressable>
          </Pressable>
        ))}
        
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
