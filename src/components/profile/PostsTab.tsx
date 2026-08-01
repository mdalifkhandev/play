import React from 'react';
import { View, Image as RNImage, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 3;

export function PostsTab() {
  // Mock data for posts
  const mockPosts = Array(6).fill(null);

  return (
    <View className="flex-row flex-wrap mt-2">
      {mockPosts.map((_, i) => (
        <View key={i} style={{ width: ITEM_WIDTH, height: ITEM_WIDTH * 1.5, padding: 1 }}>
          <RNImage 
            source={{ uri: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&q=80' }} // Spiderman mock
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <View className="absolute bottom-2 left-2 flex-row items-center">
            <Ionicons name="play-outline" size={14} color="#FFF" />
            <Text className="text-white text-xs font-semibold ml-1">12k</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
