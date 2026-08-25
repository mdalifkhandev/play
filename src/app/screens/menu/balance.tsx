import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Linking as RNLinking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { handleApiError } from '../../../api/client';
import {
  createStripeConnectLink,
  getCoinTransactionHistory,
  getReceivedGiftHistory,
  getWithdrawalHistory,
  getWithdrawalSettings,
  requestCoinWithdrawal,
  type CoinTransactionItem,
  type GiftHistoryItem,
  type WithdrawalHistoryItem,
  type WithdrawalSettingsResponse,
} from '../../../api/coins/coins.api';
import { CustomButton } from '../../../components/ui/CustomButton';
import { Header } from '../../../components/ui/Header';
import { usePlatformFeature } from '../../../components/settings/FeatureGuard';

function formatUsd(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function transactionTitle(item: CoinTransactionItem) {
  if (item.paymentProvider === 'diamond_conversion') return 'Diamond conversion';
  if (item.paymentProvider === 'stripe') return 'Coin purchase';
  return 'Payment';
}

function formatCurrencyAmount(amount: number, currency = 'usd') {
  const symbol = currency.toLowerCase() === 'usd' ? '$' : `${currency.toUpperCase()} `;
  return `${symbol}${formatUsd(amount)}`;
}

export default function BalanceScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'All' | 'Live Gifts' | 'Coin'>('All');
  const [settings, setSettings] = useState<WithdrawalSettingsResponse | null>(null);
  const [transactions, setTransactions] = useState<CoinTransactionItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalHistoryItem[]>([]);
  const [gifts, setGifts] = useState<GiftHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const withdrawalsFeature = usePlatformFeature('withdrawals');

  const loadBalance = useCallback(async (refreshing = false) => {
    try {
      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);

      const [withdrawSettings, history, withdrawalHistory, receivedGifts] = await Promise.all([
        getWithdrawalSettings(),
        getCoinTransactionHistory(10),
        getWithdrawalHistory(10),
        getReceivedGiftHistory(10),
      ]);

      setSettings(withdrawSettings);
      setTransactions(history.items || []);
      setWithdrawals(withdrawalHistory.items || []);
      setGifts(receivedGifts.items || []);
    } catch (error) {
      console.error('Failed to load balance screen:', error);
      Alert.alert('Alert', handleApiError(error, 'Balance could not be loaded.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const withdrawableCoins = settings?.userCoinBalance ?? 0;
  const availableBalanceUsd = settings?.availableBalanceUsd ?? 0;
  const pendingBalanceUsd = settings?.pendingBalanceUsd ?? 0;
  const pendingWithdrawalCoins = settings?.pendingWithdrawalCoins ?? 0;
  const pendingWithdrawalUsdValue = settings?.pendingWithdrawalUsdValue ?? 0;
  const pendingWithdrawalCount = settings?.pendingWithdrawalCount ?? 0;
  const canWithdraw = useMemo(() => {
    if (!settings) return false;
    return withdrawableCoins >= settings.minWithdrawalCoins;
  }, [settings, withdrawableCoins]);

  const handleWithdraw = useCallback(async () => {
    if (!settings || isWithdrawing) return;

    if (!withdrawalsFeature.enabled) {
      Alert.alert('Alert', 'Withdrawals are currently disabled by admin.');
      return;
    }

    try {
      setIsWithdrawing(true);

      if (!settings.stripeConnectOnboardingComplete) {
        if (!settings.payoutSetupAvailable) {
          Alert.alert(
            'Payout not ready',
            'Coin purchase uses Stripe on Android and Apple Pay on iOS. Withdraw needs Stripe Connect to send money to your bank, and it is not configured yet.',
          );
          return;
        }

        const link = await createStripeConnectLink();
        if (__DEV__) {
          console.log('Stripe Connect onboarding link created:', {
            stripeConnectAccountId: link.stripeConnectAccountId,
            hasUrl: Boolean(link.url),
          });
        }
        if (!link.url) {
          throw new Error('Stripe Connect onboarding link was not returned.');
        }
        await RNLinking.openURL(link.url);
        return;
      }

      if (!canWithdraw) {
        Alert.alert('Alert', `Minimum withdrawal amount is ${settings.minWithdrawalCoins} coins.`);
        return;
      }

      const result = await requestCoinWithdrawal(withdrawableCoins);
      Alert.alert('Success', `$${result.amountUsd.toFixed(2)} withdrawal request submitted.`);
      await loadBalance(true);
    } catch (error) {
      console.error('Failed to withdraw balance:', error);
      Alert.alert('Alert', handleApiError(error, 'Withdrawal could not be submitted.'));
    } finally {
      setIsWithdrawing(false);
    }
  }, [canWithdraw, isWithdrawing, loadBalance, settings, withdrawableCoins, withdrawalsFeature.enabled]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        loadBalance(true);
      }
    });

    return () => subscription.remove();
  }, [loadBalance]);

  const bottomPadding = Math.max(insets.bottom, 20) + 24;

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Balance" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadBalance(true)} tintColor="#A3E635" />}
      >
        <View className="items-center mt-6">
          <Pressable className="flex-row items-center mb-4">
            <Text className="text-[#888] text-sm mr-1">Available balance USD</Text>
            <Ionicons name="caret-down" size={14} color="#888" />
          </Pressable>

          {isLoading ? (
            <ActivityIndicator size="large" color="#A3E635" style={{ marginBottom: 32 }} />
          ) : (
            <Text className="text-white text-6xl font-bold font-inter-bold mb-8">{formatUsd(availableBalanceUsd)}</Text>
          )}

          <CustomButton
            title={settings?.stripeConnectOnboardingComplete ? 'Withdraw Balance' : 'Setup Payout Account'}
            onPress={handleWithdraw}
            disabled={isLoading || isWithdrawing || !settings || !withdrawalsFeature.enabled}
            containerStyle={`w-full ${withdrawalsFeature.enabled ? 'bg-[#A3E635]' : 'bg-[#333]'}`}
            textStyle={withdrawalsFeature.enabled ? 'text-black' : 'text-[#888]'}
          />

          {!withdrawalsFeature.enabled && (
            <Text className="text-[#888] text-xs text-center mt-3">
              Withdrawals are currently disabled by admin.
            </Text>
          )}

          {settings && (
            <Text className="text-[#888] text-xs text-center mt-3">
              {withdrawableCoins.toLocaleString()} coins · Minimum {settings.minWithdrawalCoins.toLocaleString()} coins
            </Text>
          )}

          {settings && pendingWithdrawalCoins > 0 && (
            <View className="w-full bg-[#151515] rounded-xl border border-[#222] px-4 py-3 mt-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-white text-sm font-inter-semibold">Pending payout</Text>
                <Text className="text-[#A3E635] text-sm font-inter-semibold">${formatUsd(pendingWithdrawalUsdValue)}</Text>
              </View>
              <Text className="text-[#888] text-xs mt-1">
                {pendingWithdrawalCoins.toLocaleString()} coins in {pendingWithdrawalCount} request{pendingWithdrawalCount === 1 ? '' : 's'}.
              </Text>
            </View>
          )}

          {settings && pendingBalanceUsd > 0 && (
            <View className="w-full bg-[#151515] rounded-xl border border-[#222] px-4 py-3 mt-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-white text-sm font-inter-semibold">Pending earnings</Text>
                <Text className="text-[#A3E635] text-sm font-inter-semibold">${formatUsd(pendingBalanceUsd)}</Text>
              </View>
              <Text className="text-[#888] text-xs mt-1">
                Reel view earnings are held before they become withdrawable.
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center mt-8 mb-4">
          <Pressable
            onPress={() => setActiveTab('All')}
            className={`px-4 py-1 rounded-md mr-3 ${activeTab === 'All' ? 'bg-[#A3E635]' : 'bg-[#333]'}`}
          >
            <Text className={`text-sm ${activeTab === 'All' ? 'text-black' : 'text-[#888]'}`}>All</Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('Live Gifts')}
            className={`px-4 py-1 rounded-md mr-3 ${activeTab === 'Live Gifts' ? 'bg-[#A3E635]' : 'bg-[#333]'}`}
          >
            <Text className={`text-sm ${activeTab === 'Live Gifts' ? 'text-black' : 'text-[#888]'}`}>Live Gifts</Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('Coin')}
            className={`px-4 py-1 rounded-md ${activeTab === 'Coin' ? 'bg-[#A3E635]' : 'bg-[#333]'}`}
          >
            <Text className={`text-sm ${activeTab === 'Coin' ? 'text-black' : 'text-[#888]'}`}>Coin</Text>
          </Pressable>
        </View>

        <View className="bg-[#151515] rounded-xl border border-[#222] overflow-hidden">
          <View className="flex-row items-center justify-between p-4 border-b border-[#222]">
            <Text className="text-white text-base font-medium">Transactions</Text>
            <View className="flex-row items-center">
              <Text className="text-[#888] text-sm mr-1">Latest</Text>
              <Ionicons name="chevron-forward" size={16} color="#888" />
            </View>
          </View>

          {isLoading ? (
            <View className="py-8">
              <ActivityIndicator color="#A3E635" />
            </View>
          ) : activeTab === 'All' && withdrawals.length === 0 ? (
            <Text className="text-[#888] text-sm text-center py-8">
              No dollar transactions yet.
            </Text>
          ) : activeTab === 'Live Gifts' && gifts.length === 0 ? (
            <Text className="text-[#888] text-sm text-center py-8">
              No live gifts yet.
            </Text>
          ) : activeTab === 'Coin' && transactions.length === 0 ? (
            <Text className="text-[#888] text-sm text-center py-8">
              No coin transactions yet.
            </Text>
          ) : activeTab === 'All' ? (
            withdrawals.map((withdrawal) => {
              const isRejected = withdrawal.status === 'rejected' || withdrawal.status === 'failed';
              const statusText =
                withdrawal.status === 'transferred'
                  ? 'accepted'
                  : withdrawal.status === 'approved'
                    ? 'processing'
                    : withdrawal.status;

              return (
                <View key={withdrawal.id} className="flex-row items-center justify-between px-4 py-3 border-b border-[#222]">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-full bg-[#252525] items-center justify-center mr-3">
                      <Ionicons name={isRejected ? 'close-circle-outline' : 'cash-outline'} size={18} color={isRejected ? '#fb7185' : '#A3E635'} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-sm font-inter-semibold" numberOfLines={1}>
                        Withdrawal {statusText}
                      </Text>
                      <Text className="text-[#888] text-xs mt-0.5" numberOfLines={1}>
                        {withdrawal.coins.toLocaleString()} coins · {formatDate(withdrawal.processedAt || withdrawal.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end ml-3">
                    <Text className={`${isRejected ? 'text-red-400' : 'text-[#A3E635]'} text-sm font-inter-semibold`}>
                      {isRejected ? '-' : '+'}${formatUsd(withdrawal.amountUsd)}
                    </Text>
                    <Text className="text-[#888] text-xs mt-0.5">{withdrawal.status}</Text>
                  </View>
                </View>
              );
            })
          ) : activeTab === 'Live Gifts' ? (
            gifts.map((gift) => (
              <View key={gift.id} className="flex-row items-center justify-between px-4 py-3 border-b border-[#222]">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-[#252525] items-center justify-center mr-3">
                    <Ionicons name="gift-outline" size={18} color="#A3E635" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-sm font-inter-semibold" numberOfLines={1}>{gift.giftName} gift</Text>
                    <Text className="text-[#888] text-xs mt-0.5" numberOfLines={1}>{gift.quantity}x · {formatDate(gift.createdAt)}</Text>
                  </View>
                </View>
                <Text className="text-[#A3E635] text-sm font-inter-semibold ml-3">+{gift.totalCoins}</Text>
              </View>
            ))
          ) : (
            transactions.map((transaction) => {
              const title = transactionTitle(transaction);
              const subtitle = `${transaction.status} · ${formatDate(transaction.createdAt)}`;
              const amount = `+${transaction.coins}`;
              const cashAmount = formatCurrencyAmount(transaction.amount, transaction.currency);

              return (
                <View key={transaction.id} className="flex-row items-center justify-between px-4 py-3 border-b border-[#222]">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-full bg-[#252525] items-center justify-center mr-3">
                      <Ionicons name="swap-horizontal" size={18} color="#A3E635" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-sm font-inter-semibold" numberOfLines={1}>{title}</Text>
                      <Text className="text-[#888] text-xs mt-0.5" numberOfLines={1}>{subtitle}</Text>
                    </View>
                  </View>
                  <View className="items-end ml-3">
                    <Text className="text-[#A3E635] text-sm font-inter-semibold">{amount}</Text>
                    <Text className="text-[#888] text-xs mt-0.5">{cashAmount}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View className="mt-8">
          <Text className="text-[#888] text-sm mb-4">Services</Text>
          <Pressable className="bg-[#151515] p-6 rounded-xl border border-[#222] items-center justify-center">
            <Ionicons name="stats-chart" size={24} color="white" />
            <Text className="text-white text-base font-medium mt-2">Monetisation</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
