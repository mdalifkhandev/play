import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export const Header = ({ title, showBackButton = true }: HeaderProps) => {
  return (
    <View className="flex-row items-center mb-6 mt-4 px-4">
      <View className="w-10 h-10 justify-center">
        {showBackButton && (
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              }
            }}
            className="w-10 h-10 justify-center -ml-2"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
        )}
      </View>

      {title ? (
        <Text className="text-white font-inter-bold text-base flex-1 text-center">{title}</Text>
      ) : <View className="flex-1" />}

      <View className="w-10 h-10" />
    </View>
  );
};
