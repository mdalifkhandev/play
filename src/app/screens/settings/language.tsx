import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../../components/ui/Header';
import { CustomInput } from '../../../components/inputs/CustomInput';

const LANGUAGES = [
  { id: '1', name: 'English' },
  { id: '2', name: 'Spanish' },
  { id: '3', name: 'French' },
  { id: '4', name: 'German' },
  { id: '5', name: 'Italian' },
];

export default function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('1');

  const filteredLanguages = LANGUAGES.filter(lang => 
    lang.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-[#121212]">
      <Header showBackButton={true} title="Language" containerStyle="px-6 mt-2" />

      <View className="flex-1 px-6 mt-8">
        <CustomInput
          placeholder="Search by name"
          value={search}
          onChangeText={setSearch}
          leftIconComponent={<Ionicons name="search-outline" size={20} color="#888" />}
          containerStyle="mb-6"
          inputContainerStyle="bg-[#1C1C1E] border border-[#333]"
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          {filteredLanguages.map((lang, index) => {
            const isSelected = selectedLanguage === lang.id;
            return (
              <Pressable
                key={lang.id}
                onPress={() => setSelectedLanguage(lang.id)}
                className={`flex-row items-center justify-between bg-[#1C1C1E] rounded-xl px-4 py-4 mb-3 border ${isSelected ? 'border-transparent' : 'border-[#333]'}`}
              >
                <Text className="text-white text-base font-inter-medium">{lang.name}</Text>
                <View 
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'border-[#98D83A]' : 'border-gray-300 bg-white'}`}
                >
                  {isSelected && <View className="w-3 h-3 rounded-full bg-[#98D83A]" />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
