import React from 'react';
import { ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, ScrollView, View, Animated } from 'react-native';
import { MessageBubble, MessageType } from './MessageBubble';

const LOAD_OLDER_THRESHOLD = 360;

interface MessageListProps {
  messages: MessageType[];
  isTyping?: boolean;
  hasMore?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
}

export function MessageList({
  messages,
  isTyping,
  hasMore,
  isLoadingOlder,
  onLoadOlder,
}: MessageListProps) {
  const scrollRef = React.useRef<ScrollView>(null);
  const idsRef = React.useRef<{ first?: string; last?: string; didMount: boolean }>({ didMount: false });
  const loadOlderLockRef = React.useRef(false);
  const animValues = React.useMemo(() => [
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ], []);

  React.useEffect(() => {
    if (isTyping) {
      animValues.forEach((anim, i) => {
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(anim, { duration: 400, useNativeDriver: true, toValue: 1 }),
          Animated.timing(anim, { duration: 400, useNativeDriver: true, toValue: 0 }),
        ]).start();
      });
    }
  }, [animValues, isTyping]);

  React.useEffect(() => {
    const first = messages[0]?.id;
    const last = messages[messages.length - 1]?.id;
    const previous = idsRef.current;
    const shouldScrollToEnd =
      !previous.didMount ||
      previous.last !== last ||
      isTyping;

    idsRef.current = { first, last, didMount: true };

    if (!shouldScrollToEnd) return;

    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: previous.didMount });
    }, 50);
    return () => clearTimeout(timer);
  }, [isTyping, messages]);

  React.useEffect(() => {
    if (!isLoadingOlder) {
      loadOlderLockRef.current = false;
    }
  }, [isLoadingOlder]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!hasMore || isLoadingOlder || loadOlderLockRef.current) return;

    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY <= LOAD_OLDER_THRESHOLD) {
      loadOlderLockRef.current = true;
      onLoadOlder?.();
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1 px-4 pt-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20, paddingTop: hasMore ? 8 : 0 }}
      maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      scrollEventThrottle={16}
      onScroll={handleScroll}
    >
      {isLoadingOlder && (
        <View className="items-center py-3">
          <ActivityIndicator size="small" color="#A3E635" />
        </View>
      )}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} />
      ))}
      {isTyping && (
        <View className="flex-row items-center py-2">
          <View className="flex-row items-center bg-[#1a1a1a] rounded-2xl px-4 py-3">
            <Animated.View className="w-2 h-2 rounded-full mx-0.5 bg-white/70" style={{ opacity: animValues[0] }} />
            <Animated.View className="w-2 h-2 rounded-full mx-0.5 bg-white/70" style={{ opacity: animValues[1] }} />
            <Animated.View className="w-2 h-2 rounded-full mx-0.5 bg-white/70" style={{ opacity: animValues[2] }} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}
