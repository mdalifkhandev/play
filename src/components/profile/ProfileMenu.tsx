import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Pressable, Animated, Dimensions, Switch, ScrollView, InteractionManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store';

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
  const logoutAction = useAppStore((state) => state.logout);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isKidsMode = useAppStore((state) => state.isKidsModeActive);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    setLogoutModalVisible(false);
    onClose();

    setTimeout(() => {
      logoutAction();
      setIsLoggingOut(false);
      router.replace('/(auth)/login');
    });
  };

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

              <Pressable onPress={() => navigateTo('/screens/menu/diamond')} className="flex-row items-center justify-between py-3 mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="diamond-outline" size={22} color="white" />
                  <Text className="text-white text-base ml-4 font-medium">Diamond</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </Pressable>
              
              <View className="h-[1px] bg-[#222] my-2" />
            </View>

            {/* Account Information Section */}
            <View className="px-5 py-2">
              <Text className="text-[#888] text-xs font-semibold mb-4">Account Information</Text>
              
              <Pressable onPress={() => navigateTo('/screens/personal-info')} className="flex-row items-center justify-between py-3 mb-2">
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
                  value={isKidsMode} 
                  onValueChange={(val) => {
                    if (val) {
                      navigateTo('/screens/kids-mode/intro');
                    } else {
                      navigateTo('/screens/kids-mode/confirm-pin?action=exit');
                    }
                  }}
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
              
              <Pressable onPress={() => navigateTo('/screens/coins/wallet')} className="flex-row items-center justify-between py-3 mb-2">
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

              <Pressable onPress={() => navigateTo('/screens/ads')} className="flex-row items-center justify-between py-3 mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="megaphone-outline" size={22} color="white" />
                  <Text className="text-white text-base ml-4 font-medium">Ads</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </Pressable>

              <View className="h-[1px] bg-[#222] my-2" />

              <Pressable onPress={() => navigateTo('/screens/settings')} className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center">
                  <Ionicons name="settings-outline" size={22} color="white" />
                  <Text className="text-white text-base ml-4 font-medium">Settings and Privacy</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </Pressable>

              <View className="h-[1px] bg-[#222] my-2" />

              <Pressable onPress={() => setLogoutModalVisible(true)} className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center">
                  <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                  <Text className="text-[#EF4444] text-base ml-4 font-medium">Log out</Text>
                </View>
              </Pressable>

            </View>

          </ScrollView>
        </Animated.View>
      </View>

      {/* Logout Confirmation Bottom Sheet */}
      <Modal visible={logoutModalVisible} transparent animationType="fade" onRequestClose={() => setLogoutModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <Pressable className="flex-1" onPress={() => setLogoutModalVisible(false)} />
          <View className="bg-[#111] rounded-t-3xl p-6" style={{ paddingBottom: insets.bottom + 24 }}>
            <Text className="text-white text-xl font-bold text-center mb-2">Logout</Text>
            <Text className="text-[#888] text-center mb-8">Are you sure you want to log out?</Text>
            
            <View className="flex-row justify-between gap-4">
              <Pressable 
                onPress={() => setLogoutModalVisible(false)}
                className="flex-1 py-4 rounded-xl border border-[#333] items-center"
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </Pressable>
              
              <Pressable 
                onPress={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 py-4 rounded-xl bg-[#EF4444] items-center"
                style={{ opacity: isLoggingOut ? 0.7 : 1 }}
              >
                <Text className="text-white font-semibold">{isLoggingOut ? 'Logging out...' : 'Yes, Logout'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </Modal>
  );
}
