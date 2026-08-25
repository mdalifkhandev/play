import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../../components/ui/Header';
import { CustomInput } from '../../../components/inputs/CustomInput';
import { handleApiError } from '../../../api/client';
import { getMe, updatePreferredLanguage } from '../../../api/profile/profile.api';
import { getPublicPlatformSettings } from '../../../api/settings/settings.api';

type LanguageOption = {
  code: string;
  name: string;
};

export default function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [savingLanguage, setSavingLanguage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLanguages = useCallback(async (refreshing = false) => {
    try {
      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);

      const [settings, profile] = await Promise.all([
        getPublicPlatformSettings(),
        getMe(),
      ]);

      const activeLanguages = (settings.languages || [])
        .filter((language) => language.active !== false && language.code && language.name)
        .map((language) => ({ code: language.code, name: language.name }));

      setLanguages(activeLanguages);
      setSelectedLanguage(profile.user.preferredLanguageCode || activeLanguages[0]?.code || 'en');
    } catch (error) {
      console.error('Failed to load languages:', error);
      Alert.alert('Alert', handleApiError(error, 'Languages could not be loaded.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  const filteredLanguages = useMemo(
    () => languages.filter((lang) => lang.name.toLowerCase().includes(search.toLowerCase())),
    [languages, search],
  );

  const handleSelectLanguage = useCallback(async (languageCode: string) => {
    if (savingLanguage || selectedLanguage === languageCode) return;

    const previousLanguage = selectedLanguage;
    setSelectedLanguage(languageCode);
    setSavingLanguage(languageCode);

    try {
      await updatePreferredLanguage(languageCode);
    } catch (error) {
      setSelectedLanguage(previousLanguage);
      console.error('Failed to update language:', error);
      Alert.alert('Alert', handleApiError(error, 'Language could not be updated.'));
    } finally {
      setSavingLanguage(null);
    }
  }, [savingLanguage, selectedLanguage]);

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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadLanguages(true)} tintColor="#98D83A" />}
        >
          {isLoading ? (
            <View className="py-10 items-center">
              <ActivityIndicator color="#98D83A" />
            </View>
          ) : filteredLanguages.length === 0 ? (
            <Text className="text-[#888] text-center py-10">No languages found.</Text>
          ) : null}

          {filteredLanguages.map((lang, index) => {
            const isSelected = selectedLanguage === lang.code;
            const isSaving = savingLanguage === lang.code;
            return (
              <Pressable
                key={`${lang.code}-${index}`}
                onPress={() => handleSelectLanguage(lang.code)}
                disabled={Boolean(savingLanguage)}
                className={`flex-row items-center justify-between bg-[#1C1C1E] rounded-xl px-4 py-4 mb-3 border ${isSelected ? 'border-transparent' : 'border-[#333]'}`}
              >
                <Text className="text-white text-base font-inter-medium">{lang.name}</Text>
                {isSaving ? (
                  <ActivityIndicator color="#98D83A" />
                ) : (
                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'border-[#98D83A]' : 'border-gray-300 bg-white'}`}
                  >
                    {isSelected && <View className="w-3 h-3 rounded-full bg-[#98D83A]" />}
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
