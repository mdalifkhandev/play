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

export function PostsTab({ posts = [] }: PostsTabProps) {
  return (
    <View className="flex-row flex-wrap mt-2">
      {(posts || []).map((post, index) => {
        if (!post) return null;
        const imageUri = post.thumbnailUrl || post.videoUrl || '';
        return (
          <View key={post.id || `post-${index}`} style={{ width: ITEM_WIDTH, height: ITEM_WIDTH * 1.5, padding: 1 }}>
            {imageUri ? (
              <RNImage
                source={{ uri: imageUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ width: '100%', height: '100%', backgroundColor: '#333' }} />
            )}
            <View className="absolute bottom-2 left-2 flex-row items-center">
              <Ionicons name="play-outline" size={14} color="#FFF" />
              <Text className="text-white text-xs font-semibold ml-1">{post.stats?.views || 0}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
