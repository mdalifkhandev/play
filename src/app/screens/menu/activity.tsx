import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../../components/ui/Header';

const TABS = ['All', '2 days', '10 days', '15 days', '30 days'];

interface ActivityItemProps {
  type: 'like' | 'follow' | 'mention' | 'system';
  username?: string;
  actionText: string;
  time: string;
  userAvatar?: any;
  thumbnail?: any;
}

const ActivityItem = ({ type, username, actionText, time, userAvatar, thumbnail }: ActivityItemProps) => {
  return (
    <View className="bg-[#151515] border border-[#222] rounded-2xl p-4 mb-3 flex-row items-center">
      {/* Avatar or Icon */}
      <View className="mr-4 relative">
        {type === 'system' ? (
          <View className="w-14 h-14 rounded-full bg-[#2A3B18] items-center justify-center">
            <Ionicons name="notifications" size={24} color="#83D616" />
          </View>
        ) : (
          <Image source={userAvatar} className="w-14 h-14 rounded-full bg-[#333]" />
        )}
        <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#83D616] rounded-full border-2 border-[#151515]" />
      </View>

      {/* Content */}
      <View className="flex-1 mr-3">
        <Text className="text-white text-base">
          {username && <Text className="font-bold">{username}</Text>}
          {username ? ` ${actionText}` : actionText}
        </Text>
        <Text className="text-[#888] text-sm mt-1">{time}</Text>
      </View>

      {/* Right Action / Thumbnail */}
      {type === 'follow' ? (
        <Pressable className="px-4 py-2 border border-[#83D616] rounded-lg">
          <Text className="text-[#83D616] font-medium text-sm">Follow back</Text>
        </Pressable>
      ) : thumbnail ? (
        <Image source={thumbnail} className="w-12 h-14 rounded-lg bg-[#333]" />
      ) : null}
    </View>
  );
};

export default function ActivityCenterScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('All');

  // Dummy placeholders for images
  const DUMMY_AVATAR = { uri: 'https://i.pravatar.cc/150?img=11' };
  const DUMMY_AVATAR2 = { uri: 'https://i.pravatar.cc/150?img=12' };
  const DUMMY_AVATAR3 = { uri: 'https://i.pravatar.cc/150?img=13' };
  const DUMMY_THUMBNAIL = { uri: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60' };

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Activity Center" />

      {/* Tabs */}
      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full mr-3 ${activeTab === tab ? 'bg-white' : 'bg-[#222]'}`}
            >
              <Text className={`${activeTab === tab ? 'text-black font-semibold' : 'text-[#888]'}`}>{tab}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Activity List */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <ActivityItem
          type="like"
          username="alex_vfx"
          actionText="liked your video."
          time="2h ago"
          userAvatar={DUMMY_AVATAR}
          thumbnail={DUMMY_THUMBNAIL}
        />
        <ActivityItem
          type="like"
          username="alex_vfx"
          actionText="liked your video."
          time="2h ago"
          userAvatar={DUMMY_AVATAR2}
          thumbnail={DUMMY_THUMBNAIL}
        />
        <ActivityItem
          type="follow"
          username="jordon.raw"
          actionText="started following you."
          time="2h ago"
          userAvatar={DUMMY_AVATAR3}
        />
        <ActivityItem
          type="mention"
          username="tech_junkie"
          actionText="mentioned you in a comment."
          time="2h ago"
          userAvatar={DUMMY_AVATAR}
          thumbnail={DUMMY_THUMBNAIL}
        />
        <ActivityItem
          type="system"
          actionText="Your Creator application has been approved!"
          time="2h ago"
        />
      </ScrollView>
    </View>
  );
}
