import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomInput } from "../../components/inputs/CustomInput";
import { Header } from "../../components/ui/Header";
export default function ProfileSetup() {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      {/* Header overlaid on top */}
      <View style={{ paddingTop: insets.top + 16 }} className="absolute top-0 left-0 right-0 z-10 px-6">
        <Header showBackButton={true} />
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 80, // Padding to push initial content below header
          paddingBottom: insets.bottom + 24
        }}
        className="px-6"
      >
        <View className="items-center mb-8">
          <View className="w-24 h-24 bg-gray-700 rounded-full items-center justify-center mb-4 overflow-hidden">
            <Ionicons name="camera" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-white font-inter-bold text-lg">Upload Photo</Text>
        </View>

        <CustomInput
          label="Username"
          placeholder="@username"
          containerStyle="mb-4"
        />

        <CustomInput
          label="Display Name"
          placeholder="Your Name"
          containerStyle="mb-4"
        />

        <CustomInput
          label="Bio"
          placeholder="Tell us about yourself..."
          containerStyle="mb-4"
          multiline
          inputContainerStyle="h-24 py-3"
          textAlignVertical="top"
        />

        <CustomInput
          label="Instagram"
          placeholder="@username"
          iconName="logo-instagram"
          containerStyle="mb-4"
        />

        <CustomInput
          label="YouTube"
          placeholder="Channel URL"
          iconName="logo-youtube"
          containerStyle="mb-8"
        />

        <Pressable
          className="bg-[#98D83A] h-14 rounded-xl items-center justify-center active:opacity-80 mb-4"
          onPress={() => router.push("/home")}
        >
          <Text className="text-black font-inter-bold text-lg">Complete Setup</Text>
        </Pressable>

        <Pressable
          className="border border-gray-600 h-14 rounded-xl items-center justify-center active:opacity-80 mb-8"
          onPress={() => router.push("/home")}
        >
          <Text className="text-[#98D83A] font-inter-bold text-lg">Skip</Text>
        </Pressable>
        <View className="pb-52" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
