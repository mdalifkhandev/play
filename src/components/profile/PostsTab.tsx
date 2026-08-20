import React from 'react';
import { View, Image as RNImage, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';
import type { ReelFeedItem } from '../../api/reels/reels.types';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 3;

type PostsTabProps = {
  posts?: ReelFeedItem[];
};

type PostCard = {
  key: string;
  imageUri: string;
  views: number;
};

const safeString = (value: unknown) => typeof value === 'string' ? value : '';
const isUsableUri = (value: string) => (
  value.startsWith('http://') ||
  value.startsWith('https://') ||
  value.startsWith('file://') ||
  value.startsWith('content://')
);

const toPostCard = (value: unknown, index: number): PostCard | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const post = value as Partial<ReelFeedItem> & {
    media?: { thumbnailUrl?: unknown; processedUrl?: unknown; rawUrl?: unknown };
  };
  const id = safeString(post.id);
  const thumbnailUrl = safeString(post.thumbnailUrl) || safeString(post.media?.thumbnailUrl);
  const videoUrl = safeString(post.videoUrl) || safeString(post.media?.processedUrl) || safeString(post.media?.rawUrl);
  const imageUri = thumbnailUrl || videoUrl;
  const views = typeof post.stats?.views === 'number' ? post.stats.views : 0;

  if (!id && !imageUri) {
    return null;
  }

  return {
    key: id || `post-${index}`,
    imageUri: isUsableUri(imageUri) ? imageUri : '',
    views,
  };
};

export function PostsTab({ posts = [] }: PostsTabProps) {
  const cards = (Array.isArray(posts) ? posts : [])
    .map(toPostCard)
    .filter((card): card is PostCard => card !== null);

  if (cards.length === 0) {
    return (
      <View className="py-10 items-center justify-center">
        <Ionicons name="play-outline" size={34} color="#888" />
        <Text className="text-[#888] font-semibold text-sm mt-3 text-center">No reels found</Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap mt-2">
      {cards.map((post) => {
        return (
          <View key={post.key} style={{ width: ITEM_WIDTH, height: ITEM_WIDTH * 1.5, padding: 1 }}>
            {post.imageUri ? (
              <RNImage
                source={{ uri: post.imageUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ width: '100%', height: '100%', backgroundColor: '#333' }} />
            )}
            <View className="absolute bottom-2 left-2 flex-row items-center">
              <Ionicons name="play-outline" size={14} color="#FFF" />
              <Text className="text-white text-xs font-semibold ml-1">{post.views}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
