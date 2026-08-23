import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { handleApiError } from '../../api/client';
import { discoverUsers, followUser, unfollowUser } from '../../api/profile/profile.api';
import type { DiscoverUser } from '../../api/profile/profile.types';
import { Header } from '../../components/ui/Header';
import { avatarSource } from '../../utils/avatar';

export default function FindFriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyUserIds, setBusyUserIds] = useState<Record<string, boolean>>({});

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  const loadUsers = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const response = await discoverUsers(trimmedQuery);
      setUsers(response.items || []);
    } catch (error) {
      toast.error(handleApiError(error, 'Could not load users.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [trimmedQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadUsers();
    }, trimmedQuery ? 250 : 0);

    return () => clearTimeout(timeout);
  }, [loadUsers, trimmedQuery]);

  const openProfile = useCallback((user: DiscoverUser) => {
    const profileKey = user.username || user.id;
    router.push(`/screens/user/${encodeURIComponent(profileKey)}`);
  }, [router]);

  const toggleFollow = useCallback(async (user: DiscoverUser) => {
    if (busyUserIds[user.id]) return;

    const nextFollowing = !user.isFollowing;
    setBusyUserIds(current => ({ ...current, [user.id]: true }));
    setUsers(current => current.map(item => (
      item.id === user.id ? { ...item, isFollowing: nextFollowing } : item
    )));

    try {
      const result = nextFollowing ? await followUser(user.id) : await unfollowUser(user.id);
      setUsers(current => current.map(item => (
        item.id === user.id ? { ...item, isFollowing: result.isFollowing } : item
      )));
    } catch (error) {
      setUsers(current => current.map(item => (
        item.id === user.id ? { ...item, isFollowing: user.isFollowing } : item
      )));
      toast.error(handleApiError(error, nextFollowing ? 'Failed to follow user.' : 'Failed to unfollow user.'));
    } finally {
      setBusyUserIds(current => {
        const next = { ...current };
        delete next[user.id];
        return next;
      });
    }
  }, [busyUserIds]);

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Find Friends" containerStyle="mb-2" />

      <View className="mx-4 mb-3 h-12 flex-row items-center rounded-2xl bg-white/10 px-4">
        <Ionicons name="search-outline" size={20} color="#A3A3A3" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search name, username or email"
          placeholderTextColor="#777"
          className="ml-3 flex-1 text-white font-inter-regular"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} className="h-8 w-8 items-center justify-center">
            <Ionicons name="close-circle" size={20} color="#777" />
          </Pressable>
        )}
      </View>

      {isLoading && users.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#98FF2F" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadUsers(true)}
              tintColor="#98FF2F"
              colors={['#98FF2F']}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="people-outline" size={42} color="#666" />
              <Text className="mt-4 text-white text-base font-inter-semibold">No users found</Text>
              <Text className="mt-1 text-center text-gray-400 text-sm">Try another name, username or email.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const username = item.username ? `@${item.username}` : item.email || 'User';
            const isBusy = Boolean(busyUserIds[item.id]);

            return (
              <Pressable
                onPress={() => openProfile(item)}
                className="mb-3 flex-row items-center rounded-2xl bg-white/[0.06] py-3 pl-2 pr-3"
              >
                <View className="h-[60px] w-[60px] items-center justify-center rounded-full bg-white/10">
                  <Image source={avatarSource(item.avatarUrl)} className="h-14 w-14 rounded-full" contentFit="cover" />
                </View>

                <View className="ml-3 flex-1">
                  <Text numberOfLines={1} className="text-white text-base font-inter-bold">
                    {item.displayName}
                  </Text>
                  <Text numberOfLines={1} className="mt-0.5 text-gray-400 text-sm font-inter-regular">
                    {username}
                  </Text>
                  {item.bio ? (
                    <Text numberOfLines={1} className="mt-1 text-gray-500 text-xs font-inter-regular">
                      {item.bio}
                    </Text>
                  ) : null}
                </View>

                <Pressable
                  disabled={isBusy}
                  onPress={(event) => {
                    event.stopPropagation();
                    void toggleFollow(item);
                  }}
                  className={`ml-3 h-9 min-w-[92px] items-center justify-center rounded-full px-4 ${
                    item.isFollowing ? 'bg-white/10 border border-white/25' : 'bg-[#98FF2F]'
                  }`}
                >
                  {isBusy ? (
                    <ActivityIndicator size="small" color={item.isFollowing ? '#FFF' : '#000'} />
                  ) : (
                    <Text className={`text-sm font-inter-bold ${item.isFollowing ? 'text-white' : 'text-black'}`}>
                      {item.isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  )}
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
