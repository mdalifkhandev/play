import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store';
import {
  createConversation,
  fetchConversations,
  fetchRecommendedUsers,
  searchConversationUsers,
} from '../../api/conversations/conversation.api';
import { avatarSource } from '../../utils/avatar';

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentUserId = useAppStore((s) => s.user?.id);
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const convData = await fetchConversations();
      
      // Transform backend response to match UI
      const transformed = convData.items.map((c: any) => {
        // Backend returns participants as array; find the other user
        const other = c.participants?.find((p: any) => p.id !== currentUserId) || c.participant;
        return {
          id: c.id,
          userId: other?.id,
          name: other?.displayName || other?.username || 'User',
          username: other?.username,
          lastMessage: c.lastMessage?.text || 'No messages yet',
          time: formatTimeAgo(c.updatedAt || c.lastMessage?.createdAt || c.createdAt),
          unread: c.unreadCount || 0,
          avatar: other?.avatarUrl,
          isOnline: other?.isOnline,
        };
      });
      
      setConversations(transformed);
      
      // Load recommended users
      const recData = await fetchRecommendedUsers();
      setRecommended(recData);
    } catch (err) {
      console.error('Failed to load inbox:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUserId]);

  const openRecommendedChat = async (targetUserId: string) => {
    try {
      const conversation = await createConversation(targetUserId);
      const partner = conversation.participant;
      router.push({
        pathname: '/screens/chat/[id]',
        params: {
          id: conversation.id,
          userId: partner?.id || targetUserId,
          name: partner?.displayName || partner?.username || 'User',
          username: partner?.username || '',
          avatar: partner?.avatarUrl || '',
        },
      });
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isSearchOpen || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await searchConversationUsers(searchQuery);
        if (!isCancelled) {
          setSearchResults(results);
        }
      } catch (error) {
        console.error('Failed to search users:', error);
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isSearchOpen, searchQuery]);

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => setShowNewChat(!showNewChat)}>
          <Image source={require('../../../assets/icon/user-add.svg')} style={{ width: 24, height: 24, tintColor: '#FFF' }} contentFit="contain" />
        </Pressable>
        <Text className="text-white text-lg font-bold">Inbox</Text>
        <Pressable
          onPress={() => {
            setIsSearchOpen((value) => !value);
            setSearchQuery('');
            setSearchResults([]);
          }}
        >
          <Image source={require('../../../assets/icon/search.svg')} style={{ width: 24, height: 24, tintColor: '#FFF' }} contentFit="contain" />
        </Pressable>
      </View>

      {isSearchOpen && (
        <View className="px-4 pb-3">
          <View className="h-11 rounded-full bg-[#1C1C1E] px-4 flex-row items-center">
            <Ionicons name="search" size={18} color="#888" />
            <TextInput
              className="flex-1 text-white ml-3"
              placeholder="Search people..."
              placeholderTextColor="#777"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#777" />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#A3E635" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={loadData}
              tintColor="#A3E635"
              colors={["#A3E635"]}
            />
          }
        >
          <View style={{ paddingBottom: 20 }}>
            {isSearchOpen && searchQuery.trim().length >= 2 && (
              <View>
                <Text className="text-white font-semibold text-lg px-4 mt-2 mb-2">Search results</Text>
                {isSearching ? (
                  <View className="py-8">
                    <ActivityIndicator size="small" color="#A3E635" />
                  </View>
                ) : searchResults.length === 0 ? (
                  <Text className="text-[#888] text-sm px-4 py-4">No people found</Text>
                ) : (
                  searchResults.map((user) => (
                    <Pressable key={user.id} className="flex-row items-center justify-between px-4 py-3" onPress={() => openRecommendedChat(user.id)}>
                      <View className="flex-row items-center flex-1">
                        <Image
                          source={avatarSource(user.avatarUrl)}
                          style={{ width: 56, height: 56, borderRadius: 28, marginRight: 12 }}
                          contentFit="cover"
                        />
                        <View className="flex-1 pr-4">
                          <Text className="text-white font-bold text-base mb-1">{user.displayName}</Text>
                          <Text className="text-[#888] text-sm" numberOfLines={1}>{user.reason}</Text>
                        </View>
                      </View>
                      <Pressable className="bg-[#A3E635] px-4 py-1.5 rounded-full" onPress={() => openRecommendedChat(user.id)}>
                        <Text className="text-black font-semibold text-sm">Message</Text>
                      </Pressable>
                    </Pressable>
                  ))
                )}
              </View>
            )}

            {/* Chats List */}
            {!isSearchOpen && conversations.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Ionicons name="chatbubbles-outline" size={64} color="#333" />
                <Text className="text-[#888] text-sm mt-4">No conversations yet</Text>
              </View>
            ) : !isSearchOpen ? (
              conversations.map((chat) => (
                <Link
                  key={chat.id}
                  href={{
                    pathname: '/screens/chat/[id]',
                    params: {
                      id: chat.id,
                      userId: chat.userId || '',
                      name: chat.name,
                      username: chat.username || '',
                      avatar: chat.avatar || '',
                    },
                  }}
                  asChild
                >
                  <Pressable className="flex-row items-center justify-between px-4 py-3">
                    <View className="flex-row items-center flex-1">
                      <View className="relative">
                        <Image
                          source={avatarSource(chat.avatar)}
                          style={{ width: 56, height: 56, borderRadius: 28, marginRight: 12 }}
                          contentFit="cover"
                        />
                        {chat.isOnline && (
                          <View className="absolute bottom-0 right-0 w-3 h-3 bg-[#A3E635] rounded-full border-2 border-[#0A0A0A]" />
                        )}
                      </View>
                      <View className="flex-1 pr-4">
                        <Text className="text-white font-bold text-base mb-1">{chat.name}</Text>
                        <View className="flex-row items-center">
                          <Text className="text-[#888] text-sm flex-1" numberOfLines={1}>{chat.lastMessage}</Text>
                          <Text className="text-[#888] text-xs ml-1">• {chat.time}</Text>
                        </View>
                      </View>
                    </View>
                    {chat.unread > 0 && (
                      <View className="w-6 h-6 bg-[#A3E635] rounded-full items-center justify-center">
                        <Text className="text-black font-bold text-xs">{chat.unread}</Text>
                      </View>
                    )}
                  </Pressable>
                </Link>
              ))
            ) : null}

            {/* Recommended for you */}
            {!isSearchOpen && recommended.length > 0 && (
              <>
                <Text className="text-white font-semibold text-lg px-4 mt-6 mb-2">Recommended for you</Text>
                
                {recommended.map((user) => (
                  <Pressable key={user.id} className="flex-row items-center justify-between px-4 py-3" onPress={() => openRecommendedChat(user.id)}>
                    <View className="flex-row items-center flex-1">
                      <Image
                        source={avatarSource(user.avatarUrl)}
                        style={{ width: 56, height: 56, borderRadius: 28, marginRight: 12 }}
                        contentFit="cover"
                      />
                      <View className="flex-1 pr-4">
                        <Text className="text-white font-bold text-base mb-1">{user.displayName}</Text>
                        <Text className="text-[#888] text-sm" numberOfLines={1}>{user.reason}</Text>
                      </View>
                    </View>
                    <Pressable className="bg-[#A3E635] px-4 py-1.5 rounded-full" onPress={() => openRecommendedChat(user.id)}>
                      <Text className="text-black font-semibold text-sm">Message</Text>
                    </Pressable>
                  </Pressable>
                ))}
              </>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
