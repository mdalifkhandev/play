import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostsTab } from './PostsTab';
import { CollectionsTab } from './CollectionsTab';
import { SoundsTab } from './SoundsTab';
import type { ReelFeedItem } from '../../api/reels/reels.types';

type MainTabType = 'grid' | 'bookmark' | 'heart';
type SavedTabType = 'posts' | 'collections' | 'sounds';

type ProfileTabsProps = {
  posts?: ReelFeedItem[];
  savedPosts?: ReelFeedItem[];
  likedPosts?: ReelFeedItem[];
  showPrivateTabs?: boolean;
  isLoadingPosts?: boolean;
  isLoadingSavedPosts?: boolean;
  isLoadingLikedPosts?: boolean;
  onTabChange?: (tab: MainTabType) => void;
};

export function ProfileTabs({
  posts = [],
  savedPosts = [],
  likedPosts = [],
  showPrivateTabs = true,
  isLoadingPosts = false,
  isLoadingSavedPosts = false,
  isLoadingLikedPosts = false,
  onTabChange,
}: ProfileTabsProps) {
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('grid');
  const [activeSavedTab, setActiveSavedTab] = useState<SavedTabType>('posts');
  const selectMainTab = (tab: MainTabType) => {
    setActiveMainTab(tab);
    onTabChange?.(tab);
  };

  return (
    <View className="flex-1 mt-8">
      {/* Icon Row */}
      <View className="flex-row items-center border-b border-[#222]">
        <Pressable 
          className="flex-1 py-3 items-center justify-center"
          onPress={() => selectMainTab('grid')}
        >
          <Ionicons name="apps-outline" size={24} color={activeMainTab === 'grid' ? '#FFF' : '#666'} />
          {activeMainTab === 'grid' && <View className="absolute bottom-0 w-full h-[2px] bg-white" />}
        </Pressable>
        
        {showPrivateTabs && (
          <Pressable 
            className="flex-1 py-3 items-center justify-center"
            onPress={() => selectMainTab('bookmark')}
          >
            <Ionicons name="bookmark-outline" size={24} color={activeMainTab === 'bookmark' ? '#FFF' : '#666'} />
            {activeMainTab === 'bookmark' && <View className="absolute bottom-0 w-full h-[2px] bg-white" />}
          </Pressable>
        )}

        {showPrivateTabs && (
          <Pressable 
            className="flex-1 py-3 items-center justify-center"
            onPress={() => selectMainTab('heart')}
          >
            <Ionicons name="heart-outline" size={24} color={activeMainTab === 'heart' ? '#FFF' : '#666'} />
            {activeMainTab === 'heart' && <View className="absolute bottom-0 w-full h-[2px] bg-white" />}
          </Pressable>
        )}
      </View>

      {/* Text Row (Only visible if Bookmark tab is active) */}
      {activeMainTab === 'bookmark' && (
        <View className="flex-row items-center border-b border-[#222]">
          <Pressable 
            className="flex-1 py-2 items-center justify-center"
            onPress={() => setActiveSavedTab('posts')}
          >
            <Text className={`text-[11px] font-semibold ${activeSavedTab === 'posts' ? 'text-white' : 'text-[#666]'}`}>
              Posts {savedPosts.length}
            </Text>
            {activeSavedTab === 'posts' && <View className="absolute bottom-0 w-full h-[2px] bg-white" />}
          </Pressable>

          <Pressable 
            className="flex-1 py-2 items-center justify-center"
            onPress={() => setActiveSavedTab('collections')}
          >
            <Text className={`text-[11px] font-semibold ${activeSavedTab === 'collections' ? 'text-white' : 'text-[#666]'}`}>
              Collection 0
            </Text>
            {activeSavedTab === 'collections' && <View className="absolute bottom-0 w-full h-[2px] bg-white" />}
          </Pressable>

          <Pressable 
            className="flex-1 py-2 items-center justify-center"
            onPress={() => setActiveSavedTab('sounds')}
          >
            <Text className={`text-[11px] font-semibold ${activeSavedTab === 'sounds' ? 'text-white' : 'text-[#666]'}`}>
              Sound 0
            </Text>
            {activeSavedTab === 'sounds' && <View className="absolute bottom-0 w-full h-[2px] bg-white" />}
          </Pressable>
        </View>
      )}

      {/* Tab Content */}
      <View className="flex-1 min-h-[300px]">
        {activeMainTab === 'grid' && (isLoadingPosts ? <LoadingTab /> : <PostsTab posts={posts} />)}
        {activeMainTab === 'heart' && (isLoadingLikedPosts ? <LoadingTab /> : <PostsTab posts={likedPosts} />)}
        {activeMainTab === 'bookmark' && activeSavedTab === 'posts' && (isLoadingSavedPosts ? <LoadingTab /> : <PostsTab posts={savedPosts} />)}
        {activeMainTab === 'bookmark' && activeSavedTab === 'collections' && <CollectionsTab />}
        {activeMainTab === 'bookmark' && activeSavedTab === 'sounds' && <SoundsTab />}
      </View>
    </View>
  );
}

function LoadingTab() {
  return (
    <View className="py-12 items-center justify-center">
      <Ionicons name="reload" size={22} color="#98FF2F" />
      <Text className="text-[#888] text-sm mt-3">Loading...</Text>
    </View>
  );
}
