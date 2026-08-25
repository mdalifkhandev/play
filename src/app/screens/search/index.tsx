import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getKidsFeed, searchReels } from '../../../api/reels/reels.api';

type SearchSuggestion = {
  id: string;
  title: string;
  subtitle?: string;
  highlighted?: boolean;
};

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  const mapReelToSuggestion = (reel: any, highlighted = false): SearchSuggestion => ({
    id: reel.id,
    title: reel.caption?.trim() || reel.user?.displayName || reel.user?.username || reel.owner?.displayName || reel.owner?.username || 'Video',
    subtitle: reel.caption?.trim() ? reel.user?.displayName || reel.user?.username || reel.owner?.displayName || reel.owner?.username || 'Video' : 'Video',
    highlighted,
  });

  const loadSuggestions = async (text = query) => {
    const trimmed = text.trim();
    try {
      setIsLoadingSuggestions(true);
      if (trimmed) {
        const data = await searchReels(trimmed, 1, 8);
        setSuggestions((data.reels || []).map((reel: any, index: number) => mapReelToSuggestion(reel, index < 2)));
        return;
      }

      const data = await getKidsFeed();
      setSuggestions((data.items || []).slice(0, 8).map((reel: any, index: number) => ({
        ...mapReelToSuggestion(reel, index < 2),
        subtitle: index === 0 ? 'Just watched' : mapReelToSuggestion(reel).subtitle,
      })));
    } catch (error) {
      console.error('Failed to load search suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSuggestions(query);
    }, query.trim() ? 350 : 0);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (textToSearch: string) => {
    if (!textToSearch.trim()) return;
    router.push({ pathname: '/screens/search/results', params: { q: textToSearch } });
  };

  const renderSuggestions = () => (
    <View className="flex-1 px-4 mt-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white font-bold text-lg">You may like</Text>
        <Pressable className="flex-row items-center" onPress={() => loadSuggestions()}>
          <Ionicons name="refresh-outline" size={16} color="#888" />
          <Text className="text-[#888] ml-1">Refresh</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {isLoadingSuggestions ? (
          <View className="items-center py-8">
            <ActivityIndicator color="#98FF2F" />
          </View>
        ) : suggestions.length > 0 ? (
          suggestions.map((item) => (
            <Pressable
              key={item.id}
              className="flex-row justify-between items-center py-3 border-b border-[#1C1C1E]"
              onPress={() => handleSearch(item.title)}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="ellipse-outline" size={12} color={item.highlighted ? '#98FF2F' : '#FFF'} className="mr-3" />
                <View className="ml-3 flex-1">
                  <Text
                    className={`${item.highlighted ? 'text-[#98FF2F]' : 'text-white'} text-base font-semibold`}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text className="text-[#888] text-xs" numberOfLines={1}>{item.subtitle}</Text>
                  ) : null}
                </View>
              </View>
              <Ionicons name="search" size={20} color="#888" />
            </Pressable>
          ))
        ) : (
          <View className="items-center py-12">
            <Ionicons name="search-outline" size={36} color="#555" />
            <Text className="text-[#888] mt-3">No suggestions found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

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

        <View className="flex-1 flex-row items-center bg-[#2A2A2A] rounded-[8px] px-3 h-12">
          <Image
            source={require('@/assets/icon/search.svg')}
            style={{ width: 20, height: 20 }}
            contentFit='contain'

          />
          <TextInput
            className="flex-1 ml-1 text-base"
            style={{ color: '#FFF', verticalAlign: 'middle' }}
            placeholder="Search..."
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch(query)}
            returnKeyType="search"
          />
        </View>

        <Pressable onPress={() => handleSearch(query)} className="ml-3">
          <Text className="text-[#98FF2F] font-semibold">Search</Text>
        </Pressable>
      </View>

      {/* Main Content Area */}
      {renderSuggestions()}
    </View>
  );
}
