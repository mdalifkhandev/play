import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BottomSheetModal } from '../../components/ui/BottomSheetModal';
import { useNotifications } from '../../hooks/notifications/useNotifications';
import type { NotificationItem } from '../../api/notifications/notification.types';

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const getActorName = (item: NotificationItem) =>
  item.actorId?.profile?.displayName ||
  item.actorId?.name ||
  item.actorId?.profile?.username ||
  item.actorId?.username ||
  item.actorId?.email ||
  item.title ||
  'System';

const getActorAvatar = (item: NotificationItem) =>
  item.actorId?.profile?.photoUrl || item.actorId?.profilePicture;

export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  
  const { 
    data: notifications, 
    isLoading, 
    isRefreshing, 
    fetchNextPage, 
    refetch,
    markAsRead,
    deleteItem
  } = useNotifications();

  // Mark all as read when screen is opened
  useEffect(() => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  }, [notifications, markAsRead]);

  const handleNotificationPress = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead([item._id]);
    }

    if (item.type === 'follow' && item.actorId?._id) {
      router.push({
        pathname: '/screens/user/[id]',
        params: { id: item.actorId._id },
      });
      return;
    }

    if ((item.type === 'like' || item.type === 'comment') && item.relatedEntityId) {
      router.push({
        pathname: '/(tab)/home',
        params: { reelId: item.relatedEntityId },
      });
    }
  };

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

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#98FF2F" />
        </View>
      ) : (
        <ScrollView 
          className="flex-1 px-4 pt-4 pb-24" 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor="#98FF2F" />}
          onScroll={({ nativeEvent }) => {
            const isCloseToBottom = nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= nativeEvent.contentSize.height - 20;
            if (isCloseToBottom) fetchNextPage();
          }}
          scrollEventThrottle={400}
        >
          {notifications.length === 0 ? (
            <View className="flex-1 items-center justify-center mt-20">
              <Text className="text-gray-500 font-inter-medium text-base">No notifications yet</Text>
            </View>
          ) : (
            notifications.map((item) => {
              const actorAvatar = getActorAvatar(item);

              return (
                <Pressable 
                  key={item._id} 
                  className={`flex-row items-center bg-[#181818] border border-[#2A2A2A] rounded-2xl p-4 mb-4 ${!item.isRead ? 'border-[#98FF2F]/30' : ''}`}
                  onPress={() => handleNotificationPress(item)}
                >
                {/* Avatar / Icon Container */}
                <View className="relative mr-4">
                  {actorAvatar ? (
                    <View className="w-12 h-12 rounded-full border-2 border-[#98FF2F]/20 overflow-hidden bg-yellow-500">
                      <Image source={{ uri: actorAvatar }} className="w-full h-full" resizeMode="cover" />
                    </View>
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-[#2A2A2A] items-center justify-center border-2 border-[#98FF2F]/20">
                      <Ionicons 
                        name={item.type === 'milestone' ? 'musical-notes' : 'person'} 
                        size={24} 
                        color="#D946EF" 
                      />
                    </View>
                  )}

                  {/* Action Overlays */}
                  {item.type === 'like' && (
                    <View className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5">
                      <Ionicons name="heart" size={16} color="#EC4899" />
                    </View>
                  )}
                  {item.type === 'comment' && (
                    <View className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5">
                      <Ionicons name="chatbubble" size={14} color="#3B82F6" />
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
                  <Text className="text-white font-inter-medium text-base mb-0.5">
                    {getActorName(item)}
                  </Text>
                  <Text className="text-gray-400 font-inter-regular text-sm leading-5 mb-1">
                    {item.body || (item.type === 'like' ? 'liked your post' : item.type === 'follow' ? 'started following you' : item.type === 'comment' ? 'commented on your post' : 'sent a notification')}
                  </Text>
                  <Text className="text-gray-500 font-inter-regular text-xs">{formatTimeAgo(item.createdAt)}</Text>
                </View>

                {/* Options Button */}
                <Pressable className="p-2 -mr-2" onPress={() => setSelectedNotification(item)}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#888" />
                </Pressable>
              </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Options Bottom Sheet */}
      <BottomSheetModal 
        visible={!!selectedNotification} 
        onClose={() => setSelectedNotification(null)}
      >
        <View className="pb-4">
          <Text className="text-white font-inter-semibold text-lg mb-6 text-center">
            Notification Options
          </Text>
          
          <Pressable 
            className="flex-row items-center px-4 py-4 border-b border-[#333]"
            onPress={() => {
              if (selectedNotification) {
                markAsRead([selectedNotification._id]);
                setSelectedNotification(null);
              }
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#FFF" />
            <Text className="text-white font-inter-medium text-base ml-4">Mark as read</Text>
          </Pressable>

          <Pressable 
            className="flex-row items-center px-4 py-4"
            onPress={() => {
              if (selectedNotification) {
                deleteItem(selectedNotification._id);
                setSelectedNotification(null);
              }
            }}
          >
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
            <Text className="text-red-500 font-inter-medium text-base ml-4">Delete notification</Text>
          </Pressable>
        </View>
      </BottomSheetModal>
    </View>
  );
}
