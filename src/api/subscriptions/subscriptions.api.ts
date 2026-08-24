import { apiClient } from '../client';

export type SubscriptionPlanId = string;

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  interval: 'month' | 'year' | 'lifetime';
  price: number;
  currency: 'usd';
  discountLabel?: string;
  productIdentifier?: string;
  features: string[];
  isActive?: boolean;
  sortOrder?: number;
}

export interface SubscriptionStatus {
  plan?: SubscriptionPlanId;
  status: 'none' | 'active' | 'expired' | 'canceled' | 'hold';
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

export interface CreateStripeSubscriptionPaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  publishableKey: string;
  amount: number;
  currency: string;
  plan: SubscriptionPlan;
}

export interface VerifyStripeSubscriptionPaymentResponse {
  status: string;
  paymentProvider: 'stripe';
  paymentIntentId: string;
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

export async function cancelMySubscription(): Promise<SubscriptionStatus> {
  const response = await apiClient.post<{ data: SubscriptionStatus }>('/subscriptions/cancel');
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

export async function createStripeSubscriptionPaymentIntent(planId: SubscriptionPlanId): Promise<CreateStripeSubscriptionPaymentIntentResponse> {
  const response = await apiClient.post<{ data: CreateStripeSubscriptionPaymentIntentResponse }>(
    '/subscriptions/purchase/create-payment-intent',
    { planId },
  );
  return response.data.data;
}

export async function verifyStripeSubscriptionPayment(paymentIntentId: string): Promise<VerifyStripeSubscriptionPaymentResponse> {
  const response = await apiClient.post<{ data: VerifyStripeSubscriptionPaymentResponse }>(
    '/subscriptions/purchase/verify-payment',
    { paymentIntentId },
  );
  return response.data.data;
}
