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

export async function getGiftCatalog(): Promise<GiftCatalogItem[]> {
  const response = await apiClient.get<{ data: GiftCatalogItem[] }>('/coins/gifts');
  return response.data.data;
}
