import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export const Header = ({ title, showBackButton = true }: HeaderProps) => {
  return (
    <View className="flex-row items-center mb-6">
      {showBackButton ? (
        <Pressable 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            }
          }} 
          className="w-10 h-10 justify-center"
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </Pressable>
      ) : (
        <View className="w-10 h-10" />
      )}
      
      {title ? (
        <Text className="text-white font-inter-bold text-xl flex-1 ml-2">{title}</Text>
      ) : null}
    </View>
  );
};
