import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export interface PickerOption {
  label: string;
  value: string | number;
}

interface SmoothBottomSheetPickerProps {
  visible: boolean;
  title: string;
  options: Array<string | PickerOption>;
  selectedValue: string | number;
  onSelect: (value: any) => void;
  onClose: () => void;
}

export function SmoothBottomSheetPicker({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: SmoothBottomSheetPickerProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheetHeight = Math.min(height * 0.58, 540);

  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(sheetHeight);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 24,
          mass: 0.8,
          stiffness: 220,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, sheetHeight]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.6) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 240,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        {/* Animated Dark Backdrop */}
        <Animated.View
          style={{ opacity: backdropOpacity }}
          className="absolute inset-0 bg-black/70"
        >
          <Pressable className="flex-1" onPress={handleClose} />
        </Animated.View>

        {/* Half-Screen Draggable Bottom Sheet */}
        <Animated.View
          style={{
            height: sheetHeight,
            transform: [{ translateY }],
            paddingBottom: Math.max(insets.bottom + 12, 24),
          }}
          className="rounded-t-[32px] border-t border-white/10 bg-[#161616] px-5"
        >
          {/* Draggable Handle Header Area */}
          <View {...panResponder.panHandlers} className="py-3 items-center">
            <View className="h-1.5 w-12 rounded-full bg-white/30 mb-3" />
            <View className="w-full flex-row items-center justify-between px-1">
              <Text className="text-lg font-inter-bold text-white">{title}</Text>
              {/* <Pressable
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="h-8 w-8 rounded-full bg-white/10 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#CCC" />
              </Pressable> */}
            </View>
          </View>

          {/* Smooth Scrollable Options */}
          <ScrollView
            className="flex-1 mt-2"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {options.map(option => {
              const label = typeof option === 'string' ? option : option.label;
              const value = typeof option === 'string' ? option : option.value;
              const isSelected = value === selectedValue;

              return (
                <Pressable
                  key={String(value)}
                  className={`mb-3 flex-row items-center justify-between rounded-2xl border px-4 py-3.5 transition-colors ${isSelected
                      ? 'border-[#A3E635] bg-[#A3E635]/15'
                      : 'border-white/10 bg-white/5 active:bg-white/10'
                    }`}
                  onPress={() => {
                    onSelect(value);
                    handleClose();
                  }}
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      className={`mr-3 h-5 w-5 items-center justify-center rounded-full border ${isSelected ? 'border-[#A3E635]' : 'border-white/40'
                        }`}
                    >
                      {isSelected && <View className="h-2.5 w-2.5 rounded-full bg-[#A3E635]" />}
                    </View>
                    <Text
                      className={`text-base font-inter-semibold ${isSelected ? 'text-[#A3E635]' : 'text-white'
                        }`}
                    >
                      {label}
                    </Text>
                  </View>

                  {isSelected && <Ionicons name="checkmark-circle" size={22} color="#A3E635" />}
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
