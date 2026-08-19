import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '../../../components/ui/Header';
import { getActivities, type ActivityItem as ApiActivityItem } from '../../../api/activities/activities.api';

const TABS = ['All', '2 days', '10 days', '15 days', '30 days'];

interface ActivityItemProps {
  activity: ApiActivityItem;
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.abs(now.getTime() - date.getTime()) / 3600000;
  
  if (diffInHours < 1) {
    const mins = Math.floor(diffInHours * 60);
    return `${mins}m ago`;
  }
  if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  }
  return `${Math.floor(diffInHours / 24)}d ago`;
};

const getActionInfo = (actionType: string, metadata?: any) => {
  switch (actionType) {
    case 'like_given': return { type: 'like', text: 'liked a video.' };
    case 'like_received': return { type: 'like', text: 'liked your video.' };
    case 'comment_given': return { type: 'comment', text: 'commented on a video.' };
    case 'comment_received': return { type: 'comment', text: 'commented on your video.' };
    case 'follow_given': return { type: 'follow', text: 'started following you.' }; 
    case 'follow_received': return { type: 'follow', text: 'started following you.' };
    case 'profile_updated': return { type: 'system', text: 'You updated your profile.' };
    case 'video_watched': return { type: 'system', text: 'You watched a video.' };
    case 'live_started': return { type: 'system', text: 'You started a live stream.' };
    case 'live_watched': return { type: 'system', text: 'You watched a live stream.' };
    case 'gift_sent': return { type: 'like', text: `sent a ${metadata?.giftName || 'gift'}.` };
    case 'gift_received': return { type: 'like', text: `sent you a ${metadata?.giftName || 'gift'}.` };
    default: return { type: 'system', text: actionType };
  }
};

const ActivityItem = ({ activity }: ActivityItemProps) => {
  const router = useRouter();
  const { type, text } = getActionInfo(activity.actionType, activity.metadata);
  const username = activity.actorId?.profile?.displayName || activity.actorId?.profile?.username || (type === 'system' ? undefined : 'Someone');
  const time = formatTime(activity.createdAt);
  
  // Differentiate my actions vs others
  let displayUsername = username;
  if (
    activity.actionType === 'profile_updated' || 
    activity.actionType === 'video_watched' || 
    activity.actionType === 'follow_given' || 
    activity.actionType === 'like_given' || 
    activity.actionType === 'comment_given' ||
    activity.actionType === 'live_started' ||
    activity.actionType === 'live_watched' ||
    activity.actionType === 'gift_sent'
  ) {
    if (activity.actionType === 'profile_updated' || activity.actionType === 'video_watched' || activity.actionType === 'live_started' || activity.actionType === 'live_watched') {
      displayUsername = undefined;
    }
    if (activity.actionType === 'follow_given' || activity.actionType === 'gift_sent' || activity.actionType === 'like_given' || activity.actionType === 'comment_given') {
      displayUsername = 'You';
    }
  }

  const handlePress = () => {
    if (activity.entityModel === 'Reel' && activity.entityId?._id) {
      router.push({ pathname: '/screens/reels/[id]', params: { id: activity.entityId._id } } as any);
    } else if (activity.entityModel === 'User' && activity.entityId?._id) {
      router.push({ pathname: '/screens/profile/[id]', params: { id: activity.entityId._id } } as any);
    }
  };

  const thumbnailUri = activity.metadata?.thumbnailUrl || activity.entityId?.thumbnailUrl;
  const avatarUri = activity.actorId?.profile?.photoUrl;

  return (
    <Pressable onPress={handlePress} className="bg-[#151515] border border-[#222] rounded-2xl p-4 mb-3 flex-row items-center">
      {/* Avatar or Icon */}
      <View className="mr-4 relative">
        {type === 'system' || !avatarUri ? (
          <View className="w-14 h-14 rounded-full bg-[#2A3B18] items-center justify-center">
            <Ionicons name="notifications" size={24} color="#83D616" />
          </View>
        ) : (
          <Image source={{ uri: avatarUri }} className="w-14 h-14 rounded-full bg-[#333]" />
        )}
        <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#83D616] rounded-full border-2 border-[#151515]" />
      </View>

      {/* Content */}
      <View className="flex-1 mr-3">
        <Text className="text-white text-base">
          {displayUsername && <Text className="font-bold">{displayUsername} </Text>}
          {text}
        </Text>
        <Text className="text-[#888] text-sm mt-1">{time}</Text>
      </View>

      {/* Right Action / Thumbnail */}
      {type === 'follow' && activity.actionType === 'follow_received' ? (
        <Pressable className="px-4 py-2 border border-[#83D616] rounded-lg">
          <Text className="text-[#83D616] font-medium text-sm">Follow back</Text>
        </Pressable>
      ) : thumbnailUri ? (
        <Image source={{ uri: thumbnailUri }} className="w-12 h-14 rounded-lg bg-[#333]" />
      ) : null}
    </Pressable>
  );
};

export default function ActivityCenterScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('All');
  const [activities, setActivities] = useState<ApiActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActivities(activeTab);
  }, [activeTab]);

  const fetchActivities = async (tab: string, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      let daysParam: number | undefined = undefined;
      if (tab !== 'All') {
        const days = parseInt(tab.replace(' days', ''));
        if (!isNaN(days)) daysParam = days;
      }
      
      const res = await getActivities(daysParam);
      setActivities(res.items || []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    fetchActivities(activeTab, true);
  }, [activeTab]);

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
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#83D616" // For iOS
            colors={['#83D616']} // For Android
          />
        }
      >
        {loading ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="large" color="#98D83A" />
          </View>
        ) : activities.length > 0 ? (
          activities.map((item) => (
            <ActivityItem key={item._id} activity={item} />
          ))
        ) : (
          <View className="py-10 items-center justify-center">
            <Text className="text-gray-500 font-inter-regular">No activities found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
