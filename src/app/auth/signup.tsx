import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 pt-16 pb-8">
        <Pressable onPress={() => router.back()} className="mb-8 w-10">
          <Ionicons name="chevron-back" size={28} color="white" />
        </Pressable>

        <Text className="text-3xl font-bold text-white mb-2">Sign Up</Text>
        <Text className="text-gray-400 mb-8">It only takes a minute to create your account</Text>

        <View className="mb-6">
          <Text className="text-gray-300 mb-2">Enter Your E-mail</Text>
          <View className="flex-row items-center bg-white rounded-xl px-4 h-14">
            <TextInput 
              className="flex-1 text-black h-full"
              placeholder="E-mail address"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-gray-300 mb-2">Password</Text>
          <View className="flex-row items-center bg-white rounded-xl px-4 h-14">
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" className="mr-2" />
            <TextInput 
              className="flex-1 text-black h-full ml-2"
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} className="p-2">
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
            </Pressable>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-gray-300 mb-2">Confirm Password</Text>
          <View className="flex-row items-center bg-white rounded-xl px-4 h-14">
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" className="mr-2" />
            <TextInput 
              className="flex-1 text-black h-full ml-2"
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showConfirmPassword}
            />
            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-2">
              <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
            </Pressable>
          </View>
        </View>

        <Pressable 
          className="flex-row items-center mb-8 py-2" 
          onPress={() => setAcceptTerms(!acceptTerms)}
        >
          <View className={`w-5 h-5 rounded-md border items-center justify-center mr-2 ${acceptTerms ? 'bg-[#98D83A] border-[#98D83A]' : 'border-gray-500'}`}>
            {acceptTerms && <Ionicons name="checkmark" size={14} color="black" />}
          </View>
          <Text className="text-gray-300">Accept <Text className="text-gray-400 underline">terms & conditions</Text></Text>
        </Pressable>

        <Pressable className="bg-[#98D83A] h-14 rounded-xl items-center justify-center mb-10 active:opacity-80">
          <Text className="text-black font-bold text-lg">Sign Up</Text>
        </Pressable>

        <View className="flex-row items-center mb-8">
          <View className="flex-1 h-[1px] bg-gray-700" />
          <Text className="text-gray-400 px-4">Or Continue With</Text>
          <View className="flex-1 h-[1px] bg-gray-700" />
        </View>

        <View className="flex-row justify-center space-x-6 mb-12 gap-4">
          <Pressable className="w-12 h-12 bg-white rounded-full items-center justify-center active:opacity-80">
            <Ionicons name="logo-google" size={24} color="black" />
          </Pressable>
          <Pressable className="w-12 h-12 bg-white rounded-full items-center justify-center active:opacity-80">
            <Ionicons name="logo-apple" size={24} color="black" />
          </Pressable>
          <Pressable className="w-12 h-12 bg-white rounded-full items-center justify-center active:opacity-80">
            <Ionicons name="logo-facebook" size={24} color="#1877F2" />
          </Pressable>
        </View>

        <View className="flex-row justify-center mt-auto">
          <Text className="text-gray-400">Already have an account? </Text>
          <Pressable onPress={() => router.back()}>
            <Text className="text-[#98D83A] font-bold">Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
