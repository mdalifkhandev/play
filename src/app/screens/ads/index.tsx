import React, { useState } from 'react';
import { ActivityIndicator, Modal, Text, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { toast } from 'sonner-native';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';
import { FeatureGuard } from '../../../components/settings/FeatureGuard';

const CATEGORIES = ['Food', 'Fashion', 'Music', 'Sports', 'Education', 'Travel', 'Technology', 'Health', 'Beauty', 'Business'];
const DAY_OPTIONS = [
  { label: '3 days', value: 3 },
  { label: '7 days (week)', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days (month)', value: 30 },
];

export default function AdsManagementFormScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [category, setCategory] = useState('Food');
  const [days, setDays] = useState(7);
  const [boost, setBoost] = useState(100);
  const [adsView, setAdsView] = useState('feed');
  const [usersOption, setUsersOption] = useState('same_interest');
  const [areaOption, setAreaOption] = useState('city');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [picker, setPicker] = useState<'category' | 'days' | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const selectedTargetUsers = boost >= 500 ? 10000 : boost >= 200 ? 500 : 100;
  const selectedDayLabel = DAY_OPTIONS.find(option => option.value === days)?.label || `${days} days`;

  const useCurrentLocation = async () => {
    if (isLocating) return;

    setIsLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        toast.error('Location permission is required for city centric ads');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const places = await Location.reverseGeocodeAsync(position.coords);
      const place = places[0];

      setCity(place?.city || place?.subregion || place?.district || '');
      setCountry(place?.country || '');
      setAreaOption('city');
      toast.success('Location selected');
    } catch (error) {
      toast.error('Failed to detect your location');
    } finally {
      setIsLocating(false);
    }
  };

  const RadioOption = ({ 
    selected, 
    title, 
    subtitle, 
    onPress, 
    rightIcon = false 
  }: { 
    selected: boolean, 
    title: string, 
    subtitle?: string, 
    onPress: () => void,
    rightIcon?: boolean
  }) => (
    <Pressable onPress={onPress} className="flex-row items-center bg-[#111] border border-[#222] rounded-xl p-4 mb-3">
      <View className="w-5 h-5 rounded-full border border-white items-center justify-center mr-4">
        {selected && <View className="w-2.5 h-2.5 rounded-full bg-[#A3E635]" />}
      </View>
      <View className="flex-1">
        <Text className="text-white text-base font-medium">{title}</Text>
        {subtitle && <Text className="text-[#888] text-xs mt-1">{subtitle}</Text>}
      </View>
      {rightIcon && <Ionicons name="chevron-down" size={20} color="#888" />}
    </Pressable>
  );

  const PickerModal = () => {
    const isCategoryPicker = picker === 'category';
    const title = isCategoryPicker ? 'Select category' : 'Select days';
    const options = isCategoryPicker ? CATEGORIES : DAY_OPTIONS;

    return (
      <Modal visible={picker !== null} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <Pressable className="flex-1 justify-end bg-black/60" onPress={() => setPicker(null)}>
          <Pressable
            className="rounded-t-3xl bg-[#151515] px-5 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom + 14, 28) }}
            onPress={(event) => event.stopPropagation()}
          >
            <View className="mb-4 h-1 w-12 self-center rounded-full bg-white/25" />
            <Text className="mb-4 text-lg font-inter-bold text-white">{title}</Text>
            {(options as Array<string | { label: string; value: number }>).map(option => {
              const label = typeof option === 'string' ? option : option.label;
              const value = typeof option === 'string' ? option : option.value;
              const selected = isCategoryPicker ? value === category : value === days;

              return (
                <Pressable
                  key={String(value)}
                  className="mb-3 flex-row items-center rounded-2xl bg-white/10 px-4 py-4"
                  onPress={() => {
                    if (isCategoryPicker) {
                      setCategory(String(value));
                    } else {
                      setDays(Number(value));
                    }
                    setPicker(null);
                  }}
                >
                  <View className={`mr-3 h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-[#A3E635]' : 'border-white/50'}`}>
                    {selected && <View className="h-2.5 w-2.5 rounded-full bg-[#A3E635]" />}
                  </View>
                  <Text className="flex-1 text-base font-inter-semibold text-white">{label}</Text>
                  {selected && <Ionicons name="checkmark" size={20} color="#A3E635" />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  return (
    <FeatureGuard feature="ads" title="Ads are unavailable">
    <View className="flex-1 bg-[#050505]" style={{ paddingTop: insets.top }}>
      <Header title="Ads Management" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Category */}
        <Text className="text-white text-sm font-medium mb-2 mt-4">Category</Text>
        <Pressable
          className="flex-row items-center justify-between bg-[#111] border border-[#222] rounded-xl p-4 mb-6"
          onPress={() => setPicker('category')}
        >
          <Text className="text-white text-base">{category}</Text>
          <Ionicons name="chevron-down" size={20} color="#888" />
        </Pressable>

        {/* No. of days */}
        <Text className="text-white text-sm font-medium mb-2">No. of days</Text>
        <Text className="text-[#666] text-xs mb-3">
          The frequency of ad displayed to users is dependable on the days and amount package
        </Text>
        <Pressable
          className="flex-row items-center justify-between bg-[#111] border border-[#222] rounded-xl p-4 mb-3"
          onPress={() => setPicker('days')}
        >
          <Text className="text-white text-base">{selectedDayLabel}</Text>
          <Ionicons name="chevron-down" size={20} color="#888" />
        </Pressable>
        <View className="bg-[#111] border border-[#222] rounded-xl p-3 mb-6">
          <Text className="text-[#666] text-[11px] leading-4">
            i.e. if you are paying $100 for an ad to appear to users in a week, the ad would appear in higher ratio than paying for a month
          </Text>
        </View>

        {/* Ads Boost */}
        <Text className="text-white text-sm font-medium mb-3">Ads Boost</Text>
        <RadioOption selected={boost === 100} title="$100" subtitle="Boosting ads to 100 users" onPress={() => setBoost(100)} />
        <RadioOption selected={boost === 200} title="$200" subtitle="Boosting ads to 500 users" onPress={() => setBoost(200)} />
        <RadioOption selected={boost === 500} title="$500" subtitle="Boosting ads to 10000 users" onPress={() => setBoost(500)} />
        <View className="mb-3" />

        {/* Ads View */}
        <Text className="text-white text-sm font-medium mb-3">Ads View</Text>
        <RadioOption selected={adsView === 'feed'} title="Feed" subtitle="Ads would only show in the feed" onPress={() => setAdsView('feed')} />
        <View className="mb-3" />

        {/* Set demographics */}
        <Text className="text-white text-sm font-medium mb-3">Set demographics</Text>
        <Text className="text-white text-sm font-medium mb-3">Users</Text>
        
        <RadioOption selected={usersOption === 'same_interest'} title="Same Interest" subtitle="Showing ads to users with same interests as you" onPress={() => setUsersOption('same_interest')} />
        <RadioOption selected={usersOption === 'interest_in_topic'} title="Interest in Topic" subtitle="Showing ads to only users who are interested in topic" onPress={() => setUsersOption('interest_in_topic')} />
        <RadioOption selected={usersOption === 'all_users'} title="All users" subtitle="Showing ads to all the users" onPress={() => setUsersOption('all_users')} />
        <View className="mb-3" />

        <Text className="text-white text-sm font-medium mb-3">Area</Text>
        
        <View className="w-full h-36 rounded-xl overflow-hidden mb-3 bg-[#111] border border-[#222]">
          <View className="absolute inset-0 opacity-70">
            <View className="absolute left-0 right-0 top-1/3 h-[1px] bg-[#333]" />
            <View className="absolute left-0 right-0 top-2/3 h-[1px] bg-[#333]" />
            <View className="absolute bottom-0 top-0 left-1/3 w-[1px] bg-[#333]" />
            <View className="absolute bottom-0 top-0 left-2/3 w-[1px] bg-[#333]" />
          </View>
          <View className="flex-1 items-center justify-center px-5">
            <View className="mb-2 h-11 w-11 items-center justify-center rounded-full bg-[#A3E635]">
              <Ionicons name="location" size={22} color="#000" />
            </View>
            <Text className="text-center text-white font-inter-bold">
              {city || country ? [city, country].filter(Boolean).join(', ') : 'Choose ad location'}
            </Text>
            <Text className="mt-1 text-center text-xs text-[#888]">
              Use current location for city centric ads.
            </Text>
          </View>
        </View>

        <Pressable
          className="flex-row items-center bg-[#111] border border-[#222] rounded-xl p-4 mb-3"
          onPress={useCurrentLocation}
          disabled={isLocating}
        >
          <View className="w-5 h-5 rounded-full border border-white items-center justify-center mr-4">
            {areaOption === 'city' && <View className="w-2.5 h-2.5 rounded-full bg-[#A3E635]" />}
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-medium">City centric</Text>
            <Text className="text-[#888] text-xs mt-1">
              {city || country ? [city, country].filter(Boolean).join(', ') : 'Tap to detect city'}
            </Text>
          </View>
          {isLocating ? <ActivityIndicator color="#A3E635" /> : <Ionicons name="locate-outline" size={20} color="#888" />}
        </Pressable>
        <RadioOption selected={areaOption === 'country'} title="Throughout country" onPress={() => setAreaOption('country')} />
        <RadioOption selected={areaOption === 'world'} title="World Wide" onPress={() => setAreaOption('world')} />

      </ScrollView>

      <View className="absolute bottom-6 left-5 right-5">
        <CustomButton 
          title="Next"
          onPress={() => router.push({
            pathname: '/screens/ads/upload',
            params: {
              category,
              days: String(days),
              budgetUsd: String(boost),
              targetUsers: String(selectedTargetUsers),
              placement: adsView,
              audienceType: usersOption,
              areaType: areaOption,
              city,
              country,
            },
          })}
          containerStyle="bg-[#A3E635] w-full py-4 rounded-xl"
          textStyle="text-black font-bold text-base"
        />
      </View>
      <PickerModal />
    </View>
    </FeatureGuard>
  );
}
