import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomButton } from "../../components/ui/CustomButton";
import { Header } from "../../components/ui/Header";

export default function VerifyOtp() {
  const { type } = useLocalSearchParams<{ type: string }>();
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

  const handleResend = () => {
    if (timeLeft > 0) return;
    // Add logic to trigger actual resend API here if needed
    setTimeLeft(60);
  };

  const handleVerify = () => {
    if (type === 'forgot') {
      router.push("/(auth)/reset-password");
    } else {
      router.push("/(auth)/profile-setup");
    }
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
            We've sent a 6-digit code to j***@gmail.com
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

        <Text className="text-white font-inter-bold text-center mb-8">Paste Code</Text>

        <CustomButton
          title="Verify"
          containerStyle="mb-8"
          onPress={handleVerify}
        />

        <View className="flex-row justify-center mb-4">
          <Text className="text-gray-400 font-inter-regular">Didn't receive the code? </Text>
          <Pressable onPress={handleResend} disabled={timeLeft > 0}>
            <Text className={`font-inter-regular ${timeLeft > 0 ? 'text-gray-500' : 'text-[#98D83A]'}`}>
              {timeLeft > 0 ? `Resend in 00:${timeLeft.toString().padStart(2, '0')}` : 'Resend'}
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
