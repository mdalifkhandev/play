import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getCreatorEligibility, type CreatorEligibility } from '../../api/creators';

const CREATOR_CARD_HIDDEN_KEY = 'profile:creator-card-hidden';

export function CreatorCard() {
  const router = useRouter();
  const [eligibility, setEligibility] = React.useState<CreatorEligibility | null>(null);
  const [isHidden, setIsHidden] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(CREATOR_CARD_HIDDEN_KEY)
      .then(value => {
        if (mounted) setIsHidden(value === 'true');
      })
      .catch(() => undefined);

    getCreatorEligibility()
      .then(data => {
        if (mounted) setEligibility(data);
      })
      .catch(error => console.log('Creator eligibility load failed:', error?.message ?? error));

    return () => {
      mounted = false;
    };
  }, []);

  const hideCard = React.useCallback(async () => {
    setIsHidden(true);
    await AsyncStorage.setItem(CREATOR_CARD_HIDDEN_KEY, 'true');
  }, []);

  const showCard = React.useCallback(async () => {
    setIsHidden(false);
    await AsyncStorage.removeItem(CREATOR_CARD_HIDDEN_KEY);
  }, []);

  const progress = eligibility?.progress ?? 0;
  const completedSteps = eligibility?.completedSteps ?? 0;
  const totalSteps = eligibility?.totalSteps ?? 0;
  const title =
    eligibility?.status === 'approved'
      ? "You're a creator"
      : eligibility?.status === 'pending'
        ? 'Creator application pending'
        : eligibility?.status === 'rejected'
          ? 'Creator application needs review'
          : "You're on your creator path";

  if (isHidden) {
    return (
      <Pressable
        onPress={showCard}
        className="mt-8 mx-4 rounded-xl border border-[#222] bg-[#111] px-4 py-3 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1">
          <Ionicons name="eye-outline" size={18} color="#A3E635" />
          <Text className="ml-2 text-white text-[13px] font-inter-semibold" numberOfLines={1}>
            Show creator path again
          </Text>
        </View>
        <Text className="text-[#A3E635] text-[11px] font-inter-bold">Undo</Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={() => router.push('/screens/creator/criteria')} className="mt-8 mx-4 bg-[#141414] p-4 rounded-2xl border border-[#222] border-l-4 overflow-hidden">
      <Pressable
        onPress={hideCard}
        hitSlop={10}
        className="absolute right-3 top-3 z-10 h-8 w-8 items-center justify-center rounded-full bg-black/60"
      >
        <Ionicons name="close" size={18} color="#FFF" />
      </Pressable>

      <Text className="text-white text-[16px] font-inter-semibold w-[75%] leading-[22px]">
        {title}
      </Text>
      {/* <Text className="mt-2 text-[#999] text-[12px] leading-[18px] w-[86%]">
        Complete these steps to unlock creator monetization and earning tools.
      </Text> */}
   
      <View className="mt-5 flex-row items-center">
        <View className="flex-1 h-1 bg-[#333] rounded-full overflow-hidden">
          <View className="h-full bg-[#A3E635]" style={{ width: `${progress}%` }} />
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <Text className="text-[#A3E635] text-[11px] font-bold">{progress}% Complete</Text>
        <Text className="text-[#888] text-[11px]">Step {completedSteps} of {totalSteps}</Text>
      </View>
    </Pressable>
  );
}
