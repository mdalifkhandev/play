import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { handleApiError } from '../../api/client';
import type { ContentPage } from '../../api/content-pages/content-pages.api';
import { Header } from '../ui/Header';

interface ContentPageScreenProps {
  title: string;
  loadPage: () => Promise<ContentPage>;
}

export function ContentPageScreen({ title, loadPage }: ContentPageScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 34) + 24;
  const [page, setPage] = useState<ContentPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const nextPage = await loadPage();
      setPage(nextPage);
    } catch (pageError) {
      setError(handleApiError(pageError, 'Could not load this page.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPage();
  }, []);

  return (
    <View className="flex-1 bg-[#121212]">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomPadding }}
        className="px-6 pt-16"
      >
        <Header showBackButton={true} title={title} />

        {isLoading ? (
          <View className="flex-1 items-center justify-center py-24">
            <ActivityIndicator size="large" color="#98FF2F" />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center py-24">
            <Text className="text-white text-base font-inter-semibold text-center mb-4">{error}</Text>
            <Pressable onPress={fetchPage} className="bg-[#98FF2F] rounded-full px-6 py-3">
              <Text className="text-black font-inter-bold">Try again</Text>
            </Pressable>
          </View>
        ) : page ? (
          <View className="mt-8">
            <Text className="text-white text-lg font-inter-bold mb-2">{page.title}</Text>
            {page.publishedAt ? (
              <Text className="text-gray-500 font-inter-regular text-xs mb-6">
                Updated {new Date(page.publishedAt).toLocaleDateString()}
              </Text>
            ) : null}

            {page.sections.map((section, index) => (
              <View key={`${section.order}-${section.heading}-${index}`} className="mb-6">
                {section.heading ? (
                  <Text className="text-white text-lg font-inter-bold mb-3">{section.heading}</Text>
                ) : null}
                <Text className="text-gray-400 font-inter-regular text-base leading-6">
                  {section.content}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
