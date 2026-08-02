import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, Pressable, Animated, Dimensions, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileMenu({ visible, onClose }: ProfileMenuProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
          toValue: width,
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

  const navigateTo = (path: string) => {
    onClose();
    setTimeout(() => {
      router.push(path as any);
    }, 300);
  };

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <View className="flex-1 flex-row justify-end">
        
        {/* Backdrop */}
        <Animated.View 
          className="absolute inset-0 bg-black"
          style={{ opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) }}
        >
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>

        {/* Menu Drawer */}
        <Animated.View 
          className="w-[75%] bg-[#111] h-full"
          style={{ 
            transform: [{ translateX: slideAnim }],
            paddingTop: insets.top,
            paddingBottom: insets.bottom
          }}
        >
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            
            {/* Assets Section */}
            <View className="px-5 pt-6 pb-2">
              <Text className="text-[#888] text-xs font-semibold mb-4">Assets</Text>
              
              <Pressable onPress={() => navigateTo('/screens/menu/balance')} className="flex-row items-center justify-between py-3 mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="wallet-outline" size={22} color="white" />
                  <Text className="text-white text-base ml-4 font-medium">Balance</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </Pressable>
              
              <View className="h-[1px] bg-[#222] my-2" />
            </View>

            {/* Account Information Section */}
            <View className="px-5 py-2">
              <Text className="text-[#888] text-xs font-semibold mb-4">Account Information</Text>
              
              <Pressable className="flex-row items-center justify-between py-3 mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="person-outline" size={22} color="white" />
                  <Text className="text-white text-base ml-4 font-medium">Personal info</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </Pressable>

              <View className="flex-row items-center justify-between py-3 mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="happy-outline" size={22} color="white" />
                  <Text className="text-white text-base ml-4 font-medium">Kids Mode</Text>
                </View>
                <Switch 
                  trackColor={{ false: "#333", true: "#83D616" }}
                  thumbColor="#FFF"
                  value={true} 
                />
              </View>

              <View className="h-[1px] bg-[#222] my-2" />
            </View>

            {/* Personal tool Section */}
            <View className="px-5 py-2">
              <Text className="text-[#888] text-xs font-semibold mb-4">Personal tool</Text>
              
              <Pressable onPress={() => navigateTo('/screens/menu/activity')} className="flex-row items-center justify-between py-3 mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={22} color="white" />
                  <Text className="text-white text-base ml-4 font-medium">Activity center</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </Pressable>

              <Pressable onPress={() => navigateTo('/screens/menu/qr')} className="flex-row items-center justify-between py-3 mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="qr-code-outline" size={22} color="white" />
                  <Text className="text-white text-base ml-4 font-medium">Your QR code</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </Pressable>

              <View className="h-[1px] bg-[#222] my-2" />
            </View>

            {/* Business & Tools Section */}
            <View className="px-5 py-2">
              <Text className="text-[#888] text-xs font-semibold mb-4">Business & Tools</Text>
              
              <Pressable className="flex-row items-center justify-between py-3 mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="logo-euro" size={22} color="white" />
                  <Text className="text-white text-base ml-4 font-medium">Coin System</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </Pressable>

              <Pressable onPress={() => navigateTo('/screens/menu/reward')} className="flex-row items-center justify-between py-3 mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="medal-outline" size={22} color="white" />
                  <Text className="text-white text-base ml-4 font-medium">Reward</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </Pressable>

              <Pressable onPress={() => navigateTo('/screens/subscription')} className="flex-row items-center justify-between py-3 mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="person-outline" size={22} color="white" />
                  <Text className="text-white text-base ml-4 font-medium">Subscription</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </Pressable>

              <Pressable className="flex-row items-center justify-between py-3 mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="person-outline" size={22} color="white" />
                  <Text className="text-white text-base ml-4 font-medium">Ads</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </Pressable>

              <View className="h-[1px] bg-[#222] my-2" />

              <Pressable className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center">
                  <Ionicons name="settings-outline" size={22} color="white" />
                  <Text className="text-white text-base ml-4 font-medium">Settings and Privacy</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </Pressable>

            </View>

          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
