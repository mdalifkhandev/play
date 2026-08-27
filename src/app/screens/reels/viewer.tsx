import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FeedItem, type FeedItemProps } from '../../../components/ui/FeedItem';
import type { ReelFeedItem } from '../../../api/reels/reels.types';

function isImageUrl(url?: string | null): url is string {
  if (!url) return false;
  return !/\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}

function optimizedCloudinaryImageUrl(url?: string | null, width = 720, height = 1280): string | undefined {
  if (!url) return undefined;
  if (!/res\.cloudinary\.com/i.test(url) || !url.includes('/upload/')) return url;
  if (/\/upload\/[^/]*(?:f_auto|q_auto|w_\d+|h_\d+)/i.test(url)) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto:eco,c_fill,w_${width},h_${height}/`);
}

function mapBackendReelToFeedItem(reel: ReelFeedItem): Omit<FeedItemProps, 'isActive' | 'shouldMountVideo'> & { itemType: 'reel' } {
  const hasPlayableVideo = reel.mediaType !== 'photo' && !isImageUrl(reel.videoUrl);
  const thumbnailUrl = optimizedCloudinaryImageUrl(reel.thumbnailUrl);
  const source = hasPlayableVideo ? reel.videoUrl : thumbnailUrl || reel.videoUrl;

  return {
    id: reel.id,
    itemType: 'reel',
    type: hasPlayableVideo ? 'video' : 'image',
    source,
    thumbnailUrl: isImageUrl(thumbnailUrl) ? thumbnailUrl : undefined,
    user: {
      id: reel.user.id,
      username: reel.user.displayName || reel.user.username || reel.user.email || '',
      profileImage: reel.user.avatarUrl || '',
      isPremium: Boolean(reel.user.isPremium),
    },
    description: reel.caption || '',
    date: new Date(reel.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    stats: {
      likes: reel.stats.likes,
      comments: reel.stats.comments,
      bookmarks: reel.stats.saves || 0,
      shares: reel.stats.shares,
      views: reel.stats.views,
    },
    viewerState: reel.viewerState,
    edit: reel.edit,
  };
}

export default function ReelViewerScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  
  const feedItem = useMemo(() => {
    try {
      if (typeof params.data === 'string') {
        const rawReel = JSON.parse(decodeURIComponent(params.data)) as ReelFeedItem;
        return mapBackendReelToFeedItem(rawReel);
      }
    } catch (e) {
      console.error('Failed to parse reel data:', e);
    }
    return null;
  }, [params.data]);

  if (!feedItem) {
    return <View style={{ flex: 1, backgroundColor: 'black' }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <FeedItem
        {...feedItem}
        isActive={true}
        shouldMountVideo={true}
        isFullscreen={false}
      />
      <Pressable 
        onPress={() => router.back()}
        style={{
          position: 'absolute',
          top: insets.top + 10,
          left: 16,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}
      >
        <Ionicons name="chevron-back" size={24} color="#FFF" />
      </Pressable>
    </View>
  );
}
