import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');

  const handleSearch = (textToSearch: string) => {
    if (!textToSearch.trim()) return;
    router.push({ pathname: '/screens/search/results', params: { q: textToSearch } });
  };

  const renderSuggestions = () => (
    <View className="flex-1 px-4 mt-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white font-bold text-lg">You may like</Text>
        <Pressable className="flex-row items-center">
          <Ionicons name="refresh-outline" size={16} color="#888" />
          <Text className="text-[#888] ml-1">Refresh</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Item 1 - Green */}
        <Pressable className="flex-row justify-between items-center py-3 border-b border-[#1C1C1E]" onPress={() => handleSearch('Satoru Gojo')}>
          <View className="flex-row items-center flex-1">
            <Ionicons name="ellipse-outline" size={12} color="#98FF2F" className="mr-3" />
            <View className="ml-3">
              <Text className="text-[#98FF2F] text-base font-semibold">Satoru Gojo</Text>
              <Text className="text-[#888] text-xs">Just watched</Text>
            </View>
          </View>
          <View className="bg-[#FF7A7A] w-6 h-6 rounded-full items-center justify-center">
            <Text style={{ fontSize: 12 }}>🍑</Text>
          </View>
        </Pressable>

        {/* Item 2 - Green */}
        <Pressable className="flex-row justify-between items-center py-3 border-b border-[#1C1C1E]" onPress={() => handleSearch('Satoru Gojo')}>
          <View className="flex-row items-center flex-1">
            <Ionicons name="ellipse-outline" size={12} color="#98FF2F" className="mr-3" />
            <Text className="text-[#98FF2F] text-base font-semibold ml-3">Satoru Gojo</Text>
          </View>
          <Ionicons name="search" size={20} color="#888" />
        </Pressable>

        {/* Item 3 - White */}
        <Pressable className="flex-row justify-between items-center py-3 border-b border-[#1C1C1E]" onPress={() => handleSearch('Satoru Gojo')}>
          <View className="flex-row items-center flex-1">
            <Ionicons name="ellipse-outline" size={12} color="#FFF" className="mr-3" />
            <Text className="text-white text-base font-semibold ml-3">Satoru Gojo</Text>
          </View>
          <View className="bg-[#FF7A7A] w-6 h-6 rounded-full items-center justify-center">
            <Text style={{ fontSize: 12 }}>🍑</Text>
          </View>
        </Pressable>

        {/* Item 4 - White */}
        <Pressable className="flex-row justify-between items-center py-3 border-b border-[#1C1C1E]" onPress={() => handleSearch('Satoru Gojo')}>
          <View className="flex-row items-center flex-1">
            <Ionicons name="ellipse-outline" size={12} color="#FFF" className="mr-3" />
            <Text className="text-white text-base font-semibold ml-3">Satoru Gojo</Text>
          </View>
          <Ionicons name="search" size={20} color="#888" />
        </Pressable>
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
