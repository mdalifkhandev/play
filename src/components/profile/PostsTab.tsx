import React from 'react';
import { Dimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
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
  originalPost: ReelFeedItem;
};

const safeString = (value: unknown) => typeof value === 'string' ? value : '';
const isUsableUri = (value: string) => (
  value.startsWith('http://') ||
  value.startsWith('https://') ||
  value.startsWith('file://') ||
  value.startsWith('content://')
);
const isVideoUri = (value: string) => (
  /\/video\/upload\//i.test(value) ||
  /\.(mp4|mov|m4v|webm|3gp|mkv)(\?|#|$)/i.test(value)
);
const isImageUri = (value: string) => isUsableUri(value) && !isVideoUri(value);

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
  const mediaType = safeString((post as { mediaType?: unknown }).mediaType);
  const fallbackMediaUrl = mediaType === 'photo' ? videoUrl : '';
  const imageUri = thumbnailUrl || fallbackMediaUrl;
  const views = typeof post.stats?.views === 'number' ? post.stats.views : 0;

  if (!id && !imageUri) {
    return null;
  }

  return {
    key: id || `post-${index}`,
    imageUri: isImageUri(imageUri) ? imageUri : '',
    views,
    originalPost: post as ReelFeedItem,
  };
};

export function PostsTab({ posts = [] }: PostsTabProps) {
  const router = useRouter();

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
      {cards.map((post, index) => {
        return (
          <Pressable 
            key={`${post.key}-${index}`} 
            style={{ width: ITEM_WIDTH, height: ITEM_WIDTH * 1.5, padding: 1 }}
            onPress={() => {
              const encoded = encodeURIComponent(JSON.stringify(post.originalPost));
              router.push(`/screens/reels/viewer?data=${encoded}`);
            }}
          >
            {post.imageUri ? (
              <Image
                source={post.imageUri}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={120}
              />
            ) : (
              <View style={{ width: '100%', height: '100%', backgroundColor: '#333' }} />
            )}
            <View className="absolute bottom-2 left-2 flex-row items-center">
              <Ionicons name="play-outline" size={14} color="#FFF" />
              <Text className="text-white text-xs font-semibold ml-1">{post.views}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
