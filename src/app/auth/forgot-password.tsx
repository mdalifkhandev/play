import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomInput } from "../../components/inputs/CustomInput";
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

        <Pressable 
          className="bg-[#98D83A] h-14 rounded-xl items-center justify-center active:opacity-80"
          onPress={() => router.push({ pathname: '/auth/verify-otp', params: { type: 'forgot' } })}
        >
          <Text className="text-black font-inter-bold text-lg">Send Code</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
