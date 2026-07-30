import { Pressable, PressableProps, Text } from "react-native";

interface CustomButtonProps extends PressableProps {
  title: string;
  variant?: "primary" | "outline";
  containerStyle?: string;
  textStyle?: string;
}

export const CustomButton = ({
  title,
  variant = "primary",
  containerStyle = "",
  textStyle = "",
  ...props
}: CustomButtonProps) => {
  const isPrimary = variant === "primary";

  const defaultContainerClass = isPrimary
    ? "bg-[#98D83A]"
    : "border border-gray-600 bg-transparent";

  const defaultTextClass = isPrimary ? "text-black" : "text-[#98D83A]";

  return (
    <Pressable
      className={`h-14 rounded-xl items-center justify-center active:opacity-80 ${defaultContainerClass} ${containerStyle}`}
      {...props}
    >
      <Text className={`font-inter-bold text-lg ${defaultTextClass} ${textStyle}`}>
        {title}
      </Text>
    </Pressable>
  );
};
