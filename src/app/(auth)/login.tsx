import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { handleApiError } from "../../../src/api/client";
import { useAppStore } from "../../../src/store";
import { useAppleLoginMutation, useGoogleLoginMutation, useLoginMutation } from "../../../src/api/auth";
import { GoogleIcon } from "../../components/icons/GoogleIcon";
import { CustomInput } from "../../components/inputs/CustomInput";
import { CustomButton } from "../../components/ui/CustomButton";
import { Header } from "../../components/ui/Header";
import { AnnouncementNotice } from "../../components/announcements/AnnouncementNotice";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isAppleSigningIn, setIsAppleSigningIn] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const insets = useSafeAreaInsets();
  const setAuth = useAppStore((state) => state.setAuth);

  const loginMutation = useLoginMutation();
  const googleLoginMutation = useGoogleLoginMutation();
  const appleLoginMutation = useAppleLoginMutation();
  const isAuthBusy = loginMutation.isPending || googleLoginMutation.isPending || appleLoginMutation.isPending || isGoogleSigningIn || isAppleSigningIn;

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
      profileImageSize: 120,
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setIsAppleAvailable(false);
      return;
    }

    AppleAuthentication.isAvailableAsync()
      .then(setIsAppleAvailable)
      .catch(() => setIsAppleAvailable(false));
  }, []);

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
    if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
      toast.error('Google Web Client ID is not configured');
      return;
    }

    try {
      setIsGoogleSigningIn(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut().catch(() => undefined);
      const signInResult = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken || ('data' in signInResult ? signInResult.data?.idToken : undefined);

      if (!idToken) {
        setIsGoogleSigningIn(false);
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
          onSettled: () => {
            setIsGoogleSigningIn(false);
          },
        },
      );
    } catch (error: any) {
      setIsGoogleSigningIn(false);
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      toast.error(handleApiError(error, 'Failed to login with Google'));
    }
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== 'ios' || !isAppleAvailable) {
      toast.error('Apple login is available only on supported iOS devices');
      return;
    }

    try {
      setIsAppleSigningIn(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        setIsAppleSigningIn(false);
        toast.error('Apple did not return an identity token');
        return;
      }

      appleLoginMutation.mutate(
        {
          identityToken: credential.identityToken,
          fullName: {
            givenName: credential.fullName?.givenName,
            familyName: credential.fullName?.familyName,
          },
          rememberMe: true,
        },
        {
          onSuccess: (response) => {
            finishAuth(response, 'Apple login successful!');
          },
          onError: (error: any) => {
            toast.error(handleApiError(error, 'Failed to login with Apple'));
          },
          onSettled: () => {
            setIsAppleSigningIn(false);
          },
        },
      );
    } catch (error: any) {
      setIsAppleSigningIn(false);
      if (error?.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      toast.error(handleApiError(error, 'Failed to login with Apple'));
    }
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

        <AnnouncementNotice placement="login_notice" />

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
          editable={!isAuthBusy}
        />

        <CustomInput
          label="Password"
          placeholder="••••••••"
          iconName="lock-closed-outline"
          isPassword
          value={password}
          onChangeText={setPassword}
          editable={!isAuthBusy}
        />

        <View className="flex-row justify-between items-center mb-8">
          <Pressable
            className="flex-row items-center py-2"
            onPress={() => setRememberMe(!rememberMe)}
            disabled={isAuthBusy}
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
          title={isAuthBusy ? "Logging in..." : "Login"}
          variant="primary"
          containerStyle="mb-10"
          onPress={handleLogin}
          disabled={isAuthBusy}
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
            disabled={isAuthBusy}
          >
            {isAuthBusy ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <GoogleIcon width={24} height={24} />
            )}
          </Pressable>
          {Platform.OS === 'ios' && isAppleAvailable && (
            <Pressable
              disabled={isAuthBusy}
              className="w-12 h-12 bg-white rounded-full items-center justify-center active:opacity-80"
              onPress={handleAppleLogin}
            >
              {isAppleSigningIn || appleLoginMutation.isPending ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <Ionicons name="logo-apple" size={24} color="black" />
              )}
            </Pressable>
          )}
        </View>

        <View className="flex-row justify-center mt-[24px]">
          <Text className="text-gray-400 font-inter-regular">Don&apos;t have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <Pressable>
              <Text className="text-[#98D83A] font-inter-bold">Sign Up</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>

      {isAuthBusy && (
        <View className="absolute inset-0 items-center justify-center bg-black/55 px-8">
          <View className="w-full max-w-[280px] items-center rounded-2xl border border-white/10 bg-[#181818] px-6 py-7">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#98FF2F]">
              <ActivityIndicator size="large" color="#0A0A0A" />
            </View>
            <Text className="text-center text-lg font-inter-bold text-white">
              Signing you in
            </Text>
            <Text className="mt-2 text-center text-sm font-inter-regular text-gray-400">
              Please wait while we connect your account.
            </Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
