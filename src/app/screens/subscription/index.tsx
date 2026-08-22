import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';
import { getMySubscription, getSubscriptionPlans, type SubscriptionPlan, type SubscriptionPlanId } from '../../../api/subscriptions/subscriptions.api';

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activePlan, setActivePlan] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);

  const isYearly = activePlan === 'Yearly';
  const selectedPlanId: SubscriptionPlanId = isYearly ? 'yearly' : 'monthly';
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId),
    [plans, selectedPlanId],
  );

  useEffect(() => {
    let mounted = true;

    Promise.all([getSubscriptionPlans(), getMySubscription()])
      .then(([nextPlans, subscription]) => {
        if (!mounted) return;
        setPlans(nextPlans);
        setPremiumUntil(subscription.isPremium && subscription.expiresAt ? subscription.expiresAt : null);
      })
      .catch(() => {
        if (mounted) {
          setPlans([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const price = selectedPlan?.price ?? (isYearly ? 254.15 : 25);
  const intervalLabel = selectedPlan?.interval === 'year' || isYearly ? '/year' : '/mo';

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Subscription" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
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

        {/* Tabs */}
        <View className="flex-row justify-between mb-8">
          <Pressable 
            onPress={() => setActivePlan('Monthly')}
            className={`flex-1 mr-2 py-3 rounded-xl items-center justify-center border ${
              !isYearly ? 'bg-[#A3E635] border-[#A3E635]' : 'bg-[#151515] border-[#333]'
            }`}
          >
            <Text className={`font-semibold ${!isYearly ? 'text-black' : 'text-[#A3E635]'}`}>Monthly</Text>
          </Pressable>

          <Pressable 
            onPress={() => setActivePlan('Yearly')}
            className={`flex-1 ml-2 py-3 rounded-xl items-center justify-center border ${
              isYearly ? 'bg-[#A3E635] border-[#A3E635]' : 'bg-[#151515] border-[#333]'
            }`}
          >
            <Text className={`font-semibold ${isYearly ? 'text-black' : 'text-[#A3E635]'}`}>Yearly</Text>
          </Pressable>
        </View>

        {/* Plan Card */}
        <View className="bg-[#151515] rounded-3xl p-6 border border-[#222]">
          {isLoading && (
            <ActivityIndicator size="small" color="#A3E635" style={{ marginBottom: 16 }} />
          )}
          
          <View className="flex-row items-center mb-6">
            <View className="w-10 h-10 rounded-full bg-[#FDE047] items-center justify-center mr-3">
              <Ionicons name="star" size={20} color="#CA8A04" />
            </View>
            <Text className="text-[#888] text-lg mr-4">{activePlan}</Text>
            {(selectedPlan?.discountLabel || isYearly) && (
              <View className="bg-[#2A3B18] px-3 py-1 rounded-md">
                <Text className="text-[#A3E635] text-xs font-bold">{selectedPlan?.discountLabel || '15% OFF'}</Text>
              </View>
            )}
          </View>

          <Text className="text-white text-xl font-bold mb-2">Premium</Text>
          <Text className="text-[#A3E635] text-sm mb-4">Ad-Free Experience</Text>

          <View className="flex-row items-end mb-8">
            <Text className="text-white text-3xl font-bold">${price.toFixed(2)}</Text>
            <Text className="text-[#888] text-base mb-1 ml-1">{intervalLabel}</Text>
          </View>

          {/* Features */}
          <View className="mb-8">
            <View className="flex-row items-center mb-5">
              <View className="w-10 h-10 rounded-xl bg-[#DBEAFE] items-center justify-center mr-4">
                <View className="w-4 h-4 rounded-full bg-[#3B82F6]" />
              </View>
              <Text className="text-white text-base">No ads in feed</Text>
            </View>

            <View className="flex-row items-center mb-5">
              <View className="w-10 h-10 rounded-xl border border-[#333] items-center justify-center mr-4">
                <Ionicons name="play-outline" size={20} color="white" />
              </View>
              <Text className="text-white text-base">Uninterrupted watching</Text>
            </View>

            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-[#A7F3D0] items-center justify-center mr-4">
                <Ionicons name="shield-checkmark-outline" size={20} color="#047857" />
              </View>
              <Text className="text-white text-base">Premium badge on profile</Text>
            </View>
          </View>

          <CustomButton 
            title="Subscribe now"
            onPress={() => router.push({
              pathname: '/screens/subscription/payment-method',
              params: {
                planId: selectedPlanId,
                planName: selectedPlan?.name || (isYearly ? 'Premium Yearly' : 'Premium Monthly'),
                price: String(price),
                currency: selectedPlan?.currency || 'usd',
              },
            })}
            containerStyle="bg-[#A3E635] w-full py-4 mt-2"
            textStyle="text-black font-bold text-base"
          />

        </View>

      </ScrollView>
    </View>
  );
}
