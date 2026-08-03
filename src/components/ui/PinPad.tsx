import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PinPadProps {
  value: string;
  onValueChange: (value: string) => void;
  maxLength?: number;
  children?: React.ReactNode;
}

export const PinPad = ({ value, onValueChange, maxLength = 6, children }: PinPadProps) => {
  const handlePress = (num: string) => {
    if (value.length < maxLength) {
      onValueChange(value + num);
    }
  };

  const handleBackspace = () => {
    if (value.length > 0) {
      onValueChange(value.slice(0, -1));
    }
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < maxLength; i++) {
      const isFilled = i < value.length;
      const isCurrent = i === value.length;

      dots.push(
        <View
          key={i}
          className={`w-[45px] h-[55px] rounded-xl border flex items-center justify-center ${isFilled || isCurrent ? 'border-[#98D83A]' : 'border-[#333333]'
            }`}
        >
          {isFilled && (
            <Text className="text-[#98D83A] text-2xl font-inter-bold">{value[i]}</Text>
          )}
          {isCurrent && !isFilled && (
            <View className="w-[2px] h-[24px] bg-[#98D83A]" />
          )}
        </View>
      );
    }
    return <View className="flex-row justify-between w-full mb-6">{dots}</View>;
  };

  const NumberButton = ({ num, empty }: { num?: string, empty?: boolean }) => {
    if (empty) {
      return <View className="w-[30%] aspect-[1.5]" />;
    }

    if (num === 'backspace') {
      return (
        <Pressable
          onPress={handleBackspace}
          className="w-[30%] aspect-[1.5] items-center justify-center bg-[#1C1C1E] rounded-xl active:opacity-70"
        >
          <Ionicons name="backspace-outline" size={28} color="white" />
        </Pressable>
      );
    }

    return (
      <Pressable
        onPress={() => handlePress(num as string)}
        className="w-[30%] aspect-[1.5] items-center justify-center bg-[#1C1C1E] rounded-xl active:opacity-70 pb-3"
      >
        <Text className="text-white text-2xl font-inter-bold">{num}</Text>
      </Pressable>
    );
  };

  return (
    <View className="w-full items-center">
      {renderDots()}
      
      {children}

      <View className="flex-row flex-wrap justify-between w-full gap-y-4 px-4">
        <NumberButton num="1" />
        <NumberButton num="2" />
        <NumberButton num="3" />
        <NumberButton num="4" />
        <NumberButton num="5" />
        <NumberButton num="6" />
        <NumberButton num="7" />
        <NumberButton num="8" />
        <NumberButton num="9" />
        <NumberButton empty />
        <NumberButton num="0" />
        <NumberButton num="backspace" />
      </View>
    </View>
  );
};
