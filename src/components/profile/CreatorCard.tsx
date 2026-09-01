import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { getCreatorEligibility, type CreatorEligibility, type CreatorRequirement } from '../../api/creators';

const CREATOR_CARD_HIDDEN_KEY = 'profile:creator-card-hidden';

export function CreatorCard({ eligibility: eligibilityProp }: { eligibility?: CreatorEligibility | null }) {
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

    if (eligibilityProp === undefined) {
      getCreatorEligibility()
        .then(data => {
          if (mounted) setEligibility(data);
        })
        .catch(error => console.log('Creator eligibility load failed:', error?.message ?? error));
    }

    return () => {
      mounted = false;
    };
  }, [eligibilityProp]);

  const hideCard = React.useCallback(async () => {
    setIsHidden(true);
    await AsyncStorage.setItem(CREATOR_CARD_HIDDEN_KEY, 'true');
  }, []);

  const showCard = React.useCallback(async () => {
    setIsHidden(false);
    await AsyncStorage.removeItem(CREATOR_CARD_HIDDEN_KEY);
  }, []);

  const effectiveEligibility = eligibilityProp ?? eligibility;
  const visibleMilestones = (effectiveEligibility?.requirements || []).filter(item => item.enabled !== false);
  const completedSteps = visibleMilestones.length
    ? visibleMilestones.filter(item => item.complete).length
    : effectiveEligibility?.completedSteps ?? 0;
  const totalSteps = visibleMilestones.length || effectiveEligibility?.totalSteps || 0;
  const progress = progressForRequirements(visibleMilestones, effectiveEligibility?.progress ?? 0);
  const title =
    effectiveEligibility?.status === 'approved'
      ? "You're a creator"
      : effectiveEligibility?.status === 'pending'
        ? 'Creator application pending'
        : effectiveEligibility?.status === 'held'
          ? 'Creator application on hold'
        : effectiveEligibility?.status === 'rejected'
          ? 'Creator application needs review'
          : "You're on your creator path";
  const openCreatorFlow = () => {
    if (effectiveEligibility?.status === 'pending' || effectiveEligibility?.status === 'held') {
      router.push('/screens/creator/pending');
      return;
    }

    if (effectiveEligibility?.status === 'approved') {
      router.push('/screens/creator/success');
      return;
    }

    router.push('/screens/creator/criteria');
  };

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
    <Pressable onPress={openCreatorFlow} className="mt-8 mx-4 bg-[#141414] p-4 rounded-2xl border border-[#222] border-l-4 overflow-hidden">
      <Pressable
        onPress={hideCard}
        hitSlop={10}
        className="absolute right-3 top-3 z-10 h-8 w-8 items-center justify-center rounded-full bg-black/60"
      >
        <Ionicons name="close" size={18} color="#FFF" />
      </Pressable>

      <View className="flex-row items-start pr-9">
        <View className="flex-1">
          <Text className="text-white text-[16px] font-inter-semibold leading-[22px]">
            {title}
          </Text>
        </View>
        <ProgressCircle progress={progress} />
      </View>
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

function ProgressCircle({ progress }: { progress: number }) {
  const size = 46;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View className="ml-3 items-center justify-center">
      <Svg width={size} height={size}>
        <Circle
          stroke="#333"
          fill="transparent"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke="#A3E635"
          fill="transparent"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-[#A3E635] text-[10px] font-inter-bold">{progress}%</Text>
      </View>
    </View>
  );
}

function progressForRequirement(requirement: CreatorRequirement) {
  if (requirement.complete) return 100;
  if (requirement.key === 'guidelines') {
    return requirement.locked ? 0 : 100;
  }
  if (requirement.target <= 0) return requirement.current > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round((requirement.current / requirement.target) * 100)));
}

function progressForRequirements(requirements: CreatorRequirement[], fallbackProgress: number) {
  if (!requirements.length) return fallbackProgress;
  const totalProgress = requirements.reduce((total, requirement) => total + progressForRequirement(requirement), 0);
  return Math.round(totalProgress / requirements.length);
}
