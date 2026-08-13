import React from 'react';
import { ScrollView, View, Animated } from 'react-native';
import { MessageBubble, MessageType } from './MessageBubble';

interface MessageListProps {
  messages: MessageType[];
  isTyping?: boolean;
}

export function MessageList({ messages, isTyping }: MessageListProps) {
  const scrollRef = React.useRef<ScrollView>(null);
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
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: messages.length > 1 });
    }, 50);

    return () => clearTimeout(timer);
  }, [messages.length, isTyping]);

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1 px-4 pt-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
      onContentSizeChange={() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }}
    >
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
