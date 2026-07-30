import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { CustomInput } from "../../components/inputs/CustomInput";
import { GoogleIcon } from "../../components/icons/GoogleIcon";

export default function SignUp() {
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

        <Text className="text-3xl font-inter-bold text-white mb-2">Sign Up</Text>
        <Text className="text-gray-400 font-inter-regular mb-8">It only takes a minute to create your account</Text>

        <CustomInput
          label="Enter Your E-mail"
          placeholder="E-mail address"
          containerStyle="mb-6"
        />

        <CustomInput
          label="Password"
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
          containerStyle="mb-4"
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
          className="bg-[#98D83A] h-14 rounded-xl items-center justify-center mb-10 active:opacity-80"
          onPress={() => router.push({ pathname: '/auth/verify-otp', params: { type: 'signup' } })}
        >
          <Text className="text-black font-inter-bold text-lg">Sign Up</Text>
        </Pressable>

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
