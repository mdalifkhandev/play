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

export async function getCoinBalance(): Promise<CoinBalanceResponse> {
  const response = await apiClient.get<{ data: CoinBalanceResponse }>('/coins/balance');
  return response.data.data;
}

export async function getGiftCatalog(): Promise<GiftCatalogItem[]> {
  const response = await apiClient.get<{ data: GiftCatalogItem[] }>('/coins/gifts');
  return response.data.data;
}
