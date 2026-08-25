import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { toast } from 'sonner-native';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';
import { cancelMySubscription, getMySubscription, getSubscriptionPlans, type SubscriptionPlan, type SubscriptionPlanId } from '../../../api/subscriptions/subscriptions.api';
import { handleApiError } from '../../../api/client';
import { FeatureGuard } from '../../../components/settings/FeatureGuard';

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [currentPremiumPlanId, setCurrentPremiumPlanId] = useState<SubscriptionPlanId | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const visiblePlans = useMemo(() => {
    if (!currentPremiumPlanId) return plans;

    const currentPlan = plans.find((plan) => plan.id === currentPremiumPlanId);
    if (!currentPlan) return plans;

    return [
      currentPlan,
      ...plans.filter((plan) => plan.id !== currentPremiumPlanId),
    ];
  }, [plans, currentPremiumPlanId]);

  const selectedPlan = useMemo(
    () => visiblePlans.find((plan) => plan.id === selectedPlanId) || visiblePlans[0],
    [visiblePlans, selectedPlanId],
  );

  const loadSubscription = useCallback((mode: 'initial' | 'refresh' = 'initial', isActive: () => boolean = () => true) => {
    if (mode === 'initial') {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    return Promise.all([getSubscriptionPlans(), getMySubscription()])
      .then(([nextPlans, subscription]) => {
        if (!isActive()) return;
        setPlans(nextPlans);
        const nextCurrentPremiumPlanId = subscription.isPremium && subscription.plan ? subscription.plan : null;
        setCurrentPremiumPlanId(nextCurrentPremiumPlanId);
        setSelectedPlanId((current) => {
          if (current && nextPlans.some((plan) => plan.id === current)) return current;
          if (nextCurrentPremiumPlanId && nextPlans.some((plan) => plan.id === nextCurrentPremiumPlanId)) {
            return nextCurrentPremiumPlanId;
          }
          return nextPlans[0]?.id || null;
        });
        setPremiumUntil(subscription.isPremium && subscription.expiresAt ? subscription.expiresAt : null);
      })
      .catch(() => {
        if (!isActive()) return;
        setPlans([]);
      })
      .finally(() => {
        if (!isActive()) return;
        setIsLoading(false);
        setIsRefreshing(false);
      });
  }, []);

  useEffect(() => {
    let mounted = true;

    void loadSubscription('initial', () => mounted);

    return () => {
      mounted = false;
    };
  }, [loadSubscription]);

  const handleCancelCurrentPlan = useCallback(() => {
    if (!currentPremiumPlanId || isCanceling) return;

    Alert.alert(
      'Cancel subscription?',
      'Your premium access will stop after cancellation.',
      [
        { text: 'Keep plan', style: 'cancel' },
        {
          text: 'Cancel plan',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCanceling(true);
              await cancelMySubscription();
              setCurrentPremiumPlanId(null);
              setPremiumUntil(null);
              toast.success('Subscription canceled.');
              await loadSubscription('refresh');
            } catch (error) {
              toast.error(handleApiError(error, 'Subscription could not be canceled.'));
            } finally {
              setIsCanceling(false);
            }
          },
        },
      ],
    );
  }, [currentPremiumPlanId, isCanceling, loadSubscription]);

  const price = selectedPlan?.price ?? 0;
  const intervalLabel = getIntervalPriceLabel(selectedPlan?.interval);

  return (
    <FeatureGuard feature="subscriptions" title="Subscriptions are unavailable">
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Subscription" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadSubscription('refresh')}
            tintColor="#A3E635"
            colors={['#A3E635']}
            progressBackgroundColor="#151515"
          />
        }
      >
        
        {/* Title Section */}
        <View className="items-center mt-2 mb-6">
          <Text className="text-white text-3xl font-bold mb-2 font-inter-bold">Choose Your Plan</Text>
          <Text className="text-[#888] text-sm text-center">Unlock premium features and exclusive content</Text>
          {premiumUntil && (
            <Text className="text-[#A3E635] text-xs text-center mt-2">
              Premium active until {new Date(premiumUntil).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Plan Picker */}
        <View className="mb-8">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {visiblePlans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              const isCurrentPlan = currentPremiumPlanId === plan.id;
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => setSelectedPlanId(plan.id)}
                  className={`px-5 py-3 rounded-xl items-center justify-center border ${
                    isSelected ? 'bg-[#A3E635] border-[#A3E635]' : 'bg-[#151515] border-[#333]'
                  }`}
                >
                  <Text className={`font-semibold ${isSelected ? 'text-black' : 'text-[#A3E635]'}`} numberOfLines={1}>
                    {plan.name}
                  </Text>
                  {isCurrentPlan && (
                    <Text className={`text-[10px] mt-1 ${isSelected ? 'text-black/70' : 'text-[#A3E635]/80'}`}>
                      Current
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {!isLoading && visiblePlans.length === 0 ? (
          <View className="bg-[#151515] rounded-3xl p-6 border border-[#222] items-center">
            <View className="w-12 h-12 rounded-full bg-[#222] items-center justify-center mb-4">
              <Ionicons name="card-outline" size={24} color="#A3E635" />
            </View>
            <Text className="text-white text-lg font-inter-bold text-center">No subscription plans available</Text>
            <Text className="text-[#888] text-sm text-center mt-2">
              Plans will appear here after admin adds an active subscription plan.
            </Text>
          </View>
        ) : (
        <View className="bg-[#151515] rounded-3xl p-6 border border-[#222]">
          {isLoading && (
            <ActivityIndicator size="small" color="#A3E635" style={{ marginBottom: 16 }} />
          )}
          
          <View className="flex-row items-center mb-6">
            <View className="w-10 h-10 rounded-full bg-[#FDE047] items-center justify-center mr-3">
              <Ionicons name="star" size={20} color="#CA8A04" />
            </View>
            <Text className="text-[#888] text-lg mr-4">{getIntervalTitle(selectedPlan?.interval)}</Text>
            {getDiscountLabel(selectedPlan?.discountLabel) && (
              <View className="bg-[#2A3B18] px-3 py-1 rounded-md">
                <Text className="text-[#A3E635] text-xs font-bold">{getDiscountLabel(selectedPlan?.discountLabel)}</Text>
              </View>
            )}
          </View>

          <Text className="text-white text-xl font-bold mb-2">{selectedPlan?.name}</Text>

          <View className="flex-row items-end mb-8 mt-2">
            <Text className="text-white text-3xl font-bold">${price.toFixed(2)}</Text>
            <Text className="text-[#888] text-base mb-1 ml-1">{intervalLabel}</Text>
          </View>

          {/* Features */}
          <View className="mb-8">
            {(selectedPlan?.features || []).map((feature, index) => {
              const icon = getFeatureIcon(feature);
              return (
                <View key={`${feature}-${index}`} className="flex-row items-center mb-5">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-4 border"
                    style={{ backgroundColor: icon.backgroundColor, borderColor: icon.borderColor }}
                  >
                    <Ionicons name={icon.name} size={20} color={icon.color} />
                  </View>
                  <Text className="text-white text-base flex-1">{feature}</Text>
                </View>
              );
            })}
          </View>

          {selectedPlan && (
          <CustomButton
            title={currentPremiumPlanId === selectedPlan.id ? 'Current plan' : 'Subscribe now'}
            onPress={() => router.push({
                pathname: '/screens/subscription/payment-method',
                params: {
                  planId: selectedPlan.id,
                  planName: selectedPlan.name,
                  price: String(price),
                  currency: selectedPlan.currency || 'usd',
                  productIdentifier: selectedPlan.productIdentifier || '',
                },
              })}
            disabled={currentPremiumPlanId === selectedPlan.id}
            containerStyle="bg-[#A3E635] w-full py-4 mt-2"
            textStyle="text-black font-bold text-base"
          />
          )}

          {currentPremiumPlanId === selectedPlan?.id && (
            <Pressable
              onPress={handleCancelCurrentPlan}
              disabled={isCanceling}
              className="mt-4 py-3 rounded-xl border border-red-500/40 items-center justify-center flex-row"
            >
              {isCanceling && <ActivityIndicator size="small" color="#F87171" style={{ marginRight: 8 }} />}
              <Text className="text-red-400 font-inter-semibold">
                {isCanceling ? 'Canceling...' : 'Cancel current plan'}
              </Text>
            </Pressable>
          )}

        </View>
        )}

      </ScrollView>
    </View>
    </FeatureGuard>
  );
}

function getIntervalTitle(interval?: SubscriptionPlan['interval'] | string) {
  const normalized = normalizeInterval(interval);
  if (normalized === 'year') return 'Yearly';
  if (normalized === 'lifetime') return 'Lifetime';
  return 'Monthly';
}

function getIntervalPriceLabel(interval?: SubscriptionPlan['interval'] | string) {
  const normalized = normalizeInterval(interval);
  if (normalized === 'year') return '/year';
  if (normalized === 'lifetime') return ' lifetime';
  return '/mo';
}

function normalizeInterval(interval?: SubscriptionPlan['interval'] | string) {
  const value = String(interval || '').trim().toLowerCase();
  if (['year', 'yearly', 'annual', 'annually'].includes(value)) return 'year';
  if (['lifetime', 'life_time', 'one_time', 'onetime'].includes(value)) return 'lifetime';
  return 'month';
}

function getDiscountLabel(label?: string | number | null) {
  const trimmed = String(label ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.includes('%') || /off/i.test(trimmed)) return trimmed;
  if (/^\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}% OFF`;
  return trimmed;
}

function getFeatureIcon(feature: string): {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  backgroundColor: string;
  borderColor: string;
} {
  const value = feature.toLowerCase();
  const exactIconMap: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
    'no ads in feed': 'ban-outline',
    'uninterrupted watching': 'play-circle-outline',
    'premium badge on profile': 'ribbon-outline',
    'priority support': 'headset-outline',
    'creator analytics': 'stats-chart-outline',
    'exclusive live gifts': 'gift-outline',
    'advanced profile customization': 'color-palette-outline',
    'subscriber-only content': 'lock-closed-outline',
    'premium live access': 'radio-outline',
    'longer video uploads': 'cloud-upload-outline',
    'hd video playback': 'tv-outline',
    'early access to new features': 'rocket-outline',
    'download saved content': 'download-outline',
    'verified supporter badge': 'shield-checkmark-outline',
    'boosted content visibility': 'trending-up-outline',
    'exclusive stickers and reactions': 'happy-outline',
    'custom profile themes': 'brush-outline',
    'monthly creator rewards': 'trophy-outline',
  };

  const exactIcon = exactIconMap[value.trim()];
  if (exactIcon) {
    return makeFeatureIcon(exactIcon);
  }

  if (value.includes('ad')) {
    return makeFeatureIcon('ban-outline');
  }

  if (value.includes('watch') || value.includes('video') || value.includes('play')) {
    return makeFeatureIcon('play-circle-outline');
  }

  if (value.includes('badge')) {
    return makeFeatureIcon('ribbon-outline');
  }

  if (value.includes('premium')) {
    return makeFeatureIcon('star-outline');
  }

  if (value.includes('profile')) {
    return makeFeatureIcon('person-circle-outline');
  }

  if (value.includes('support') || value.includes('priority')) {
    return makeFeatureIcon('headset-outline');
  }

  if (value.includes('analytics') || value.includes('creator')) {
    return makeFeatureIcon('stats-chart-outline');
  }

  if (value.includes('gift') || value.includes('live')) {
    return makeFeatureIcon('gift-outline');
  }

  if (value.includes('download')) {
    return makeFeatureIcon('download-outline');
  }

  if (value.includes('theme') || value.includes('custom')) {
    return makeFeatureIcon('color-palette-outline');
  }

  if (value.includes('reward')) {
    return makeFeatureIcon('trophy-outline');
  }

  return makeFeatureIcon('checkmark-circle-outline');
}

function makeFeatureIcon(name: React.ComponentProps<typeof Ionicons>['name']) {
  return {
    name,
    color: '#84CC16',
    backgroundColor: 'rgba(132, 204, 22, 0.12)',
    borderColor: 'rgba(132, 204, 22, 0.35)',
  };
}
