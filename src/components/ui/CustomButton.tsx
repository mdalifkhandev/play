import { Pressable, PressableProps, Text, ActivityIndicator } from "react-native";

interface CustomButtonProps extends PressableProps {
  title: string;
  variant?: "primary" | "outline";
  containerStyle?: string;
  textStyle?: string;
  isLoading?: boolean;
}

export const CustomButton = ({
  title,
  variant = "primary",
  containerStyle = "",
  textStyle = "",
  isLoading = false,
  ...props
}: CustomButtonProps) => {
  const isPrimary = variant === "primary";

  const defaultContainerClass = isPrimary
    ? "bg-[#98D83A]"
    : "border border-gray-600 bg-transparent";

  const defaultTextClass = isPrimary ? "text-black" : "text-[#98D83A]";

  return (
    <Pressable
      className={`h-14 rounded-xl items-center justify-center flex-row active:opacity-80 ${defaultContainerClass} ${containerStyle} ${(props.disabled || isLoading) ? 'opacity-50' : ''}`}
      disabled={props.disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <ActivityIndicator 
          color={isPrimary ? 'black' : '#98D83A'} 
          style={{ marginRight: 8 }} 
        />
      )}
      <Text className={`font-inter-bold text-lg ${defaultTextClass} ${textStyle}`}>
        {title}
      </Text>
    </Pressable>
  );
};
