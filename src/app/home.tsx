import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-[#121212] items-center justify-center">
      <Text className="text-3xl font-inter-bold text-white mb-2">Welcome Home!</Text>
      <Text className="text-gray-400 font-inter-regular">You have successfully logged in.</Text>
    </SafeAreaView>
  );
}
