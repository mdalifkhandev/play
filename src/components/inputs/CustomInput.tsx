import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";

interface CustomInputProps extends TextInputProps {
  label?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  containerStyle?: string;
  inputContainerStyle?: string;
  labelStyle?: string;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  iconName,
  isPassword,
  containerStyle = "",
  inputContainerStyle = "",
  labelStyle = "",
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className={`mb-4 ${containerStyle}`}>
      {label && (
        <Text className={`text-gray-300 mb-2 font-inter-regular ${labelStyle}`}>
          {label}
        </Text>
      )}
      <View className={`flex-row items-center bg-white rounded-xl px-4 h-14 ${inputContainerStyle}`}>
        {iconName && <Ionicons name={iconName} size={20} color="#9CA3AF" className="mr-2" />}
        <TextInput
          className="flex-1 text-black h-full font-inter-regular"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)} className="p-2">
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
          </Pressable>
        )}
      </View>
    </View>
  );
};
