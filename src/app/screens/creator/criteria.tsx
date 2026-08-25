import React from 'react';
import { ActivityIndicator, View, Text, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';
import { getCreatorEligibility, type CreatorEligibility, type CreatorRequirement } from '../../../api/creators';
import { FeatureGuard } from '../../../components/settings/FeatureGuard';

export default function CriteriaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [eligibility, setEligibility] = React.useState<CreatorEligibility | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const isMountedRef = React.useRef(true);

  const loadEligibility = React.useCallback(async ({ refresh = false }: { refresh?: boolean } = {}) => {
    if (!isMountedRef.current) return;

    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await getCreatorEligibility();
      if (isMountedRef.current) setEligibility(data);
    } catch (error: any) {
      console.log('Creator eligibility load failed:', error?.message ?? error);
    } finally {
      if (!isMountedRef.current) return;

      if (refresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  React.useEffect(() => {
    isMountedRef.current = true;
    const timer = setTimeout(() => {
      loadEligibility();
    }, 0);

    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
    };
  }, [loadEligibility]);

  const radius = 80;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const visibleRequirements = buildVisibleRequirements(eligibility?.requirements || []);
  const progress = progressForRequirements(visibleRequirements, eligibility?.progress ?? 0);
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

  return (
    <FeatureGuard feature="creatorApplications" title="Creator applications are unavailable">
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="LIVE Become a Creator" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E4FB52" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 96 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadEligibility({ refresh: true })}
              tintColor="#E4FB52"
              colors={['#E4FB52']}
              progressBackgroundColor="#151515"
            />
          }
        >
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
    </FeatureGuard>
  );
}

function MilestoneRow({ requirement }: { requirement: CreatorRequirement }) {
  const isComplete = requirement.complete;
  const color = isComplete ? '#E4FB52' : '#888';
  const icon = iconForRequirement(requirement.key);
  const progress = progressForRequirement(requirement);

  return (
    <View className="bg-[#151515] rounded-2xl p-4 mb-3 border border-[#222]">
      <View className="flex-row items-center">
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

      <View className="mt-4 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: isComplete ? '#E4FB52' : '#5F6F42',
          }}
        />
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

function iconForRequirement(key: CreatorRequirement['key']): keyof typeof Ionicons.glyphMap {
  if (key === 'profile') return 'person-circle-outline';
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
  const priority: CreatorRequirement['key'][] = ['profile', 'followers', 'views', 'account_age', 'guidelines'];
  if (requirements.length === 0) {
    return priority.map(key => ({
      key,
      title: fallbackTitleForRequirement(key),
      current: 0,
      target: fallbackTargetForRequirement(key),
      complete: false,
    }));
  }

  const visible = requirements.filter(item => item.enabled !== false);
  const ordered = priority
    .map(key => visible.find(item => item.key === key))
    .filter(Boolean) as CreatorRequirement[];
  const extras = visible.filter(item => !priority.includes(item.key));

  return [...ordered, ...extras];
}

function fallbackTitleForRequirement(key: CreatorRequirement['key']) {
  if (key === 'profile') return 'Profile Complete';
  if (key === 'followers') return 'Followers';
  if (key === 'views') return 'Video Views';
  if (key === 'account_age') return 'Account Age';
  if (key === 'guidelines') return 'Community Guidelines';
  return 'Milestone';
}

function fallbackTargetForRequirement(key: CreatorRequirement['key']) {
  if (key === 'profile') return 1;
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
