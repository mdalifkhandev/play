import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polyline } from 'react-native-svg';
import { getMyCreatorAnalytics, type CreatorAnalytics, type CreatorAnalyticsRange } from '../../../api/creators';
import { handleApiError } from '../../../api/client';

const CHIPS: { label: string; value: CreatorAnalyticsRange }[] = [
  { label: '7 days', value: '7d' },
  { label: '28 days', value: '28d' },
  { label: '60 days', value: '60d' },
  { label: '90 days', value: '90d' },
];

export default function AnalyticScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<CreatorAnalyticsRange>('7d');
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async ({ refresh = false, nextRange = range }: { refresh?: boolean; nextRange?: CreatorAnalyticsRange } = {}) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await getMyCreatorAnalytics(nextRange);
      setAnalytics(data);
    } catch (loadError) {
      setError(handleApiError(loadError, 'Could not load analytics.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const metrics = useMemo(() => {
    const summary = analytics?.summary;
    return [
      { title: 'Post views', value: formatNumber(summary?.views ?? 0), change: `${formatNumber(summary?.reels ?? 0)} posts` },
      { title: 'Followers', value: formatNumber(summary?.followers ?? 0), change: `+${formatNumber(summary?.newFollowers ?? 0)}` },
      { title: 'Likes', value: formatNumber(summary?.likes ?? 0), change: `${formatNumber(summary?.comments ?? 0)} comments` },
      { title: 'Shares', value: formatNumber(summary?.shares ?? 0), change: `${formatNumber(summary?.saves ?? 0)} saves` },
      { title: 'Engagement', value: `${summary?.engagementRate ?? 0}%`, change: `$${formatMoney(summary?.earningsUsd ?? 0)}` },
    ];
  }, [analytics]);

  const chartPoints = useMemo(() => buildChartPoints(analytics?.trend.map((item) => item.views) ?? []), [analytics]);
  const dateLabel = analytics?.trend.length
    ? `${formatShortDate(analytics.trend[0].date)} - ${formatShortDate(analytics.trend[analytics.trend.length - 1].date)}`
    : '';

  const selectRange = (nextRange: CreatorAnalyticsRange) => {
    setRange(nextRange);
    void loadAnalytics({ nextRange });
  };

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-3 mt-4 mb-3">
        <View className="w-10 h-10 justify-center">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
        </View>
        <Text className="text-white text-base font-bold flex-1 text-center">Analytic</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadAnalytics({ refresh: true })}
            tintColor="#98FF2F"
            colors={['#98FF2F']}
          />
        }
      >
        <View className="mb-6 mt-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {CHIPS.map((chip) => (
              <Pressable
                key={chip.value}
                onPress={() => selectRange(chip.value)}
                className={`px-4 py-1.5 rounded-full mr-3 ${range === chip.value ? 'bg-white' : 'bg-[#333]'}`}
              >
                <Text className={`text-sm font-medium ${range === chip.value ? 'text-black' : 'text-[#888]'}`}>{chip.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View className="px-5">
          <Text className="text-white text-base font-bold mb-1">Analytic</Text>
          <Text className="text-[#888] text-xs mb-4">{dateLabel || 'Loading range...'}</Text>

          {isLoading && !analytics ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator color="#98FF2F" />
              <Text className="mt-3 text-[#888] text-sm">Loading analytics...</Text>
            </View>
          ) : error ? (
            <View className="bg-[#151515] border border-red-500/30 rounded-2xl p-5 mb-6">
              <Text className="text-red-400 text-sm text-center">{error}</Text>
              <Pressable onPress={() => loadAnalytics()} className="mt-4 self-center rounded-xl bg-[#98FF2F] px-5 py-2">
                <Text className="text-black font-bold">Retry</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View className="flex-row flex-wrap justify-between">
                {metrics.map((metric, index) => (
                  <View
                    key={metric.title}
                    className={`w-[48%] rounded-xl p-4 mb-4 ${index === 0 ? 'bg-[#1C2026] border border-[#3B82F6]' : 'bg-[#151515] border border-[#222]'}`}
                  >
                    <Text className="text-[#CCC] text-xs font-medium mb-2">{metric.title}</Text>
                    <Text className="text-white text-xl font-bold font-inter-bold mb-3">{metric.value}</Text>
                    <Text className={`${index === 0 ? 'text-[#3B82F6]' : 'text-[#98FF2F]'} text-xs font-medium`}>{metric.change}</Text>
                  </View>
                ))}
              </View>

              <View className="bg-[#151515] border border-[#222] rounded-2xl p-5 mb-6 mt-2">
                <View className="h-40 relative flex-row">
                  <View className="absolute right-0 h-full justify-between items-end z-10 py-2">
                    <Text className="text-[#666] text-[10px]">{formatNumber(maxTrendValue(analytics))}</Text>
                    <Text className="text-[#666] text-[10px]">0</Text>
                  </View>

                  <View className="flex-1 mr-8">
                    {[0, 25, 50, 75, 100].map((percent) => (
                      <View key={percent} className="absolute w-full border-t border-[#333] border-dashed" style={{ top: `${percent}%` }} />
                    ))}
                    <Svg height="100%" width="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-2">
                      <Polyline points={chartPoints} fill="none" stroke="#83D616" strokeWidth="2" />
                    </Svg>
                  </View>
                </View>
              </View>

              <View className="bg-[#151515] border border-[#222] rounded-2xl p-5 mb-6">
                <Text className="text-white text-base font-bold mb-4">Top reels</Text>
                {analytics?.topReels.length ? analytics.topReels.map((reel) => (
                  <View key={reel.id} className="mb-4 border-b border-white/10 pb-4">
                    <Text className="text-white text-sm font-inter-semibold" numberOfLines={1}>{reel.title}</Text>
                    <Text className="mt-1 text-[#888] text-xs">
                      {formatNumber(reel.views)} views · {formatNumber(reel.likes)} likes · {formatNumber(reel.comments)} comments
                    </Text>
                  </View>
                )) : (
                  <Text className="text-[#888] text-sm">No reel analytics yet.</Text>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function buildChartPoints(values: number[]) {
  const chartValues = values.length ? values : [0];
  const max = Math.max(...chartValues, 1);
  const lastIndex = Math.max(chartValues.length - 1, 1);
  return chartValues
    .map((value, index) => {
      const x = (index / lastIndex) * 100;
      const y = 100 - (value / max) * 90;
      return `${x.toFixed(2)},${Math.max(8, y).toFixed(2)}`;
    })
    .join(' ');
}

function maxTrendValue(analytics: CreatorAnalytics | null) {
  return Math.max(...(analytics?.trend.map((item) => item.views) ?? [0]), 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: value >= 10000 ? 'compact' : 'standard' }).format(value);
}

function formatMoney(value: number) {
  return value.toFixed(2);
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
