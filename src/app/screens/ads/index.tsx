import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';

export default function AdsManagementFormScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [boost, setBoost] = useState(100);
  const [adsView, setAdsView] = useState('feed');
  const [usersOption, setUsersOption] = useState('same_interest');
  const [areaOption, setAreaOption] = useState('city');

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

  return (
    <View className="flex-1 bg-[#050505]" style={{ paddingTop: insets.top }}>
      <Header title="Ads Management" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Category */}
        <Text className="text-white text-sm font-medium mb-2 mt-4">Category</Text>
        <Pressable className="flex-row items-center justify-between bg-[#111] border border-[#222] rounded-xl p-4 mb-6">
          <Text className="text-white text-base">Food</Text>
          <Ionicons name="chevron-down" size={20} color="#888" />
        </Pressable>

        {/* No. of days */}
        <Text className="text-white text-sm font-medium mb-2">No. of days</Text>
        <Text className="text-[#666] text-xs mb-3">
          The frequency of ad displayed to users is dependable on the days and amount package
        </Text>
        <Pressable className="flex-row items-center justify-between bg-[#111] border border-[#222] rounded-xl p-4 mb-3">
          <Text className="text-white text-base">7 (week)</Text>
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
        
        <View className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-[#222]">
          <Image source={{ uri: 'https://media.wired.com/photos/59269cd37034dc5f91bec0f1/191:100/w_1280,c_limit/GoogleMapTA.jpg' }} className="w-full h-full" resizeMode="cover" />
        </View>

        <RadioOption selected={areaOption === 'city'} title="City centric" onPress={() => setAreaOption('city')} rightIcon />
        <RadioOption selected={areaOption === 'country'} title="Throughout country" onPress={() => setAreaOption('country')} />
        <RadioOption selected={areaOption === 'world'} title="World Wide" onPress={() => setAreaOption('world')} />

      </ScrollView>

      <View className="absolute bottom-6 left-5 right-5">
        <CustomButton 
          title="Next"
          onPress={() => router.push('/screens/ads/upload')}
          containerStyle="bg-[#A3E635] w-full py-4 rounded-xl"
          textStyle="text-black font-bold text-base"
        />
      </View>
    </View>
  );
}
