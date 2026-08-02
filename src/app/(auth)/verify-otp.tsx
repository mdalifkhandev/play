import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner-native';
import { apiClient, handleApiError } from "../../../src/api/client";
import { CustomButton } from "../../components/ui/CustomButton";
import { Header } from "../../components/ui/Header";

export default function VerifyOtp() {
  const { type, email: paramEmail } = useLocalSearchParams<{ type: string; email: string }>();
  const [email, setEmail] = useState(paramEmail || "");
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  const CODE_LENGTH = 6;

  useEffect(() => {
    if (timeLeft === 0) return;
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const verifyMutation = useMutation({
    mutationFn: (data: { email: string, code: string }) => {
      return apiClient.post('/auth/verify-email', data);
    },
    onSuccess: () => {
      toast.success('Email verified successfully!');
      if (type === 'forgot') {
        router.push("/(auth)/reset-password");
      } else {
        router.push("/(auth)/profile-setup");
      }
    },
    onError: (error: any) => {
      toast.error(handleApiError(error, 'Failed to verify email'));
    }
  });

  const resendMutation = useMutation({
    mutationFn: (data: { email: string }) => {
      return apiClient.post('/auth/resend-verification', data);
    },
    onSuccess: () => {
      toast.success('Verification code resent successfully!');
      setTimeLeft(60);
    },
    onError: (error: any) => {
      toast.error(handleApiError(error, 'Failed to resend code'));
    }
  });

  const verifyResetMutation = useMutation({
    mutationFn: (data: { email: string, code: string }) => {
      return apiClient.post('/auth/verify-reset-code', data);
    },
    onSuccess: (response) => {
      toast.success('Code verified successfully!');
      // Get resetToken from response
      const resetToken = response.data?.data?.resetToken || response.data?.resetToken;
      router.push({ pathname: "/(auth)/reset-password", params: { resetToken, email } });
    },
    onError: (error: any) => {
      toast.error(handleApiError(error, 'Failed to verify code'));
    }
  });

  const handleResend = () => {
    if (timeLeft > 0 || resendMutation.isPending) return;
    resendMutation.mutate({ email });
  };

  const handleVerify = () => {
    if (code.length !== CODE_LENGTH) {
      toast.error('Please enter the full 6-digit code');
      return;
    }
    
    if (type === 'forgot') {
      verifyResetMutation.mutate({ email, code });
    } else {
      verifyMutation.mutate({ email, code });
    }
  };

  const maskEmail = (emailStr: string) => {
    if (!emailStr || !emailStr.includes('@')) return emailStr;
    const [localPart, domain] = emailStr.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }
    return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }} className="px-6 pt-16">
        <Header showBackButton={true} />

        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-[#98D83A] rounded-full items-center justify-center mb-6">
            <Ionicons name="shield-checkmark-outline" size={40} color="black" />
          </View>
          <Text className="text-3xl font-inter-bold text-white mb-2">Enter Verification Code</Text>
          <Text className="text-gray-400 font-inter-regular text-center">
            We've sent a 6-digit code to {email ? maskEmail(email) : 'your email'}
          </Text>
        </View>

        <View className="relative mb-6">
          <Pressable className="flex-row justify-between" onPress={() => inputRef.current?.focus()}>
            {Array(CODE_LENGTH).fill(0).map((_, index) => {
              const digit = code[index] || "";
              const isFocused = index === code.length || (index === CODE_LENGTH - 1 && code.length === CODE_LENGTH);
              return (
                <View
                  key={index}
                  className={`w-12 h-14 rounded-xl border items-center justify-center bg-transparent ${isFocused ? 'border-[#98D83A]' : 'border-gray-600'}`}
                >
                  <Text className="text-white text-2xl font-inter-bold">{digit}</Text>
                </View>
              );
            })}
          </Pressable>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH))}
            keyboardType="number-pad"
            className="absolute w-full h-full opacity-0"
            autoFocus
          />
        </View>

        <CustomButton
          title={(verifyMutation.isPending || verifyResetMutation.isPending) ? "Verifying..." : "Verify"}
          containerStyle="mb-8"
          onPress={handleVerify}
          disabled={verifyMutation.isPending || verifyResetMutation.isPending || code.length !== CODE_LENGTH}
        />

        <View className="flex-row justify-center mb-4">
          <Text className="text-gray-400 font-inter-regular">Didn't receive the code? </Text>
          <Pressable onPress={handleResend} disabled={timeLeft > 0 || resendMutation.isPending}>
            <Text className={`font-inter-regular ${(timeLeft > 0 || resendMutation.isPending) ? 'text-gray-500' : 'text-[#98D83A]'}`}>
              {resendMutation.isPending ? 'Resending...' : timeLeft > 0 ? `Resend in 00:${timeLeft.toString().padStart(2, '0')}` : 'Resend'}
            </Text>
          </Pressable>
        </View>

        <Pressable className="items-center" onPress={() => router.push("/(auth)/login")}>
          <Text className="text-white font-inter-bold">Back to Login</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
