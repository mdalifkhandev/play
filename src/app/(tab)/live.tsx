import { useState, useEffect } from 'react';
import { FlatList, View, ActivityIndicator } from 'react-native';
import { liveStreamApi } from '../../api/live-streams/live-stream.api';
import { LiveCategoryBar } from '../../components/live/LiveCategoryBar';
import { LiveGridItem, LiveStreamData } from '../../components/live/LiveGridItem';
import { LiveHeader } from '../../components/live/LiveHeader';
import { AnnouncementNotice } from '../../components/announcements/AnnouncementNotice';
import { FeatureGuard } from '../../components/settings/FeatureGuard';



export default function LiveAllScreen() {
  const [activeCat, setActiveCat] = useState('All');
  const [streams, setStreams] = useState<LiveStreamData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      setIsLoading(true);
      const data = await liveStreamApi.getActiveStreams(1, 20, 'live');
      
      const realStreams: LiveStreamData[] = data.items.map(s => ({
        id: s.id,
        thumbnail: s.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
        hostName: s.hostId?.displayName || s.hostId?.username || 'Unknown',
        hostAvatar: s.hostId?.avatarUrl || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100',
        viewers: s.viewerCount ? `${s.viewerCount}` : '0',
        badge: 'Live',
        isVideo: false,
        title: s.title,
      }));
      
      setStreams(realStreams);
    } catch (e) {
      console.error('Failed to load active streams', e);
      setStreams([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FeatureGuard feature="liveStreaming" title="Live is unavailable">
      <View className="flex-1 bg-black">
        <LiveHeader />
        <LiveCategoryBar activeCategory={activeCat} onSelect={setActiveCat} />
        <AnnouncementNotice placement="live_notice" />

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FF3B30" />
          </View>
        ) : (
          <FlatList
            data={streams}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={{ padding: 8, paddingBottom: 20 }}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            renderItem={({ item }) => <LiveGridItem item={item} />}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={fetchStreams}
          />
        )}
      </View>
    </FeatureGuard>
  );
}
