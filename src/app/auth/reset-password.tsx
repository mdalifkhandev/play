import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { CustomInput } from "../../components/inputs/CustomInput";

export default function ResetPassword() {
  const [acceptTerms, setAcceptTerms] = useState(false);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 pt-16 pb-16">
        <Pressable onPress={() => router.back()} className="mb-8 w-10">
          <Ionicons name="chevron-back" size={28} color="white" />
        </Pressable>

        <Text className="text-3xl font-inter-bold text-white mb-2">Set a new password</Text>
        <Text className="text-gray-400 font-inter-regular mb-10">Please set a new password for your account to continue</Text>

        <CustomInput
          label="New Password"
          placeholder="••••••••"
          iconName="lock-closed-outline"
          isPassword
          containerStyle="mb-6"
        />

        <CustomInput
          label="Confirm Password"
          placeholder="••••••••"
          iconName="lock-closed-outline"
          isPassword
          containerStyle="mb-6"
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

        <Pressable 
          className="bg-[#98D83A] h-14 rounded-xl items-center justify-center active:opacity-80"
          onPress={() => router.push("/home")}
        >
          <Text className="text-black font-inter-bold text-lg">Update Password</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
