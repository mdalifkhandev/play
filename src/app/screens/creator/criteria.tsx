import React from 'react';
import { ActivityIndicator, View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';
import { getCreatorEligibility, type CreatorEligibility, type CreatorRequirement } from '../../../api/creators';

export default function CriteriaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [eligibility, setEligibility] = React.useState<CreatorEligibility | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    getCreatorEligibility()
      .then(data => {
        if (mounted) setEligibility(data);
      })
      .catch(error => console.log('Creator eligibility load failed:', error?.message ?? error))
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const radius = 80;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = eligibility?.progress ?? 0;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const buttonTitle =
    eligibility?.status === 'approved'
      ? 'CREATOR APPROVED'
      : eligibility?.status === 'pending'
        ? 'APPLICATION PENDING'
        : eligibility?.status === 'held'
          ? 'APPLICATION ON HOLD'
          : eligibility?.status === 'rejected'
            ? 'APPLY AGAIN'
            : 'APPLY NOW';
  const canPressApply = Boolean(eligibility?.canApply || eligibility?.status === 'rejected');
  const visibleRequirements = buildVisibleRequirements(eligibility?.requirements || []);

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="LIVE Become a Creator" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E4FB52" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 96 }}>
          <View className="items-center mt-6 mb-8 relative justify-center">
            <Svg width={radius * 2 + strokeWidth * 2} height={radius * 2 + strokeWidth * 2}>
              <Circle
                stroke="#222"
                fill="transparent"
                cx={radius + strokeWidth}
                cy={radius + strokeWidth}
                r={radius}
                strokeWidth={strokeWidth}
              />
              <Circle
                stroke="#E4FB52"
                fill="transparent"
                cx={radius + strokeWidth}
                cy={radius + strokeWidth}
                r={radius}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
              />
            </Svg>
            <View className="absolute items-center justify-center">
              <Text className="text-[#E4FB52] text-5xl font-bold">{progress}%</Text>
              <Text className="text-white text-xs tracking-widest mt-1">PROGRESS</Text>
            </View>
          </View>

          <Text className="text-[#CCC] text-center text-sm leading-5 mb-8 px-4">
            Complete all milestones below to unlock creator monetization features.
          </Text>

          {visibleRequirements.map(requirement => (
            <MilestoneRow key={requirement.key} requirement={requirement} />
          ))}

          {eligibility?.application?.adminReason ? (
            <Text className="text-[#FF7373] text-center text-xs leading-5 mb-4">
              {eligibility.application.adminReason}
            </Text>
          ) : null}

          <CustomButton
            title={buttonTitle}
            onPress={() => canPressApply && router.push('/screens/creator/apply')}
            containerStyle={canPressApply ? 'bg-[#E4FB52]' : 'bg-[#333]'}
            textStyle={canPressApply ? 'text-black' : 'text-[#888]'}
            disabled={!canPressApply}
          />
        </ScrollView>
      )}
    </View>
  );
}

function MilestoneRow({ requirement }: { requirement: CreatorRequirement }) {
  const isComplete = requirement.complete;
  const color = isComplete ? '#E4FB52' : '#888';
  const icon = iconForRequirement(requirement.key);

  return (
    <View className="bg-[#151515] rounded-2xl p-4 flex-row items-center mb-3 border border-[#222]">
      <View className="w-12 h-12 rounded-xl bg-[#1A1A1A] items-center justify-center mr-4 relative">
        <Ionicons name={icon} size={24} color={color} />
        {requirement.locked ? (
          <View className="absolute -top-1 -right-1 bg-[#151515] rounded-full p-0.5">
            <Ionicons name="lock-closed" size={10} color="#555" />
          </View>
        ) : null}
      </View>
      <View className="flex-1">
        <Text className={`${isComplete ? 'text-white' : 'text-[#888]'} text-base font-medium mb-1`}>
          {requirement.title}
        </Text>
        <Text className="text-[#888] text-xs">
          {formatNumber(requirement.current)} / {formatNumber(requirement.target)}
        </Text>
      </View>
      <Ionicons name={isComplete ? 'checkmark-circle' : 'ellipse-outline'} size={28} color={isComplete ? '#E4FB52' : '#555'} />
    </View>
  );
}

function iconForRequirement(key: CreatorRequirement['key']): keyof typeof Ionicons.glyphMap {
  if (key === 'followers') return 'person-outline';
  if (key === 'views') return 'play-outline';
  if (key === 'watch_time') return 'time-outline';
  if (key === 'likes') return 'heart-outline';
  if (key === 'account_age') return 'calendar-outline';
  if (key === 'guidelines') return 'shield-outline';
  if (key === 'reels') return 'albums-outline';
  return 'person-circle-outline';
}

function buildVisibleRequirements(requirements: CreatorRequirement[]) {
  const priority: CreatorRequirement['key'][] = ['followers', 'views', 'account_age', 'guidelines'];
  return priority.map(key => {
    const found = requirements.find(item => item.key === key);
    if (found) return found;

    return {
      key,
      title: fallbackTitleForRequirement(key),
      current: 0,
      target: fallbackTargetForRequirement(key),
      complete: false,
    };
  });
}

function fallbackTitleForRequirement(key: CreatorRequirement['key']) {
  if (key === 'followers') return 'Followers';
  if (key === 'views') return 'Video Views';
  if (key === 'account_age') return 'Account Age';
  if (key === 'guidelines') return 'Community Guidelines';
  return 'Milestone';
}

function fallbackTargetForRequirement(key: CreatorRequirement['key']) {
  if (key === 'followers') return 1000;
  if (key === 'views') return 100000;
  if (key === 'account_age') return 30;
  if (key === 'guidelines') return 1;
  return 1;
}

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return String(value);
}
