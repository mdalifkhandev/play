import React from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    user: 'Sarah Martinez',
    action: 'liked your post',
    time: '2 minute ago',
    type: 'like',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop'
  },
  {
    id: '2',
    user: 'Sarah Martinez',
    action: 'Comment your post',
    time: '2 minute ago',
    type: 'comment',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop'
  },
  {
    id: '3',
    user: 'Luna Voice',
    action: 'started following you',
    time: '1 day ago',
    type: 'follow',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
  },
  {
    id: '4',
    user: 'Luna Voice',
    action: "You've reached 10,000\nfollowers! 🎉",
    time: '1 day ago',
    type: 'milestone',
    icon: 'musical-notes'
  }
];

export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-[#222]">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <View className="flex-1 items-center pr-8">
          <Text className="text-white font-inter-semibold text-lg">Notification</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4 pb-24" showsVerticalScrollIndicator={false}>
        {MOCK_NOTIFICATIONS.map((item) => (
          <View 
            key={item.id} 
            className="flex-row items-center bg-[#181818] border border-[#2A2A2A] rounded-2xl p-4 mb-4"
          >
            {/* Avatar / Icon Container */}
            <View className="relative mr-4">
              {item.avatar ? (
                <View className="w-12 h-12 rounded-full border-2 border-[#98FF2F]/20 overflow-hidden bg-yellow-500">
                  <Image source={{ uri: item.avatar }} className="w-full h-full" resizeMode="cover" />
                </View>
              ) : (
                <View className="w-12 h-12 rounded-full bg-pink-100 items-center justify-center">
                  <Ionicons name={item.icon as any} size={24} color="#D946EF" />
                </View>
              )}

              {/* Action Overlays */}
              {item.type === 'like' && (
                <View className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5">
                  <Ionicons name="heart" size={16} color="#EC4899" />
                </View>
              )}
              {item.type === 'follow' && (
                <View className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5">
                  <View className="bg-[#3B82F6] rounded-full p-1 border border-black">
                    <Ionicons name="person-add" size={10} color="white" />
                  </View>
                </View>
              )}
            </View>

            {/* Content */}
            <View className="flex-1 mr-2">
              <Text className="text-white font-inter-medium text-base mb-0.5">{item.user}</Text>
              <Text className="text-gray-400 font-inter-regular text-sm leading-5 mb-1">
                {item.action}
              </Text>
              <Text className="text-gray-500 font-inter-regular text-xs">{item.time}</Text>
            </View>

            {/* Options Button */}
            <Pressable className="p-2 -mr-2">
              <Ionicons name="ellipsis-vertical" size={20} color="#888" />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
