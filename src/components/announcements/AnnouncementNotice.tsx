import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { AnnouncementPlacement } from '../../api/announcements/announcements.api';
import { useActiveAnnouncements } from '../../hooks/announcements/useActiveAnnouncements';

export function AnnouncementNotice({
  placement,
  refreshKey,
}: {
  placement: AnnouncementPlacement;
  refreshKey?: number;
}) {
  const { data, refetch } = useActiveAnnouncements(placement);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const announcement = data.find((item) => !hiddenIds.includes(item.id));

  useEffect(() => {
    if (refreshKey === undefined) return;
    void refetch();
  }, [refetch, refreshKey]);

  if (!announcement) {
    return null;
  }

  return (
    <View className="mx-4 mb-3 rounded-2xl border border-[#98FF2F]/25 bg-[#151515] px-4 py-3">
      <View className="flex-row items-start">
        <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-[#98FF2F]/15">
          <Ionicons name="megaphone-outline" size={18} color="#98FF2F" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-white font-inter-bold text-sm" numberOfLines={1}>
            {announcement.title}
          </Text>
          <Text className="mt-1 text-[#A0A0A0] font-inter-regular text-xs leading-5" numberOfLines={2}>
            {announcement.message}
          </Text>
        </View>
        <Pressable
          className="ml-2 h-8 w-8 items-center justify-center rounded-full bg-white/5"
          onPress={() => setHiddenIds((current) => [...current, announcement.id])}
        >
          <Ionicons name="close" size={16} color="#A0A0A0" />
        </Pressable>
      </View>
    </View>
  );
}
