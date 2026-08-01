import React, { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface FloatingReactionsHandle {
  addReaction: () => void;
}

type Reaction = {
  id: number;
  xOffset: number;
  size: number;
};

const { height } = Dimensions.get('window');

const AnimatedHeart = ({ onComplete, xOffset, size }: { onComplete: () => void, xOffset: number, size: number }) => {
  const positionY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(positionY, {
        toValue: -height * 0.5, // float up 50% of screen
        duration: 2500,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2500,
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
        bottom: 80, // Start above the bottom actions
        right: 20 + xOffset, // Align with the heart button on the right
        opacity,
        transform: [
          { translateY: positionY },
          { scale }
        ],
      }}
    >
      <Ionicons name="heart" size={size} color="#FF3B30" />
    </Animated.View>
  );
};

export const FloatingReactions = forwardRef<FloatingReactionsHandle>((props, ref) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  useImperativeHandle(ref, () => ({
    addReaction: () => {
      const newReaction = {
        id: Date.now() + Math.random(),
        xOffset: Math.random() * 40 - 20, // random left/right offset between -20 and 20
        size: Math.random() * 15 + 20, // random size between 20 and 35
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
          onComplete={() => removeReaction(reaction.id)}
        />
      ))}
    </View>
  );
});
