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
  provider?: 'square' | 'apple_pay';
  paymentId?: string;
  isPremium: boolean;
}

export interface SquareSubscriptionResult {
  paymentProvider: 'square';
  paymentId: string;
  plan: SubscriptionPlan;
  subscription: SubscriptionStatus;
  status: string;
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await apiClient.get<{ data: SubscriptionPlan[] }>('/subscriptions/plans');
  return response.data.data;
}

export async function getMySubscription(): Promise<SubscriptionStatus> {
  const response = await apiClient.get<{ data: SubscriptionStatus }>('/subscriptions/me');
  return response.data.data;
}

export async function createSquareSubscriptionPayment(input: {
  planId: SubscriptionPlanId;
  sourceId: string;
}): Promise<SquareSubscriptionResult> {
  const response = await apiClient.post<{ data: SquareSubscriptionResult }>(
    '/subscriptions/purchase/square-payment',
    input,
  );
  return response.data.data;
}
