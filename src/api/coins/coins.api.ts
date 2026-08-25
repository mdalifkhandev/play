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
  availableBalanceUsd?: number;
  pendingBalanceUsd?: number;
  totalBalanceUsd?: number;
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
  minWithdrawalUsd?: number;
  userCoinBalance: number;
  estimatedUsdValue: number;
  pendingWithdrawalCoins?: number;
  pendingWithdrawalUsdValue?: number;
  pendingWithdrawalCount?: number;
  availableBalanceUsd?: number;
  pendingBalanceUsd?: number;
  totalBalanceUsd?: number;
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
  paymentProvider: 'stripe' | 'diamond_conversion';
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
  withdrawalType?: 'earnings' | string;
  coins: number;
  coinsPerDollar: number;
  amountUsd: number;
  status: string;
  remainingCoinBalance?: number;
  remainingAvailableBalanceUsd?: number;
  createdAt: string;
}

export interface WithdrawalHistoryItem {
  id: string;
  withdrawalType?: 'earnings' | string;
  coins: number;
  coinsPerDollar: number;
  amountUsd: number;
  currency: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | string;
  stripeTransferId?: string;
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
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

export interface CreateStripePaymentIntentResponse {
  transactionId: string;
  clientSecret: string;
  paymentIntentId: string;
  publishableKey: string;
  amount: number;
  currency: string;
  coins: number;
  packageId: string;
}

export interface VerifyStripePaymentResponse {
  status: string;
  coinsCredited: boolean;
  coinBalance: number;
  coinsAdded: number;
}

export interface StripePaymentResult extends VerifyStripePaymentResponse {
  paymentProvider: 'stripe';
  paymentIntentId: string;
  transactionId: string;
}

export async function getCoinBalance(): Promise<CoinBalanceResponse> {
  const response = await apiClient.get<{ data: CoinBalanceResponse }>('/coins/balance');
  return response.data.data;
}

export async function getCoinPackages(): Promise<CoinPackage[]> {
  const response = await apiClient.get<{ data: CoinPackage[] }>('/coins/packages');
  return response.data.data;
}

export async function createStripeCoinPaymentIntent(packageId: string): Promise<CreateStripePaymentIntentResponse> {
  const response = await apiClient.post<{ data: CreateStripePaymentIntentResponse }>(
    '/coins/purchase/create-payment-intent',
    { packageId },
  );
  return response.data.data;
}

export async function verifyStripeCoinPayment(paymentIntentId: string): Promise<VerifyStripePaymentResponse> {
  const response = await apiClient.post<{ data: VerifyStripePaymentResponse }>('/coins/purchase/verify-payment', {
    paymentIntentId,
  });
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

export async function requestEarningWithdrawal(): Promise<WithdrawalRequestResponse> {
  const response = await apiClient.post<{ data: WithdrawalRequestResponse }>('/coins/withdraw/earnings');
  return response.data.data;
}

export async function createStripeConnectLink(input: {
  returnUrl?: string;
  refreshUrl?: string;
} = {}): Promise<StripeConnectLinkResponse> {
  try {
    const response = await apiClient.post<{ data: StripeConnectLinkResponse }>(
      '/coins/payouts/stripe-connect/account-link',
      input,
      { timeout: 60000 },
    );
    return response.data.data;
  } catch (error: any) {
    if (!error?.response) {
      if (__DEV__) {
        console.log('Stripe Connect link request lost response; retrying once.');
      }
      const retryResponse = await apiClient.post<{ data: StripeConnectLinkResponse }>(
        '/coins/payouts/stripe-connect/account-link',
        input,
        { timeout: 60000 },
      );
      return retryResponse.data.data;
    }
    throw error;
  }
}

export async function getCoinTransactionHistory(limit = 10): Promise<PaginatedResponse<CoinTransactionItem>> {
  const response = await apiClient.get<{ data: PaginatedResponse<CoinTransactionItem> }>('/coins/history', {
    params: { page: 1, limit },
  });
  return response.data.data;
}

export async function getWithdrawalHistory(limit = 10): Promise<PaginatedResponse<WithdrawalHistoryItem>> {
  const response = await apiClient.get<{ data: PaginatedResponse<WithdrawalHistoryItem> }>('/coins/withdraw/history', {
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
