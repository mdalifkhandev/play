import React from 'react';
import { View, Text, Animated } from 'react-native';

interface TextOverlayProps {
  overlayText: string;
  isTextMode: boolean;
  activePanel: string | null;
  textPanResponder: any;
  textPan: Animated.ValueXY;
}

export function TextOverlay({
  overlayText,
  isTextMode,
  activePanel,
  textPanResponder,
  textPan
}: TextOverlayProps) {
  if (overlayText.trim().length === 0) return null;

  return (
    <Animated.View
      {...(!isTextMode && !activePanel ? textPanResponder.panHandlers : {})}
      className="absolute left-6 right-6 top-1/2 z-10 items-center"
      style={{ transform: [{ translateX: textPan.x }, { translateY: textPan.y }] }}
    >
      <Text
        className="text-white font-inter-bold text-3xl text-center px-4"
        style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 }}
      >
        {overlayText}
      </Text>
    </Animated.View>
  );
}
