import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { toast } from 'sonner-native';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';
import { FeatureGuard } from '../../../components/settings/FeatureGuard';
import { SmoothBottomSheetPicker, type PickerOption } from '../../../components/ui/SmoothBottomSheetPicker';
import { getAdPackages, getAdCategories, type AdPackage, type AdCategory } from '../../../api/ads/ads.api';

export default function AdsManagementFormScreen() {
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<AdCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [days, setDays] = useState(0);
  const [boost, setBoost] = useState(0);
  const [targetUsers, setTargetUsers] = useState(0);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const [adsView, setAdsView] = useState<'feed'>('feed');
  const [usersOption, setUsersOption] = useState<'same_interest' | 'interest_in_topic' | 'all_users'>('same_interest');
  const [areaOption, setAreaOption] = useState<'city' | 'country' | 'world'>('world');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [picker, setPicker] = useState<'category' | 'days' | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else {
      setLoadingPackages(true);
      setLoadingCategories(true);
    }

    try {
      const [packagesData, categoriesData] = await Promise.all([
        getAdPackages().catch(() => []),
        getAdCategories().catch(() => []),
      ]);

      if (Array.isArray(packagesData) && packagesData.length > 0) {
        setPackages(packagesData);
        const defaultPkg = packagesData.find((p) => p.isPopular) || packagesData[0];
        if (defaultPkg && !selectedPackageId) {
          setSelectedPackageId(defaultPkg.id);
          setDays(defaultPkg.days);
          setBoost(defaultPkg.priceUsd);
          setTargetUsers(defaultPkg.targetUsers);
        }
      } else {
        setPackages([]);
      }

      if (Array.isArray(categoriesData) && categoriesData.length > 0) {
        setCategories(categoriesData);
        setCategory((prev) => {
          if (prev && categoriesData.some((c) => c.name === prev)) return prev;
          return categoriesData[0]?.name || '';
        });
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.log('[ADS_INIT] fetch error', err);
      setPackages([]);
      setCategories([]);
    } finally {
      setLoadingPackages(false);
      setLoadingCategories(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const dayOptions: PickerOption[] = packages.map((pkg) => ({
    label: `${pkg.days} days — $${pkg.priceUsd} (${pkg.name})`,
    value: pkg.days,
  }));

  const handleSelectPackage = (pkg: AdPackage) => {
    setSelectedPackageId(pkg.id);
    setDays(pkg.days);
    setBoost(pkg.priceUsd);
    setTargetUsers(pkg.targetUsers);
  };

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
      toast.success('Location detected: ' + (place?.city || place?.country || 'Current Area'));
    } catch (error) {
      toast.error('Failed to detect your location');
    } finally {
      setIsLocating(false);
    }
  };

  const calculateDailyRate = (price: number, durationDays: number) => {
    if (!durationDays || durationDays <= 0) return '0.00';
    return (price / durationDays).toFixed(2);
  };

  return (
    <FeatureGuard feature="ads" title="Ads are unavailable">
      <View className="flex-1 bg-[#070707]" style={{ paddingTop: insets.top }}>
        <Header title="Create Ad Campaign" />

        {/* Step Progress Header (Facebook Boost Style) */}
        <View className="px-5 pt-1 pb-3 border-b border-white/5 bg-[#0A0A0A]">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View className="bg-[#A3E635]/15 border border-[#A3E635]/30 rounded-full px-2.5 py-0.5">
                <Text className="text-[#A3E635] text-[11px] font-inter-bold">STEP 1 OF 3</Text>
              </View>
              <Text className="text-white text-xs font-inter-semibold">Audience & Budget</Text>
            </View>
            <Text className="text-[#888] text-xs font-inter">Next: Ad Creative</Text>
          </View>
          {/* Progress Bar (33%) */}
          <View className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <View className="h-full bg-[#A3E635] rounded-full" style={{ width: '33%' }} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom + 110, 130),
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadData(true)}
              tintColor="#A3E635"
              colors={['#A3E635']}
            />
          }
        >
          {/* Goal & Placement Card */}
          <View className="rounded-2xl bg-[#121212] border border-white/10 p-4 mb-5">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-[#A3E635]/10 items-center justify-center">
                  <Ionicons name="megaphone-outline" size={18} color="#A3E635" />
                </View>
                <View>
                  <Text className="text-white text-sm font-inter-bold">Campaign Placement</Text>
                  <Text className="text-[#777] text-xs font-inter">Reels & Home Feed Stream</Text>
                </View>
              </View>
              <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-0.5">
                <Text className="text-emerald-400 text-[10px] font-inter-bold">ACTIVE</Text>
              </View>
            </View>
            <Text className="text-[#999] text-xs leading-4 font-inter mt-1">
              Your sponsored ad will appear natively in the video feed with a dedicated Call-To-Action button.
            </Text>
          </View>

          {/* Category Picker Card */}
          <View className="mb-5">
            <Text className="text-white text-sm font-inter-bold mb-2">Ad Category</Text>
            <Pressable
              className="flex-row items-center justify-between bg-[#121212] border border-white/10 rounded-2xl p-4 active:bg-[#181818]"
              onPress={() => {
                if (categories.length > 0) {
                  setPicker('category');
                } else if (!loadingCategories) {
                  toast.info('No categories available yet');
                }
              }}
              disabled={loadingCategories}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-xl bg-white/5 items-center justify-center">
                  {loadingCategories ? (
                    <ActivityIndicator size="small" color="#A3E635" />
                  ) : (
                    <Ionicons name="pricetag-outline" size={18} color="#A3E635" />
                  )}
                </View>
                <View>
                  <Text className="text-[#777] text-[11px] font-inter">Industry / Niche</Text>
                  <Text className="text-white text-base font-inter-semibold">
                    {loadingCategories
                      ? 'Loading categories...'
                      : category || (categories.length === 0 ? 'No categories available' : 'Select category')}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-[#777] text-xs font-inter">Change</Text>
                <Ionicons name="chevron-forward" size={16} color="#777" />
              </View>
            </Pressable>
          </View>

          {/* Budget & Duration Section (Facebook Boost Packages) */}
          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white text-sm font-inter-bold">Budget & Duration</Text>
              {loadingPackages && <ActivityIndicator size="small" color="#A3E635" />}
            </View>
            <Text className="text-[#777] text-xs font-inter mb-3">
              Choose your promotion duration. Higher tiers unlock broader audience delivery.
            </Text>

            {loadingPackages ? (
              <View className="py-8 items-center justify-center rounded-2xl bg-[#121212] border border-white/10">
                <ActivityIndicator size="small" color="#A3E635" />
                <Text className="text-[#888] text-xs font-inter mt-2">Loading packages...</Text>
              </View>
            ) : packages.length === 0 ? (
              <View className="py-8 px-4 items-center justify-center rounded-2xl bg-[#121212] border border-white/10">
                <Ionicons name="cube-outline" size={32} color="#666" />
                <Text className="text-white text-sm font-inter-semibold mt-2">No Packages Configured</Text>
                <Text className="text-[#777] text-xs font-inter text-center mt-1">
                  Ad packages can be added and managed from the Admin Dashboard.
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {packages.map((pkg) => {
                  const isSelected =
                    selectedPackageId === pkg.id || (days === pkg.days && boost === pkg.priceUsd);

                  return (
                    <Pressable
                      key={pkg.id}
                      onPress={() => handleSelectPackage(pkg)}
                      className={`rounded-2xl p-4 border transition-all ${
                        isSelected
                          ? 'border-[#A3E635] bg-[#14230e]/70'
                          : 'border-white/10 bg-[#121212] active:bg-[#181818]'
                      }`}
                    >
                      {/* Top Row: Title, Badge, Price */}
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center gap-2">
                          <View
                            className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                              isSelected ? 'border-[#A3E635]' : 'border-white/30'
                            }`}
                          >
                            {isSelected && <View className="w-2.5 h-2.5 rounded-full bg-[#A3E635]" />}
                          </View>
                          <Text className="text-white text-base font-inter-bold">{pkg.name}</Text>
                          {pkg.isPopular && (
                            <View className="bg-[#A3E635] rounded-md px-2 py-0.5">
                              <Text className="text-black text-[9px] font-inter-bold tracking-wider">
                                BEST VALUE
                              </Text>
                            </View>
                          )}
                        </View>

                        <View className="items-end">
                          <Text className="text-[#A3E635] text-lg font-inter-bold">
                            ${pkg.priceUsd} <Text className="text-xs text-[#888] font-inter">USD</Text>
                          </Text>
                        </View>
                      </View>

                      {/* Meta Row: Duration & Daily Rate */}
                      <View className="flex-row items-center justify-between pl-7 mb-2.5">
                        <Text className="text-[#AAA] text-xs font-inter">
                          {pkg.days} Days Campaign • ~${calculateDailyRate(pkg.priceUsd, pkg.days)}/day
                        </Text>
                        <View className="bg-white/10 rounded-full px-2.5 py-0.5">
                          <Text className="text-[#A3E635] text-[11px] font-inter-semibold">
                            ⚡ ~{pkg.targetUsers.toLocaleString()} accounts
                          </Text>
                        </View>
                      </View>

                      {/* Subtitle / Description */}
                      {pkg.description ? (
                        <Text className="text-[#666] text-[11px] font-inter pl-7 leading-4">
                          {pkg.description}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Demographics & Target Audience */}
          <View className="mb-5">
            <Text className="text-white text-sm font-inter-bold mb-1">Target Demographics</Text>
            <Text className="text-[#777] text-xs font-inter mb-3">
              Define who sees your ad based on viewer behavior.
            </Text>

            <View className="gap-2.5">
              {[
                {
                  key: 'same_interest' as const,
                  title: 'Same Interest (Recommended)',
                  desc: 'Delivers to viewers who interact with your niche & similar tags.',
                  icon: 'heart-circle-outline' as const,
                },
                {
                  key: 'interest_in_topic' as const,
                  title: 'Topic Specific',
                  desc: 'Targets users searching and browsing your chosen category.',
                  icon: 'filter-outline' as const,
                },
                {
                  key: 'all_users' as const,
                  title: 'Broad Audience (All Users)',
                  desc: 'Maximizes top-of-funnel reach to all active platform users.',
                  icon: 'people-outline' as const,
                },
              ].map((opt) => {
                const isSelected = usersOption === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setUsersOption(opt.key)}
                    className={`flex-row items-center rounded-2xl p-3.5 border ${
                      isSelected
                        ? 'border-[#A3E635] bg-[#14230e]/50'
                        : 'border-white/10 bg-[#121212] active:bg-[#181818]'
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                        isSelected ? 'border-[#A3E635]' : 'border-white/30'
                      }`}
                    >
                      {isSelected && <View className="w-2.5 h-2.5 rounded-full bg-[#A3E635]" />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-sm font-inter-semibold">{opt.title}</Text>
                      <Text className="text-[#777] text-xs font-inter mt-0.5">{opt.desc}</Text>
                    </View>
                    <Ionicons
                      name={opt.icon}
                      size={20}
                      color={isSelected ? '#A3E635' : '#666'}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Location Targeting */}
          <View className="mb-4">
            <Text className="text-white text-sm font-inter-bold mb-1">Location Targeting</Text>
            <Text className="text-[#777] text-xs font-inter mb-3">
              Pinpoint geographical reach for maximum conversion.
            </Text>

            {/* Radar / Location Preview Box */}
            <View className="w-full rounded-2xl overflow-hidden mb-3 bg-[#121212] border border-white/10 p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#A3E635]/15 border border-[#A3E635]/30">
                  <Ionicons name="location" size={22} color="#A3E635" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-inter-bold text-sm">
                    {areaOption === 'world'
                      ? 'Worldwide Distribution (Global Reach)'
                      : areaOption === 'country'
                        ? 'Throughout Country (National Reach)'
                        : city || country
                          ? [city, country].filter(Boolean).join(', ')
                          : 'Target City Centric Audience'}
                  </Text>
                  <Text className="text-xs text-[#777] font-inter mt-0.5">
                    {areaOption === 'city' && !city
                      ? 'Tap "City Centric" below to automatically detect your radius.'
                      : 'Audience geo-filtering is active for this campaign.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Location Options */}
            <View className="gap-2.5">
              {/* World Wide */}
              <Pressable
                onPress={() => setAreaOption('world')}
                className={`flex-row items-center rounded-2xl p-3.5 border ${
                  areaOption === 'world'
                    ? 'border-[#A3E635] bg-[#14230e]/50'
                    : 'border-white/10 bg-[#121212] active:bg-[#181818]'
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                    areaOption === 'world' ? 'border-[#A3E635]' : 'border-white/30'
                  }`}
                >
                  {areaOption === 'world' && <View className="w-2.5 h-2.5 rounded-full bg-[#A3E635]" />}
                </View>
                <View className="flex-1">
                  <Text className="text-white text-sm font-inter-semibold">World Wide</Text>
                  <Text className="text-[#777] text-xs font-inter mt-0.5">
                    Global impressions across all countries
                  </Text>
                </View>
                <Ionicons name="globe-outline" size={20} color={areaOption === 'world' ? '#A3E635' : '#666'} />
              </Pressable>

              {/* Throughout Country */}
              <Pressable
                onPress={() => setAreaOption('country')}
                className={`flex-row items-center rounded-2xl p-3.5 border ${
                  areaOption === 'country'
                    ? 'border-[#A3E635] bg-[#14230e]/50'
                    : 'border-white/10 bg-[#121212] active:bg-[#181818]'
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                    areaOption === 'country' ? 'border-[#A3E635]' : 'border-white/30'
                  }`}
                >
                  {areaOption === 'country' && <View className="w-2.5 h-2.5 rounded-full bg-[#A3E635]" />}
                </View>
                <View className="flex-1">
                  <Text className="text-white text-sm font-inter-semibold">Throughout Country</Text>
                  <Text className="text-[#777] text-xs font-inter mt-0.5">
                    Target audience inside your nation
                  </Text>
                </View>
                <Ionicons name="flag-outline" size={20} color={areaOption === 'country' ? '#A3E635' : '#666'} />
              </Pressable>

              {/* City Centric */}
              <Pressable
                onPress={useCurrentLocation}
                disabled={isLocating}
                className={`flex-row items-center rounded-2xl p-3.5 border ${
                  areaOption === 'city'
                    ? 'border-[#A3E635] bg-[#14230e]/50'
                    : 'border-white/10 bg-[#121212] active:bg-[#181818]'
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                    areaOption === 'city' ? 'border-[#A3E635]' : 'border-white/30'
                  }`}
                >
                  {areaOption === 'city' && <View className="w-2.5 h-2.5 rounded-full bg-[#A3E635]" />}
                </View>
                <View className="flex-1">
                  <Text className="text-white text-sm font-inter-semibold">City Centric</Text>
                  <Text className="text-[#777] text-xs font-inter mt-0.5">
                    {city || country ? [city, country].filter(Boolean).join(', ') : 'Tap to detect current city location'}
                  </Text>
                </View>
                {isLocating ? (
                  <ActivityIndicator size="small" color="#A3E635" />
                ) : (
                  <Ionicons name="locate-outline" size={20} color={areaOption === 'city' ? '#A3E635' : '#666'} />
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Floating Facebook-Style Sticky Action Footer */}
        <View
          className="absolute left-0 right-0 border-t border-white/10 bg-[#0A0A0A]/95 px-5 pt-3 backdrop-blur-lg"
          style={{ bottom: 0, paddingBottom: Math.max(insets.bottom + 12, 20) }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-[#888] text-[11px] font-inter">CAMPAIGN BUDGET</Text>
              <View className="flex-row items-baseline gap-1.5">
                <Text className="text-white font-inter-bold text-xl">${boost} USD</Text>
                <Text className="text-[#A3E635] text-xs font-inter-semibold">• {days} Days</Text>
              </View>
            </View>

            <View className="items-end">
              <Text className="text-[#888] text-[11px] font-inter">EST. REACH</Text>
              <Text className="text-white text-xs font-inter-bold">
                ~{targetUsers.toLocaleString()} users
              </Text>
            </View>
          </View>

          <CustomButton
            title="Next: Ad Creative  →"
            disabled={!selectedPackageId || !category || packages.length === 0}
            onPress={() => {
              if (!selectedPackageId || !category) {
                toast.error('Please select an ad package and category');
                return;
              }
              router.push({
                pathname: '/screens/ads/upload',
                params: {
                  category,
                  days: String(days),
                  budgetUsd: String(boost),
                  targetUsers: String(targetUsers),
                  placement: adsView,
                  audienceType: usersOption,
                  areaType: areaOption,
                  city,
                  country,
                },
              });
            }}
            containerStyle={`w-full py-4 rounded-2xl shadow-lg ${
              !selectedPackageId || !category || packages.length === 0
                ? 'bg-neutral-800 opacity-50'
                : 'bg-[#A3E635] shadow-[#A3E635]/20'
            }`}
            textStyle={`font-inter-bold text-base ${
              !selectedPackageId || !category || packages.length === 0
                ? 'text-neutral-400'
                : 'text-black'
            }`}
          />
        </View>

        {/* Bottom Sheet Picker for Category */}
        <SmoothBottomSheetPicker
          visible={picker !== null}
          title={picker === 'category' ? 'Select Category' : 'Select Duration'}
          options={
            picker === 'category'
              ? categories.map((c) => c.name)
              : dayOptions
          }
          selectedValue={picker === 'category' ? category : days}
          onSelect={(val) => {
            if (picker === 'category') {
              setCategory(String(val));
            } else {
              const selectedDays = Number(val);
              setDays(selectedDays);
              const matchedPkg = packages.find((p) => p.days === selectedDays);
              if (matchedPkg) {
                handleSelectPackage(matchedPkg);
              }
            }
          }}
          onClose={() => setPicker(null)}
        />
      </View>
    </FeatureGuard>
  );
}
