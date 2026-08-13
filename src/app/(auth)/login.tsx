import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { handleApiError } from "../../../src/api/client";
import { useAppStore } from "../../../src/store";
import { useGoogleLoginMutation, useLoginMutation } from "../../../src/api/auth";
import { GoogleIcon } from "../../components/icons/GoogleIcon";
import { CustomInput } from "../../components/inputs/CustomInput";
import { CustomButton } from "../../components/ui/CustomButton";
import { Header } from "../../components/ui/Header";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const insets = useSafeAreaInsets();
  const setAuth = useAppStore((state) => state.setAuth);

  const loginMutation = useLoginMutation();
  const googleLoginMutation = useGoogleLoginMutation();
  const [googleRequest, , promptGoogleLogin] = Google.useIdTokenAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
  });

  const finishAuth = (response: any, successMessage: string) => {
    const accessToken = response.data?.data?.tokens?.accessToken;
    const refreshToken = response.data?.data?.tokens?.refreshToken;
    const user = response.data?.data?.user;

    if (accessToken) {
      setAuth(accessToken, refreshToken || "", user);
    }

    toast.success(successMessage);
    router.push('/home');
  };

  const handleLogin = () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    
    loginMutation.mutate(
      { email, password, rememberMe },
      {
        onSuccess: (response) => {
          finishAuth(response, 'Login Successful!');
        },
        onError: (error: any) => {
          toast.error(handleApiError(error, 'Failed to login'));
        }
      }
    );
  };

  const handleGoogleLogin = async () => {
    if (!process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) {
      toast.error('Google login is not configured');
      return;
    }

    const result = await promptGoogleLogin();

    if (result.type !== 'success') {
      return;
    }

    const idToken = result.params?.id_token;

    if (!idToken) {
      toast.error('Google did not return an ID token');
      return;
    }

    googleLoginMutation.mutate(
      { idToken, rememberMe: true },
      {
        onSuccess: (response) => {
          finishAuth(response, 'Google login successful!');
        },
        onError: (error: any) => {
          toast.error(handleApiError(error, 'Failed to login with Google'));
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      className="flex-1 bg-[#121212]"
    >
      <ScrollView
        className="px-6 pt-16"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 160 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <Header showBackButton={true} />

        <Text className="text-3xl font-inter-bold text-white mb-2">Welcome Back</Text>
        <Text className="text-gray-400 font-inter-regular mb-10">Login to your account</Text>

        <CustomInput
          label="Enter Your E-mail"
          placeholder="E-mail address or number"
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
          value={password}
          onChangeText={setPassword}
        />

        <View className="flex-row justify-between items-center mb-8">
          <Pressable
            className="flex-row items-center py-2"
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View className={`w-5 h-5 rounded-md border items-center justify-center mr-2 ${rememberMe ? 'bg-[#98D83A] border-[#98D83A]' : 'border-gray-500'}`}>
              {rememberMe && <Ionicons name="checkmark" size={14} color="black" />}
            </View>
            <Text className="text-gray-300 font-inter-regular">Remember me</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
            <Text className="text-red-500 font-inter-regular py-2">Forgot password?</Text>
          </Pressable>
        </View>

        <CustomButton
          title={loginMutation.isPending ? "Logging in..." : "Login"}
          variant="primary"
          containerStyle="mb-10"
          onPress={handleLogin}
          disabled={loginMutation.isPending || googleLoginMutation.isPending}
        />

        <View className="flex-row items-center mb-8">
          <View className="flex-1 h-[1px] bg-gray-700" />
          <Text className="text-gray-400 font-inter-regular px-4">Or Continue With</Text>
          <View className="flex-1 h-[1px] bg-gray-700" />
        </View>

        <View className="flex-row justify-center space-x-6  gap-4">
          <Pressable
            className="w-12 h-12 bg-white rounded-full items-center justify-center active:opacity-80"
            onPress={handleGoogleLogin}
            disabled={!googleRequest || googleLoginMutation.isPending || loginMutation.isPending}
          >
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
          <Text className="text-gray-400 font-inter-regular">Don't have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <Pressable>
              <Text className="text-[#98D83A] font-inter-bold">Sign Up</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
