import React from 'react';
import { ActivityIndicator, RefreshControl, View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../../components/ui/Header';
import { getCreatorEligibility, type CreatorEligibility } from '../../../api/creators';

export default function PendingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [eligibility, setEligibility] = React.useState<CreatorEligibility | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const isMountedRef = React.useRef(true);

  const loadStatus = React.useCallback(async ({ refresh = false }: { refresh?: boolean } = {}) => {
    if (!isMountedRef.current) return;

    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await getCreatorEligibility();
      if (!isMountedRef.current) return;

      setEligibility(data);

      if (data.status === 'approved') {
        router.replace('/screens/creator/success');
        return;
      }

      if (data.status === 'rejected') {
        router.replace('/screens/creator/criteria');
      }
    } catch (error: any) {
      console.log('Creator application status refresh failed:', error?.message ?? error);
    } finally {
      if (!isMountedRef.current) return;

      if (refresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [router]);

  React.useEffect(() => {
    isMountedRef.current = true;
    void loadStatus();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadStatus]);

  const applicationDate = eligibility?.application?.createdAt
    ? new Date(eligibility.application.createdAt).toLocaleDateString()
    : '-';
  const isHeld = eligibility?.status === 'held';

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Application Status" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center', flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadStatus({ refresh: true })}
            tintColor="#E4FB52"
            colors={['#E4FB52']}
            progressBackgroundColor="#151515"
          />
        }
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-24">
            <ActivityIndicator color="#E4FB52" />
            <Text className="mt-3 text-[#888] text-sm">Checking application status...</Text>
          </View>
        ) : (
        <>
        
        {/* Hourglass Icon */}
        <View className="mt-12 mb-8 items-center justify-center">
          {/* Concentric circles */}
          <View className="w-48 h-48 rounded-full border border-[#222] items-center justify-center">
            <View className="w-36 h-36 rounded-full border border-[#333] items-center justify-center">
              <View className="w-24 h-24 rounded-full bg-[#111] items-center justify-center">
                <Ionicons name="hourglass-outline" size={40} color="#E4FB52" />
              </View>
            </View>
          </View>
        </View>

        <Text className="text-white text-2xl font-bold mb-3 text-center">
          {isHeld ? 'Application On Hold' : 'Application Under Review'}
        </Text>
        <Text className="text-[#888] text-center text-sm leading-5 mb-12 px-4">
          {isHeld
            ? eligibility?.application?.adminReason || 'Admin team paused this application for additional review.'
            : 'Our team is currently evaluating your creative profile and portfolio assets.'}
        </Text>

        {/* Stepper */}
        <View className="bg-[#151515] rounded-2xl p-6 w-full border border-[#222]">
          
          {/* Step 1 */}
          <View className="flex-row mb-6">
            <View className="items-center mr-4">
              <View className="w-8 h-8 rounded-full bg-[#E4FB52] items-center justify-center">
                <Ionicons name="checkmark" size={20} color="black" />
              </View>
              <View className="w-0.5 h-10 bg-[#E4FB52] mt-2" />
            </View>
            <View className="flex-1 pt-1">
              <Text className="text-[#E4FB52] text-base font-semibold mb-1">Step 1: Submitted</Text>
              <Text className="text-[#888] text-xs">Completed on {applicationDate}</Text>
            </View>
          </View>

          {/* Step 2 */}
          <View className="flex-row mb-6">
            <View className="items-center mr-4">
              <View className="w-8 h-8 rounded-full border-2 border-[#E4FB52] items-center justify-center">
                <View className="w-3 h-3 rounded-full bg-[#E4FB52]" />
              </View>
              <View className="w-0.5 h-10 bg-[#333] mt-2" />
            </View>
            <View className="flex-1 pt-1">
              <Text className="text-white text-base font-semibold mb-1">Step 2: Under Review</Text>
              <Text className="text-[#888] text-xs">Average review time: 3-5 business days</Text>
            </View>
          </View>

          {/* Step 3 */}
          <View className="flex-row">
            <View className="items-center mr-4">
              <View className="w-8 h-8 rounded-full border-2 border-[#333] items-center justify-center bg-[#1A1A1A]">
                <Ionicons name="flag-outline" size={16} color="#555" />
              </View>
            </View>
            <View className="flex-1 pt-1">
              <Text className="text-[#555] text-base font-semibold mb-1">Step 3: Decision</Text>
              <Text className="text-[#555] text-xs leading-5">You'll be notified via the portal and email</Text>
            </View>
          </View>
        </View>
        </>
        )}

      </ScrollView>
    </View>
  );
}
