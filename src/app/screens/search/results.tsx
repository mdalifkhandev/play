import { Ionicons } from '@expo/vector-icons';
import { AudioPlayer, createAudioPlayer } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiveGridItem, LiveStreamData } from '../../../components/live/LiveGridItem';

const MOCK_SOUNDS = [
  { id: '1', title: 'Summer Vibes', author: 'DJ Motin', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', time: '00:15', usage: '1.5M' },
  { id: '2', title: 'Funny Background', author: 'Comedy Central', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', time: '00:08', usage: '2.1M' },
  { id: '3', title: 'Epic Trailer', author: 'Movie Tunes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', time: '00:30', usage: '500K' },
  { id: '4', title: 'Chill Lo-Fi', author: 'Sleepy', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', time: '01:00', usage: '3M' },
];

const MOCK_SEARCH_RESULTS: LiveStreamData[] = [
  {
    id: '1',
    thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400',
    badge: 'Live',
    title: 'Norway beat Brazil 2-1 in the Round of 16 of the 202...',
    hostName: 'Motin',
    hostAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100',
    date: '14 Aug 2026',
    likes: '12k',
    isVideo: true,
    videoUrl: require('../../../../assets/videos/mov_bbb.mp4'),
    viewers: '12k',
  },
  {
    id: '2',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
    badge: 'Top like',
    title: 'Norway beat Brazil 2-1 in the Round of 16 of the 202...',
    hostName: 'Motin',
    hostAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100',
    date: '14 Aug 2026',
    likes: '12k',
    isVideo: true,
    videoUrl: require('../../../../assets/videos/mov_bbb.mp4'),
    viewers: '8k',
  },
  {
    id: '3',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400',
    badge: 'Live',
    title: 'Norway beat Brazil 2-1 in the Round of 16 of the 202...',
    hostName: 'Motin',
    hostAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100',
    date: '14 Aug 2026',
    likes: '12k',
    isVideo: true,
    videoUrl: require('../../../../assets/videos/mov_bbb.mp4'),
    viewers: '12k',
  },
  {
    id: '4',
    thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400',
    badge: 'Live',
    title: 'Norway beat Brazil 2-1 in the Round of 16 of the 202...',
    hostName: 'Motin',
    hostAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100',
    date: '14 Aug 2026',
    likes: '12k',
    viewers: '12k',
    isVideo: true,
    videoUrl: require('../../../../assets/videos/mov_bbb.mp4'),
  },
];

const TABS = ['Top', 'Users', 'Video', 'Photo', 'Sound', 'Hashtags'];
const FILTERS = ['All', 'Unwatch', 'Watch', 'Recent uploaded'];

export default function SearchResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { q } = useLocalSearchParams<{ q: string }>();

  const [query, setQuery] = useState(q || '');
  const [activeTab, setActiveTab] = useState('Top');
  const [activeFilter, setActiveFilter] = useState('All');

  const [sound, setSound] = useState<AudioPlayer | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    return sound
      ? () => {
        sound.remove();
      }
      : undefined;
  }, [sound]);

  const toggleSound = (item: typeof MOCK_SOUNDS[0]) => {
    if (playingId === item.id || loadingId === item.id) {
      if (sound) {
        sound.pause();
        sound.remove();
        setSound(null);
      }
      setPlayingId(null);
      setLoadingId(null);
      return;
    }

    if (sound) {
      sound.pause();
      sound.remove();
      setSound(null);
    }

    setLoadingId(item.id);
    setPlayingId(null);

    try {
      const newSound = createAudioPlayer(item.url);
      newSound.play();
      setSound(newSound);

      newSound.addListener('playbackStatusUpdate', (status) => {
        if (status.isLoaded && status.playing) {
          setLoadingId(null);
          setPlayingId(item.id);
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

  return (
    <View className="flex-1 bg-black">
      {/* Header with Search Bar */}
      <View
        className="flex-row items-center px-4 pt-4 pb-2"
        style={{ paddingTop: insets.top + 10 }}
      >
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

        <Pressable className="ml-3">
          <Ionicons name="ellipsis-horizontal" size={24} color="#FFF" />
        </Pressable>
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

      {/* Filters */}
      <View className="py-3 px-4 border-b border-[#2A2A2A]">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={`mr-3 px-4 py-1.5 rounded-md ${activeFilter === filter ? 'bg-[#98FF2F]' : 'bg-[#2A2A2A]'}`}
            >
              <Text className={`font-semibold text-sm ${activeFilter === filter ? 'text-black' : 'text-[#888]'}`}>{filter}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <View className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Results Grid - Top Row */}
          <View className="flex-row flex-wrap justify-between px-4 pt-4">
            <LiveGridItem item={MOCK_SEARCH_RESULTS[0]} variant="search" />
            <LiveGridItem item={MOCK_SEARCH_RESULTS[1]} variant="search" />
            <LiveGridItem item={MOCK_SEARCH_RESULTS[2]} variant="search" />
            <LiveGridItem item={MOCK_SEARCH_RESULTS[3]} variant="search" />
          </View>

          {/* Sound Section */}
          {activeTab === 'Top' && (
            <View className="mt-2 mb-4">
              <View className="flex-row justify-between items-center px-4 mb-3">
                <Text className="text-white font-bold text-lg">Sound</Text>
                <Pressable className="flex-row items-center" onPress={() => router.push('/screens/sound')}>
                  <Text className="text-[#888] text-sm mr-1">View all</Text>
                  <Ionicons name="chevron-forward" size={14} color="#888" />
                </Pressable>
              </View>

              {/* Sound Items List */}
              {MOCK_SOUNDS.slice(0, 3).map((item) => (
                <Pressable
                  key={item.id}
                  className="flex-row items-center justify-between px-4 py-2"
                  onPress={() => {
                    if (sound) sound.remove();
                    router.push({ pathname: '/(tab)/create', params: { soundUrl: item.url, title: item.title } });
                  }}
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 rounded-lg bg-[#2A2A2A] mr-3 items-center justify-center relative overflow-hidden">
                      <Ionicons name="musical-notes" size={24} color="#98FF2F" />
                      {playingId === item.id && (
                        <View className="absolute inset-0 bg-black/50 items-center justify-center">
                          <Ionicons name="stats-chart" size={20} color="#98FF2F" />
                        </View>
                      )}
                    </View>
                    <View>
                      <Text className="text-white font-semibold text-sm">{item.title}</Text>
                      <Text className="text-[#888] text-xs mt-1">{item.time} • {item.usage} video</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => toggleSound(item)}
                    className={`h-8 w-8 rounded-full items-center justify-center ${playingId === item.id ? 'bg-[#FF3333]' : 'bg-[#98FF2F]'}`}
                  >
                    {loadingId === item.id ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Ionicons
                        name={playingId === item.id ? "stop" : "play"}
                        size={16}
                        color={playingId === item.id ? "#FFF" : "#000"}
                      />
                    )}
                  </Pressable>
                </Pressable>
              ))}
            </View>
          )}

          {/* Results Grid - Bottom Row */}
          <View className="flex-row flex-wrap justify-between px-4 pt-4">
            <LiveGridItem item={MOCK_SEARCH_RESULTS[0]} variant="search" />
            <LiveGridItem item={MOCK_SEARCH_RESULTS[1]} variant="search" />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
