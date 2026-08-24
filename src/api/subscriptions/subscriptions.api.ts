import { apiClient } from '../client';

export type SubscriptionPlanId = 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  interval: 'month' | 'year';
  price: number;
  currency: 'usd';
  discountLabel?: string;
  features: string[];
}

export interface SubscriptionStatus {
  plan?: SubscriptionPlanId;
  status: 'none' | 'active' | 'expired' | 'canceled';
  expiresAt?: string;
  provider?: 'revenuecat' | 'apple_pay' | 'stripe';
  paymentId?: string;
  isPremium: boolean;
}

export interface RevenueCatSubscriptionResult {
  paymentProvider: 'revenuecat';
  productIdentifier: string;
  plan: SubscriptionPlan;
  subscription: SubscriptionStatus;
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await apiClient.get<{ data: SubscriptionPlan[] }>('/subscriptions/plans');
  return response.data.data;
}

export async function getMySubscription(): Promise<SubscriptionStatus> {
  const response = await apiClient.get<{ data: SubscriptionStatus }>('/subscriptions/me');
  return response.data.data;
}

export async function syncRevenueCatSubscription(input: {
  planId: SubscriptionPlanId;
  platform: 'ios' | 'android';
  productIdentifier?: string;
}): Promise<RevenueCatSubscriptionResult> {
  const response = await apiClient.post<{ data: RevenueCatSubscriptionResult }>(
    '/subscriptions/revenuecat/sync',
    input,
  );
  return response.data.data;
}
