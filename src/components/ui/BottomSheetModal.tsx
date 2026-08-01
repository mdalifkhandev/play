import React, { useEffect, useRef } from 'react';
import { View, Modal, Pressable, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheetModal({ visible, onClose, children }: BottomSheetModalProps) {
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // Render modal content only when visible, or during exit animation
  const [isRendered, setIsRendered] = React.useState(visible);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
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
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: Dimensions.get('window').height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsRendered(false);
      });
    }
  }, [visible]);

  if (!isRendered) return null;

  return (
    <Modal visible={isRendered} transparent={true} animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Animated.View className="absolute inset-0 bg-black/50" style={{ opacity: fadeAnim }}>
          <Pressable className="absolute inset-0" onPress={onClose} />
        </Animated.View>
        <Animated.View
          className="w-full shadow-lg elevation-5"
          style={{ transform: [{ translateY: slideAnim }] }}
        >
          <View 
            className="bg-[#1C1C1E] rounded-t-3xl pt-3 px-4 border-t border-[#333] relative"
            style={{ paddingBottom: Math.max(insets.bottom + 16, 32) }}
          >
            {/* Drag Handle */}
            <View className="w-12 h-1.5 bg-[#444] rounded-full self-center mb-6" />

            {/* Close Button Top Right */}
            <Pressable 
              onPress={onClose} 
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-[#333] rounded-full items-center justify-center"
            >
              <Ionicons name="close" size={18} color="#FFF" />
            </Pressable>
            
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
