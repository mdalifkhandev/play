import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";

interface CustomInputProps extends TextInputProps {
  label?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  leftIconComponent?: React.ReactNode;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  isDark?: boolean;
  containerStyle?: string;
  inputContainerStyle?: string;
  labelStyle?: string;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  iconName,
  leftIconComponent,
  rightIcon,
  isPassword,
  isDark = false,
  containerStyle = "",
  inputContainerStyle = "",
  labelStyle = "",
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className={`mb-4 ${containerStyle}`}>
      {label && (
        <Text className={`mb-2 font-inter-regular ${isDark ? 'text-gray-300' : 'text-gray-300'} ${labelStyle}`}>
          {label}
        </Text>
      )}
      <View className={`flex-row items-center rounded-xl px-4 h-14 ${isDark ? 'bg-transparent border border-[#333]' : 'bg-white'} ${inputContainerStyle}`}>
        {leftIconComponent ? (
          <View className="mr-2">{leftIconComponent}</View>
        ) : iconName ? (
          <Ionicons name={iconName} size={20} color={isDark ? "#888" : "#9CA3AF"} className="mr-2" />
        ) : null}
        <TextInput
          className={`flex-1 h-full font-inter-regular ${isDark ? 'text-white' : 'text-black'}`}
          placeholderTextColor={isDark ? "#666" : "#9CA3AF"}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)} className="p-2">
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={isDark ? "#888" : "#9CA3AF"} />
          </Pressable>
        )}
        {!isPassword && rightIcon && (
          <Ionicons name={rightIcon} size={20} color={isDark ? "#888" : "#555"} className="ml-2" />
        )}
      </View>
    </View>
  );
};
