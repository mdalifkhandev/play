import { apiClient } from '../client';

export interface GiftCatalogItem {
  id: string;
  name: string;
  code: string;
  icon: string;
  coinPrice: number;
  sortOrder: number;
}

export interface CoinBalanceResponse {
  userId: string;
  coinBalance: number;
}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  currency: string;
  isPopular: boolean;
  sortOrder: number;
}

export interface DiamondBalanceResponse {
  userId: string;
  diamondBalance: number;
  diamondsPerDollar: number;
  estimatedUsdValue: number;
}

export interface ConvertDiamondsResponse {
  converted: true;
  diamondsConverted: number;
  amountUsd: number;
  coinBalance: number;
  diamondBalance: number;
  diamondsPerDollar: number;
}

export interface WithdrawalSettingsResponse {
  coinsPerDollar: number;
  minWithdrawalCoins: number;
  maxWithdrawalCoins: number;
  userCoinBalance: number;
  estimatedUsdValue: number;
  stripeConnectAccountId?: string;
  stripeConnectOnboardingComplete: boolean;
  payoutSetupAvailable?: boolean;
}

export interface CoinTransactionItem {
  id: string;
  coins: number;
  amount: number;
  currency: string;
  status: string;
  paymentProvider: 'stripe' | 'square' | 'diamond_conversion';
  stripePaymentIntentId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface GiftHistoryItem {
  id: string;
  giftName: string;
  coinPrice: number;
  quantity: number;
  totalCoins: number;
  targetType: string;
  targetId: string;
  sender?: unknown;
  recipient?: unknown;
  createdAt: string;
}

export interface WithdrawalRequestResponse {
  withdrawalId: string;
  coins: number;
  coinsPerDollar: number;
  amountUsd: number;
  status: string;
  remainingCoinBalance: number;
  createdAt: string;
}

export interface StripeConnectLinkResponse {
  url: string;
  stripeConnectAccountId: string;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SquarePaymentResult {
  paymentProvider: 'square';
  paymentId: string;
  transactionId: string;
  coinsAdded: number;
  coinBalance: number;
  coinsCredited: boolean;
  status: string;
}

export async function getCoinBalance(): Promise<CoinBalanceResponse> {
  const response = await apiClient.get<{ data: CoinBalanceResponse }>('/coins/balance');
  return response.data.data;
}

export async function getCoinPackages(): Promise<CoinPackage[]> {
  const response = await apiClient.get<{ data: CoinPackage[] }>('/coins/packages');
  return response.data.data;
}

export async function createSquareCoinPayment(input: { packageId: string; sourceId: string }): Promise<SquarePaymentResult> {
  const response = await apiClient.post<{ data: SquarePaymentResult }>('/coins/purchase/square-payment', input);
  return response.data.data;
}

export async function getDiamondBalance(): Promise<DiamondBalanceResponse> {
  const response = await apiClient.get<{ data: DiamondBalanceResponse }>('/coins/diamonds');
  return response.data.data;
}

export async function convertDiamonds(diamonds: number): Promise<ConvertDiamondsResponse> {
  const response = await apiClient.post<{ data: ConvertDiamondsResponse }>('/coins/diamonds/convert', { diamonds });
  return response.data.data;
}

export async function getWithdrawalSettings(): Promise<WithdrawalSettingsResponse> {
  const response = await apiClient.get<{ data: WithdrawalSettingsResponse }>('/coins/withdraw/settings');
  return response.data.data;
}

export async function requestCoinWithdrawal(coins: number): Promise<WithdrawalRequestResponse> {
  const response = await apiClient.post<{ data: WithdrawalRequestResponse }>('/coins/withdraw', { coins });
  return response.data.data;
}

export async function createStripeConnectLink(): Promise<StripeConnectLinkResponse> {
  const response = await apiClient.post<{ data: StripeConnectLinkResponse }>('/coins/payouts/stripe-connect/account-link', {});
  return response.data.data;
}

export async function getCoinTransactionHistory(limit = 10): Promise<PaginatedResponse<CoinTransactionItem>> {
  const response = await apiClient.get<{ data: PaginatedResponse<CoinTransactionItem> }>('/coins/history', {
    params: { page: 1, limit },
  });
  return response.data.data;
}

export async function getReceivedGiftHistory(limit = 10): Promise<PaginatedResponse<GiftHistoryItem>> {
  const response = await apiClient.get<{ data: PaginatedResponse<GiftHistoryItem> }>('/coins/gifts/received', {
    params: { page: 1, limit },
  });
  return response.data.data;
}

export async function getGiftCatalog(): Promise<GiftCatalogItem[]> {
  const response = await apiClient.get<{ data: GiftCatalogItem[] }>('/coins/gifts');
  return response.data.data;
}
