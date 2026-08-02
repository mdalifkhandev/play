import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner-native';
import { apiClient, handleApiError } from "../../../src/api/client";
import { GoogleIcon } from "../../components/icons/GoogleIcon";
import { CustomInput } from "../../components/inputs/CustomInput";
import { CustomButton } from "../../components/ui/CustomButton";
import { Header } from "../../components/ui/Header";

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const insets = useSafeAreaInsets();

  const mutation = useMutation({
    mutationFn: (data: any) => {
      return apiClient.post('/auth/sign-up', data);
    },
    onSuccess: (response) => {
      toast.success('Signup Successful!');
      // Assuming success means we can proceed to OTP
      router.push({ pathname: '/(auth)/verify-otp', params: { type: 'signup', email } });
    },
    onError: (error: any) => {
      if (error?.response?.status === 409) {
        toast.error('User already exists. Please login.');
      } else {
        toast.error(handleApiError(error, 'Failed to sign up'));
      }
    }
  });

  const handleSignUp = () => {
    if (!email || !password || !confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    mutation.mutate({
      email,
      password,
      confirmPassword,
      acceptTerms
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }} className="px-6 pt-16">
        <Header showBackButton={true} />

        <Text className="text-3xl font-inter-bold text-white mb-2">Sign Up</Text>
        <Text className="text-gray-400 font-inter-regular mb-8">It only takes a minute to create your account</Text>

        <CustomInput
          label="Enter Your E-mail"
          placeholder="E-mail address"
          containerStyle="mb-6"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <CustomInput
          label="Password"
          placeholder="••••••••"
          iconName="lock-closed-outline"
          isPassword
          containerStyle="mb-6"
          value={password}
          onChangeText={setPassword}
        />

        <CustomInput
          label="Confirm Password"
          placeholder="••••••••"
          iconName="lock-closed-outline"
          isPassword
          containerStyle="mb-4"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Pressable
          className="flex-row items-center mb-8 py-2"
          onPress={() => setAcceptTerms(!acceptTerms)}
        >
          <View className={`w-5 h-5 rounded-md border items-center justify-center mr-2 ${acceptTerms ? 'bg-[#98D83A] border-[#98D83A]' : 'border-gray-500'}`}>
            {acceptTerms && <Ionicons name="checkmark" size={14} color="black" />}
          </View>
          <Text className="text-gray-300 font-inter-regular">Accept <Text className="text-gray-400 underline font-inter-regular">terms & conditions</Text></Text>
        </Pressable>

        <CustomButton
          title={mutation.isPending ? "Signing Up..." : "Sign Up"}
          variant="primary"
          containerStyle="mb-10"
          onPress={handleSignUp}
          disabled={!acceptTerms || mutation.isPending}
        />

        <View className="flex-row items-center mb-8">
          <View className="flex-1 h-[1px] bg-gray-700" />
          <Text className="text-gray-400 font-inter-regular px-4">Or Continue With</Text>
          <View className="flex-1 h-[1px] bg-gray-700" />
        </View>

        <View className="flex-row justify-center space-x-6 gap-4">
          <Pressable className="w-12 h-12 bg-white rounded-full items-center justify-center active:opacity-80">
            <GoogleIcon width={24} height={24} />
          </Pressable>
          <Pressable className="w-12 h-12 bg-white rounded-full items-center justify-center active:opacity-80">
            <Ionicons name="logo-apple" size={24} color="black" />
          </Pressable>
          <Pressable className="w-12 h-12 bg-white rounded-full items-center justify-center active:opacity-80">
            <Ionicons name="logo-facebook" size={24} color="#1877F2" />
          </Pressable>
        </View>

        <View className="flex-row justify-center mt-[24px]">
          <Text className="text-gray-400 font-inter-regular">Already have an account? </Text>
          <Pressable onPress={() => router.back()}>
            <Text className="text-[#98D83A] font-inter-bold">Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
