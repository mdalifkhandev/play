import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Pressable, Animated, Dimensions, Image, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store';
import { useRouter } from 'expo-router';

const { height } = Dimensions.get('window');

type Gift = {
  id: string;
  name: string;
  icon: string;
  price: number;
};

const GIFTS: Gift[] = [
  { id: '1', name: 'ROSE', icon: '🌹', price: 10 },
  { id: '2', name: 'ROSE', icon: '🌹', price: 10 },
  { id: '3', name: 'Rocket', icon: '🚀', price: 20 },
  { id: '4', name: 'Love', icon: '💌', price: 50 },
  { id: '5', name: 'Gem', icon: '💎', price: 100 },
  { id: '6', name: 'ROSE', icon: '🌹', price: 10 },
  { id: '7', name: 'ROSE', icon: '🌹', price: 10 },
  { id: '8', name: 'Rocket', icon: '🚀', price: 20 },
  { id: '9', name: 'Love', icon: '💌', price: 50 },
  { id: '10', name: 'Gem', icon: '💎', price: 100 },
];

interface LiveGiftModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectGift: (gift: Gift) => void;
}

export function LiveGiftModal({ visible, onClose, onSelectGift }: LiveGiftModalProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const coinBalance = useAppStore((state) => state.coinBalance);
  const router = useRouter();
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>('1'); // Default select first one

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const handleRecharge = () => {
    onClose();
    setTimeout(() => {
      router.push('/screens/coins/wallet');
    }, 300);
  };

  const handleSendGift = () => {
    const gift = GIFTS.find(g => g.id === selectedGiftId);
    if (gift) {
      onSelectGift(gift);
    }
  };

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <Animated.View 
          className="absolute inset-0 bg-black/60"
          style={{ opacity: fadeAnim }}
        >
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View 
          className="bg-[#0A0A0A] rounded-t-[32px] pt-3 px-4 pb-6"
          style={{ 
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom > 0 ? insets.bottom + 24 : 32
          }}
        >
          {/* Drag Indicator */}
          <View className="w-10 h-1 bg-white rounded-full self-center mb-6" />

          {/* Header */}
          <View className="flex-row items-center justify-between mb-8 px-2">
            <Text className="text-white font-inter-semibold text-xl">Send a Gift</Text>
            
            <Pressable 
              onPress={handleRecharge}
              className="flex-row items-center bg-[#333] px-3 py-2 rounded-xl"
            >
              <View className="w-4 h-4 rounded-full bg-[#FFD700] items-center justify-center mr-2 border border-[#FFD700]">
                <Text className="text-black text-[10px] font-bold">S</Text>
              </View>
              <Text className="text-white font-inter-medium text-sm">{coinBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <View className="ml-2 border border-white rounded-[4px] p-[2px]">
                <Ionicons name="add" size={12} color="#FFF" />
              </View>
            </Pressable>
          </View>

          {/* Grid */}
          <View className="flex-row flex-wrap justify-between px-2 mb-6 gap-y-4">
            {GIFTS.map((gift) => {
              const isSelected = selectedGiftId === gift.id;
              return (
                <Pressable 
                  key={gift.id}
                  onPress={() => setSelectedGiftId(gift.id)}
                  className={`w-[18%] py-3 items-center border rounded-[16px] ${isSelected ? 'border-[#98D83A] bg-[#98D83A]/5' : 'border-[#222]'}`}
                >
                  <Text className="text-2xl mb-1">{gift.icon}</Text>
                  <Text className="text-white text-[10px] font-inter-medium mb-1">{gift.name}</Text>
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full border border-[#FFD700] items-center justify-center mr-1">
                      <Text className="text-[#FFD700] text-[6px] font-bold">S</Text>
                    </View>
                    <Text className="text-white text-[10px]">{gift.price}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Bottom Buttons */}
          <View className="flex-row items-center justify-between px-2 gap-x-4">
            <Pressable 
              onPress={onClose}
              className="flex-1 py-4 items-center justify-center rounded-2xl border border-[#98D83A] bg-[#333]"
            >
              <Text className="text-[#98D83A] font-inter-semibold text-base">Cancel</Text>
            </Pressable>

            <Pressable 
              onPress={handleSendGift}
              className="flex-1 py-4 items-center justify-center rounded-2xl bg-[#98D83A]"
            >
              <Text className="text-[#111] font-inter-semibold text-base">Send Gift</Text>
            </Pressable>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}
