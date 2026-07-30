import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomInput } from "../../components/inputs/CustomInput";
import { CustomButton } from "../../components/ui/CustomButton";
import { Header } from "../../components/ui/Header";

export default function ForgotPassword() {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }} className="px-6 pt-16">
        <Header showBackButton={true} />

        <Text className="text-3xl font-inter-bold text-white mb-2">Forgot Password</Text>
        <Text className="text-gray-400 font-inter-regular mb-10">Enter your email address to receive a verification code</Text>

        <CustomInput
          label="Enter Your E-mail"
          placeholder="E-mail address"
          containerStyle="mb-10"
        />

        <CustomButton
          title="Send Code"
          onPress={() => router.push({ pathname: '/(auth)/verify-otp', params: { type: 'forgot' } })}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
