import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useRef } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function VerifyOtp() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const [code, setCode] = useState("");
  const inputRef = useRef<TextInput>(null);

  const CODE_LENGTH = 6;

  const handleVerify = () => {
    if (type === 'forgot') {
      router.push("/auth/reset-password");
    } else {
      router.push("/auth/profile-setup");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 pt-16 pb-16">
        <Pressable onPress={() => router.back()} className="mb-8 w-10">
          <Ionicons name="chevron-back" size={28} color="white" />
        </Pressable>

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

        <Pressable 
          className="bg-[#98D83A] h-14 rounded-xl items-center justify-center active:opacity-80 mb-8"
          onPress={handleVerify}
        >
          <Text className="text-black font-inter-bold text-lg">Verify</Text>
        </Pressable>

        <View className="flex-row justify-center mb-4">
          <Text className="text-gray-400 font-inter-regular">Didn't receive the code? </Text>
          <Pressable>
            <Text className="text-[#98D83A] font-inter-regular">Resend</Text>
          </Pressable>
        </View>

        <Pressable className="items-center" onPress={() => router.push("/auth/login")}>
          <Text className="text-white font-inter-bold">Back to Login</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
