import React, { useRef } from 'react';
import { View, Text, PanResponder, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface CustomSliderProps {
  value: number;
  onValueChange: (val: number) => void;
  label: string;
}

export const CustomSlider = ({ value, onValueChange, label }: CustomSliderProps) => {
  const latestValue = useRef(value);
  latestValue.current = value;
  const startVal = useRef(value);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startVal.current = latestValue.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        const sliderWidth = width - 80; // Approximate width for panel slider
        const dxPercent = (gestureState.dx / sliderWidth) * 100;
        let newValue = Math.round(startVal.current + dxPercent);
        newValue = Math.max(0, Math.min(100, newValue));
        onValueChange(newValue);
      }
    })
  ).current;

  return (
    <View className="mb-2 w-full">
      <View className="flex-row justify-between mb-2">
        <Text className="text-white font-inter-medium text-[15px]">{label}</Text>
      </View>
      <View
        {...panResponder.panHandlers}
        className="w-full h-10 justify-center relative" // Larger touch target
      >
        <View className="w-full h-1 bg-white/20 rounded-full flex-row items-center relative">
          <View className="h-full bg-[#98FF2F] rounded-full" style={{ width: `${value}%` }} />
          <View className="w-5 h-5 rounded-full bg-[#98FF2F] absolute" style={{ left: `${value}%`, marginLeft: -10 }} />
        </View>
      </View>
    </View>
  );
};
