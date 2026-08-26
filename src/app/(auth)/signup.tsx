import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { handleApiError } from "../../../src/api/client";
import { useAppleLoginMutation, useGoogleLoginMutation, useSignupMutation } from "../../../src/api/auth";
import { useAppStore } from "../../../src/store";
import { GoogleIcon } from "../../components/icons/GoogleIcon";
import { CustomInput } from "../../components/inputs/CustomInput";
import { CustomButton } from "../../components/ui/CustomButton";
import { Header } from "../../components/ui/Header";
import { AnnouncementNotice } from "../../components/announcements/AnnouncementNotice";

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isAppleSigningIn, setIsAppleSigningIn] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const insets = useSafeAreaInsets();
  const setAuth = useAppStore((state) => state.setAuth);

  const signupMutation = useSignupMutation();
  const googleLoginMutation = useGoogleLoginMutation();
  const appleLoginMutation = useAppleLoginMutation();
  const isAuthBusy = signupMutation.isPending || googleLoginMutation.isPending || appleLoginMutation.isPending || isGoogleSigningIn || isAppleSigningIn;

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

  const handleSignUp = () => {
    if (!email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!acceptTerms) {
      toast.error('Please accept the Terms of Service');
      return;
    }

    signupMutation.mutate(
      { email, password, confirmPassword, acceptTerms },
      {
        onSuccess: (response) => {
          toast.success('Signup Successful!');
          router.push({ pathname: '/(auth)/verify-otp', params: { type: 'signup', email } });
        },
        onError: (error: any) => {
          if (error?.response?.status === 409) {
            toast.error('User already exists. Please login.');
          } else {
            toast.error(handleApiError(error, 'Failed to sign up'));
          }
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
            toast.error(handleApiError(error, 'Failed to continue with Google'));
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
      toast.error(handleApiError(error, 'Failed to continue with Google'));
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
            toast.error(handleApiError(error, 'Failed to continue with Apple'));
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
      toast.error(handleApiError(error, 'Failed to continue with Apple'));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }} className="px-6 pt-16">
        <Header showBackButton={true} />

        <AnnouncementNotice placement="login_notice" />

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
          editable={!isAuthBusy}
        />

        <CustomInput
          label="Password"
          placeholder="••••••••"
          iconName="lock-closed-outline"
          isPassword
          containerStyle="mb-6"
          value={password}
          onChangeText={setPassword}
          editable={!isAuthBusy}
        />

        <CustomInput
          label="Confirm Password"
          placeholder="••••••••"
          iconName="lock-closed-outline"
          isPassword
          containerStyle="mb-4"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isAuthBusy}
        />

        <Pressable
          className="flex-row items-center mb-8 py-2"
          onPress={() => setAcceptTerms(!acceptTerms)}
          disabled={isAuthBusy}
        >
          <View className={`w-5 h-5 rounded-md border items-center justify-center mr-2 ${acceptTerms ? 'bg-[#98D83A] border-[#98D83A]' : 'border-gray-500'}`}>
            {acceptTerms && <Ionicons name="checkmark" size={14} color="black" />}
          </View>
          <Text className="text-gray-300 font-inter-regular">Accept <Text className="text-gray-400 underline font-inter-regular">terms & conditions</Text></Text>
        </Pressable>

        <CustomButton
          title={isAuthBusy ? "Signing Up..." : "Sign Up"}
          variant="primary"
          containerStyle="mb-10"
          onPress={handleSignUp}
          disabled={!acceptTerms || isAuthBusy}
        />

        <View className="flex-row items-center mb-8">
          <View className="flex-1 h-[1px] bg-gray-700" />
          <Text className="text-gray-400 font-inter-regular px-4">Or Continue With</Text>
          <View className="flex-1 h-[1px] bg-gray-700" />
        </View>

        <View className="flex-row justify-center space-x-6 gap-4">
          <Pressable
            className="w-12 h-12 bg-white rounded-full items-center justify-center active:opacity-80"
            disabled={isAuthBusy}
            onPress={handleGoogleLogin}
          >
            {isGoogleSigningIn || googleLoginMutation.isPending ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <GoogleIcon width={24} height={24} />
            )}
          </Pressable>
          {Platform.OS === 'ios' && isAppleAvailable && (
            <Pressable
              className="w-12 h-12 bg-white rounded-full items-center justify-center active:opacity-80"
              disabled={isAuthBusy}
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
          <Text className="text-gray-400 font-inter-regular">Already have an account? </Text>
          <Pressable onPress={() => router.back()}>
            <Text className="text-[#98D83A] font-inter-bold">Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
