import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Sentry from '@sentry/react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
    Sentry.captureException(error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-black items-center justify-center p-6">
          <Ionicons name="warning" size={64} color="#ff4444" className="mb-4" />
          <Text className="text-white text-center font-inter-semibold text-xl mb-4">
            Oops! Something went wrong.
          </Text>
          <Text className="text-gray-400 text-center font-inter-medium text-sm mb-8">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Text>
          <Pressable
            className="bg-[#98FF2F] px-8 py-3 rounded-full"
            onPress={() => {
              this.setState({ hasError: false, error: null });
              router.replace('/');
            }}
          >
            <Text className="text-black font-inter-bold text-base">Return to Home</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
