import { Platform } from 'react-native';

import type { CoinPackage } from './coins.api';

const squareApplicationId = process.env.EXPO_PUBLIC_SQUARE_APPLICATION_ID;
const squareAppleMerchantId = process.env.EXPO_PUBLIC_SQUARE_APPLE_MERCHANT_ID;

type SquareModule = typeof import('react-native-square-in-app-payments');

async function getSquareModule(): Promise<SquareModule> {
  return import('react-native-square-in-app-payments');
}

function assertSquareConfigured() {
  if (!squareApplicationId) {
    throw new Error('Square application ID is not configured.');
  }
}

export async function initializeSquarePayments() {
  assertSquareConfigured();
  const { SQIPCore } = await getSquareModule();
  SQIPCore.setSquareApplicationId(squareApplicationId!);
}

export async function requestSquareSourceId(coinPackage: CoinPackage): Promise<string> {
  await initializeSquarePayments();

  if (Platform.OS === 'ios') {
    return requestApplePaySourceId(coinPackage);
  }

  return requestCardSourceId();
}

async function requestCardSourceId(): Promise<string> {
  const { SQIPCardEntry } = await getSquareModule();

  return new Promise((resolve, reject) => {
    SQIPCardEntry.startCardEntryFlow(
      true,
      (cardDetails: { nonce?: string }) => {
        const nonce = cardDetails?.nonce;
        if (!nonce) {
          reject(new Error('Square card nonce was not returned.'));
          return { success: false, errorMessage: 'Square card nonce was not returned.' };
        }
        resolve(nonce);
        return { success: true };
      },
      () => reject(new Error('Payment was cancelled.')),
    );
  });
}

async function requestApplePaySourceId(coinPackage: CoinPackage): Promise<string> {
  if (!squareAppleMerchantId) {
    throw new Error('Apple Pay merchant ID is not configured.');
  }

  const { ApplePayNonceSuccessState, SQIPApplePay } = await getSquareModule();
  SQIPApplePay.initializeApplePay(squareAppleMerchantId);
  const canUseApplePay = await SQIPApplePay.canUseApplePay();

  if (!canUseApplePay) {
    throw new Error('Apple Pay is not available on this device.');
  }

  return new Promise((resolve, reject) => {
    SQIPApplePay.requestApplePayNonce(
      {
        price: coinPackage.price.toFixed(2),
        summaryLabel: `${coinPackage.coins} Coins`,
        countryCode: 'US',
        currencyCode: coinPackage.currency.toUpperCase(),
      },
      (cardDetails: { nonce?: string }) => {
        const nonce = cardDetails?.nonce;
        if (!nonce) {
          reject(new Error('Apple Pay nonce was not returned.'));
          return {
            state: ApplePayNonceSuccessState.Failure,
            errorMessage: 'Apple Pay nonce was not returned.',
          };
        }
        resolve(nonce);
        return { state: ApplePayNonceSuccessState.Succeeded };
      },
      (error: unknown) => reject(error instanceof Error ? error : new Error('Apple Pay failed.')),
      () => reject(new Error('Apple Pay was cancelled.')),
    );
  });
}
