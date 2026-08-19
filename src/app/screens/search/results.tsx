import { Ionicons } from '@expo/vector-icons';
import { AudioPlayer, createAudioPlayer } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { LiveGridItem, LiveStreamData } from '../../../components/live/LiveGridItem';
import { liveStreamApi } from '../../../api/live-streams/live-stream.api';
import { searchReels } from '../../../api/reels/reels.api';
import { searchConversationUsers } from '../../../api/conversations/conversation.api';
import { searchMusicTracks } from '../../../api/music/music.api';
import { SoundListItem } from '../../../components/ui/SoundListItem';
import { avatarSource } from '../../../utils/avatar';

const TABS = ['Top', 'Users', 'Video', 'Live', 'Sound'];

export default function SearchResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { q } = useLocalSearchParams<{ q: string }>();

  const [query, setQuery] = useState(q || '');
  const [activeTab, setActiveTab] = useState('Top');

  // Queries
  const { data: streamsData, isLoading: isLoadingStreams } = useQuery({
    queryKey: ['searchStreams', q],
    queryFn: () => liveStreamApi.searchStreams(q as string),
    enabled: !!q && (activeTab === 'Top' || activeTab === 'Live'),
  });

  const { data: reelsData, isLoading: isLoadingReels } = useQuery({
    queryKey: ['searchReels', q],
    queryFn: () => searchReels(q as string),
    enabled: !!q && (activeTab === 'Top' || activeTab === 'Video'),
  });

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['searchUsers', q],
    queryFn: () => searchConversationUsers(q as string),
    enabled: !!q && (activeTab === 'Top' || activeTab === 'Users'),
  });

  const { data: musicData, isLoading: isLoadingMusic } = useQuery({
    queryKey: ['searchMusic', q],
    queryFn: () => searchMusicTracks({ search: q as string }),
    enabled: !!q && (activeTab === 'Top' || activeTab === 'Sound'),
  });

  const [sound, setSound] = useState<AudioPlayer | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  const activePlayerRef = useRef<any>(null);
  const isPlayerReadyRef = useRef<boolean>(false);
  const lastTapRef = useRef<number>(0);

  const stopActivePlayer = useCallback(() => {
    const player = activePlayerRef.current;
    const isReady = isPlayerReadyRef.current;
    
    activePlayerRef.current = null;
    isPlayerReadyRef.current = false;
    
    if (!player) return;

    if (!isReady) {
      setTimeout(() => {
        try { player.pause(); } catch (e) {}
        try { player.remove(); } catch (e) {
          try { player.release(); } catch (e2) {}
        }
      }, 1000);
      return;
    }

    try { player.pause(); } catch (e) {}
    try { player.remove(); } catch (e) {
      try { player.release(); } catch (e2) {}
    }
  }, []);

  useEffect(() => {
    return () => {
      stopActivePlayer();
    };
  }, [stopActivePlayer]);

  const toggleSound = (item: any) => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) return;
    lastTapRef.current = now;

    if (playingId === item.providerTrackId || loadingId === item.providerTrackId) {
      stopActivePlayer();
      setPlayingId(null);
      setLoadingId(null);
      setSound(null);
      return;
    }

    stopActivePlayer();
    setSound(null);

    setLoadingId(item.providerTrackId);
    setPlayingId(null);

    try {
      const newSound = createAudioPlayer(item.audioPreviewUrl);
      activePlayerRef.current = newSound;
      isPlayerReadyRef.current = false;
      newSound.play();
      setSound(newSound);

      newSound.addListener('playbackStatusUpdate', (status) => {
        if (activePlayerRef.current !== newSound) return;
        
        if (status.isLoaded) {
          isPlayerReadyRef.current = true;
        }
        
        if (status.isLoaded && status.playing) {
          setLoadingId(null);
          setPlayingId(item.providerTrackId);
        }
        if (status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (e) {
      console.log('Error playing sound', e);
      setLoadingId(null);
    }
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    router.setParams({ q: query });
  };

  const mapStreamToGridItem = (s: any): LiveStreamData => ({
    id: s.id,
    thumbnail: s.coverImage || '',
    badge: s.status === 'LIVE' ? 'Live' : 'Ended',
    title: s.title,
    hostName: s.hostId?.displayName || s.hostId?.username || 'Host',
    hostAvatar: s.hostId?.avatarUrl || '',
    date: s.startedAt ? new Date(s.startedAt).toLocaleDateString() : '',
    likes: s.likesCount?.toString() || '0',
    isVideo: false,
    viewers: s.viewerCount?.toString() || '0',
  });

  const mapReelToGridItem = (r: any): LiveStreamData => ({
    id: r.id,
    thumbnail: r.thumbnailUrl || '',
    badge: 'Video',
    title: r.caption || 'Video',
    hostName: r.user?.displayName || r.user?.username || r.owner?.displayName || r.owner?.username || 'User',
    hostAvatar: r.user?.avatarUrl || r.owner?.photoUrl || '',
    date: r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''),
    likes: r.stats?.likes?.toString() || r.likeCount?.toString() || '0',
    isVideo: true,
    videoUrl: r.videoUrl || r.media?.processedUrl || r.media?.rawUrl || '',
    viewers: r.stats?.views?.toString() || r.viewCount?.toString() || '0',
  });

  const isSearching = isLoadingUsers || isLoadingStreams || isLoadingReels || isLoadingMusic;

  return (
    <View className="flex-1 bg-black">
      {/* Header with Search Bar */}
      <View className="flex-row items-center px-4 pt-4 pb-2" style={{ paddingTop: insets.top + 10 }}>
        <Pressable onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </Pressable>

        <View className="flex-1 flex-row items-center bg-[#2A2A2A] rounded-md px-3 h-10">
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            className="flex-1 ml-2 text-base p-0"
            style={{ color: '#FFF', verticalAlign: 'middle' }}
            placeholder="Search..."
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Tabs */}
      <View className="border-b border-[#2A2A2A]">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="mr-6 py-3 border-b-2"
              style={{ borderBottomColor: activeTab === tab ? '#98FF2F' : 'transparent' }}
            >
              <Text className={`font-semibold ${activeTab === tab ? 'text-white' : 'text-[#888]'}`}>{tab}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <View className="flex-1">
        {isSearching && (
          <View className="pt-10">
            <ActivityIndicator size="large" color="#98FF2F" />
          </View>
        )}

        {!isSearching && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            
            {/* Users Section */}
            {/* Live Section */}
            {(activeTab === 'Top' || activeTab === 'Live') && streamsData?.streams && streamsData.streams.length > 0 && (
              <View className="mt-4 mb-2">
                <Text className="text-white font-bold text-lg px-4 mb-3">Live Streams</Text>
                <View className="flex-row flex-wrap justify-between px-4">
                  {streamsData.streams.slice(0, activeTab === 'Top' ? 2 : undefined).map((s: any) => (
                    <LiveGridItem key={s.id} item={mapStreamToGridItem(s)} variant="search" />
                  ))}
                </View>
              </View>
            )}

            {/* Sound Section */}
            {(activeTab === 'Top' || activeTab === 'Sound') && musicData?.tracks && musicData.tracks.length > 0 && (
              <View className="mt-4 mb-4">
                <Text className="text-white font-bold text-lg px-4 mb-3">Sounds</Text>

                {musicData.tracks.slice(0, activeTab === 'Top' ? 3 : undefined).map((item) => (
                  <SoundListItem
                    key={item.providerTrackId}
                    item={item}
                    playingId={playingId}
                    loadingId={loadingId}
                    onSelect={() => {
                      if (sound) sound.remove();
                      router.push({ pathname: '/(tab)/create', params: { soundUrl: item.audioPreviewUrl, title: item.title } });
                    }}
                    onTogglePlay={() => toggleSound(item)}
                  />
                ))}
              </View>
            )}

            {/* Videos Section */}
            {(activeTab === 'Top' || activeTab === 'Video') && reelsData?.reels && reelsData.reels.length > 0 && (
              <View className="mt-4 mb-2">
                <Text className="text-white font-bold text-lg px-4 mb-3">Videos</Text>
                <View className="flex-row flex-wrap justify-between px-4">
                  {reelsData.reels.slice(0, activeTab === 'Top' ? 4 : undefined).map((r: any) => (
                    <LiveGridItem key={r.id} item={mapReelToGridItem(r)} variant="search" />
                  ))}
                </View>
              </View>
            )}

            {/* Users Section */}
            {(activeTab === 'Top' || activeTab === 'Users') && usersData && usersData.length > 0 && (
              <View className="mt-4 mb-2">
                <Text className="text-white font-bold text-lg px-4 mb-3">Users</Text>
                {usersData.slice(0, activeTab === 'Top' ? 3 : undefined).map((u) => (
                  <Pressable key={u.id} className="flex-row items-center justify-between px-4 py-3 border-b border-[#1C1C1E]" onPress={() => router.push({ pathname: '/screens/user/[id]', params: { id: u.id } })}>
                    <View className="flex-row items-center">
                      <Image source={avatarSource(u.avatarUrl)} style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }} />
                      <View>
                        <Text className="text-white font-semibold text-base">{u.displayName || u.username}</Text>
                        <Text className="text-[#888] text-sm">@{u.username}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Removed trailing sound/video blocks because they are moved up */}

            {/* Empty States */}
            {(!usersData || usersData.length === 0) &&
              (!streamsData?.streams || streamsData.streams.length === 0) &&
              (!reelsData?.reels || reelsData.reels.length === 0) &&
              (!musicData?.tracks || musicData.tracks.length === 0) && (
              <View className="flex-1 items-center justify-center pt-20">
                <Ionicons name="search-outline" size={48} color="#444" />
                <Text className="text-[#888] mt-4">No results found for "{q}"</Text>
              </View>
            )}

          </ScrollView>
        )}
      </View>
    </View>
  );
}
