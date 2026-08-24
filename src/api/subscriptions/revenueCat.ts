import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type PurchasesPackage } from 'react-native-purchases';
import type { SubscriptionPlanId } from './subscriptions.api';

const entitlementId = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || 'premium';
const monthlyProductId = process.env.EXPO_PUBLIC_REVENUECAT_MONTHLY_PRODUCT_ID;
const yearlyProductId = process.env.EXPO_PUBLIC_REVENUECAT_YEARLY_PRODUCT_ID;

let configuredUserId: string | null = null;

export async function configureRevenueCat(userId: string) {
  const apiKey = Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

  if (!apiKey) {
    throw new Error('RevenueCat API key is not configured for this platform.');
  }

  if (configuredUserId === userId) return;

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
  Purchases.configure({ apiKey, appUserID: userId });
  configuredUserId = userId;
}

export async function purchaseRevenueCatPlan(userId: string, planId: SubscriptionPlanId, productIdentifier?: string) {
  await configureRevenueCat(userId);

  const offerings = await Purchases.getOfferings();
  const packages = offerings.current?.availablePackages || [];
  const targetProductId = productIdentifier || (planId === 'yearly' ? yearlyProductId : monthlyProductId);
  const selectedPackage = findRevenueCatPackage(packages, planId, targetProductId);

  if (!selectedPackage) {
    throw new Error('RevenueCat subscription package was not found.');
  }

  const result = await Purchases.purchasePackage(selectedPackage);
  const activeEntitlement = result.customerInfo.entitlements.active[entitlementId];

  if (!activeEntitlement) {
    throw new Error('Premium entitlement was not activated.');
  }

  return {
    productIdentifier: selectedPackage.product.identifier,
    expirationDate: activeEntitlement.expirationDate,
  };
}

function findRevenueCatPackage(
  packages: PurchasesPackage[],
  planId: SubscriptionPlanId,
  targetProductId?: string,
) {
  if (targetProductId) {
    const byProduct = packages.find((item) => item.product.identifier === targetProductId);
    if (byProduct) return byProduct;
  }

  const normalizedPlanId = planId.toLowerCase();
  const planKeyword = normalizedPlanId.includes('lifetime')
    ? 'lifetime'
    : normalizedPlanId.includes('year')
      ? 'annual'
      : 'monthly';
  return packages.find((item) => item.identifier.toLowerCase().includes(planKeyword))
    || packages.find((item) => item.product.identifier.toLowerCase().includes(normalizedPlanId))
    || packages[normalizedPlanId.includes('year') ? 1 : 0];
}
