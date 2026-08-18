import React, { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { avatarSource } from '../../utils/avatar';

export interface FloatingReactionsHandle {
  addReaction: (avatarUrl?: string) => void;
}

type Reaction = {
  id: number;
  xOffset: number;
  size: number;
  avatarUrl?: string;
};

const { height } = Dimensions.get('window');

const AnimatedHeart = ({ onComplete, xOffset, size, avatarUrl }: { onComplete: () => void, xOffset: number, size: number, avatarUrl?: string }) => {
  const positionY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(positionY, {
        toValue: -300 - Math.random() * 100,
        duration: 2000 + Math.random() * 1000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2000 + Math.random() * 1000,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 80,
        right: 20 + xOffset,
        opacity,
        transform: [
          { translateY: positionY },
          { scale }
        ],
      }}
    >
      {avatarUrl ? (
        <View style={{ width: size * 1.5, height: size * 1.5, position: 'relative' }}>
          <Image
            source={avatarSource(avatarUrl)}
            style={{ width: size * 1.5, height: size * 1.5, borderRadius: size * 0.75, borderWidth: 1.5, borderColor: '#FF3B30' }}
          />
          <View style={{ position: 'absolute', bottom: -5, right: -5, backgroundColor: '#FFF', borderRadius: 10, padding: 2 }}>
            <Ionicons name="heart" size={size * 0.5} color="#FF3B30" />
          </View>
        </View>
      ) : (
        <Ionicons name="heart" size={size} color="#FF3B30" />
      )}
    </Animated.View>
  );
};

export const FloatingReactions = forwardRef<FloatingReactionsHandle>((props, ref) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  useImperativeHandle(ref, () => ({
    addReaction: (avatarUrl?: string) => {
      const newReaction: Reaction = {
        id: Date.now() + Math.random(),
        xOffset: Math.random() * 40 - 20, // random left/right offset between -20 and 20
        size: Math.random() * 15 + 20, // random size between 20 and 35
        avatarUrl,
      };
      setReactions((prev) => [...prev, newReaction]);
    }
  }));

  const removeReaction = (id: number) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]} pointerEvents="none">
      {reactions.map((reaction) => (
        <AnimatedHeart
          key={reaction.id}
          xOffset={reaction.xOffset}
          size={reaction.size}
          avatarUrl={reaction.avatarUrl}
          onComplete={() => removeReaction(reaction.id)}
        />
      ))}
    </View>
  );
});
