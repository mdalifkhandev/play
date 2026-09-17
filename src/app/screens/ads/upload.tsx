import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { toast } from 'sonner-native';
import { handleApiError } from '../../../api/client';
import {
  createAdCampaign,
  uploadAdMedia,
  type AdAreaType,
  type AdAudienceType,
  type AdCtaType,
  type AdUploadStep,
} from '../../../api/ads/ads.api';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';
import { FeatureGuard } from '../../../components/settings/FeatureGuard';
import { useAppStore } from '../../../store';
import { avatarSource } from '../../../utils/avatar';

const CTA_BUTTON_PRESETS = [
  'Learn more',
  'Shop now',
  'Sign up',
  'Contact us',
  'Book now',
  'Get offer',
];

export default function AdsUploadScreen() {
  const insets = useSafeAreaInsets();
  const currentUser = useAppStore((state) => state.user);

  const params = useLocalSearchParams<{
    category?: string;
    days?: string;
    budgetUsd?: string;
    targetUsers?: string;
    placement?: string;
    audienceType?: string;
    areaType?: string;
    city?: string;
    country?: string;
  }>();

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStep, setUploadStep] = useState<AdUploadStep | 'submitting' | 'idle'>('idle');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ctaType, setCtaType] = useState<AdCtaType>('learn_more');
  const [ctaLabel, setCtaLabel] = useState('Learn more');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [isMuted, setIsMuted] = useState(true);

  const [selectedMedia, setSelectedMedia] = useState<{
    uri: string;
    type: 'image' | 'video';
    fileName?: string | null;
  } | null>(null);

  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadStatusText =
    uploadStep === 'preparing'
      ? 'Preparing media upload...'
      : uploadStep === 'uploading'
        ? `Uploading ${selectedMedia?.type === 'video' ? 'video' : 'image'}... ${uploadProgress}%`
        : uploadStep === 'verifying'
          ? 'Verifying uploaded media...'
          : uploadStep === 'submitting'
            ? 'Finalizing campaign...'
            : '';

  const previewPlayer = useVideoPlayer(
    selectedMedia?.type === 'video' ? selectedMedia.uri : null,
    (player) => {
      player.loop = true;
      player.muted = isMuted;
    }
  );

  useEffect(() => {
    if (previewPlayer) {
      previewPlayer.muted = isMuted;
    }
  }, [isMuted, previewPlayer]);

  useEffect(() => {
    if (selectedMedia?.type !== 'video' || !previewPlayer) return;

    try {
      previewPlayer.play();
    } catch {
      // preview player warming up
    }
  }, [previewPlayer, selectedMedia?.type, selectedMedia?.uri]);

  const pickAdMedia = async () => {
    if (isSubmitting) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error('Media permission is required to select ad creative');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 0.9,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setSelectedMedia({
      uri: asset.uri,
      type: asset.type === 'video' ? 'video' : 'image',
      fileName: asset.fileName,
    });
    setUploadProgress(0);
    setUploadStep('idle');
    toast.success(`${asset.type === 'video' ? 'Video' : 'Image'} selected successfully`);
  };

  const submitAd = async () => {
    if (isSubmitting) return;
    if (!selectedMedia) {
      toast.error('Please select an image or video for your ad');
      setActiveTab('edit');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter an ad headline / title');
      setActiveTab('edit');
      return;
    }
    if (ctaType === 'learn_more' && !destinationUrl.trim()) {
      toast.error('Please enter a destination website link');
      setActiveTab('edit');
      return;
    }

    // Auto-prepend https:// if missing
    let finalUrl = destinationUrl.trim();
    if (ctaType === 'learn_more' && finalUrl) {
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadStep('preparing');

    try {
      const uploaded = await uploadAdMedia(
        selectedMedia.uri,
        selectedMedia.type,
        setUploadProgress,
        setUploadStep
      );

      setUploadStep('submitting');
      const campaign = await createAdCampaign({
        category: params.category || 'General',
        days: Number(params.days || 7),
        budgetUsd: Number(params.budgetUsd || 10),
        targetUsers: Number(params.targetUsers || 500),
        placement: 'feed',
        audienceType: (params.audienceType || 'same_interest') as AdAudienceType,
        areaType: (params.areaType || 'world') as AdAreaType,
        city: params.city || undefined,
        country: params.country || undefined,
        mediaAssetId: uploaded.mediaAssetId,
        mediaKey: uploaded.mediaKey || undefined,
        mediaUrl: uploaded.mediaUrl || selectedMedia.uri,
        title: title.trim(),
        description: description.trim() || undefined,
        destinationUrl: ctaType === 'learn_more' ? finalUrl : undefined,
        ctaType,
        ctaLabel:
          ctaType === 'none'
            ? undefined
            : ctaLabel.trim() || (ctaType === 'send_message' ? 'Send message' : 'Learn more'),
      });

      router.push({
        pathname: '/screens/ads/payment-method',
        params: {
          adId: campaign.id,
          budgetUsd: String(campaign.budgetUsd || params.budgetUsd || 10),
          days: String(campaign.days || params.days || 7),
          title: campaign.title || title.trim() || 'Ad Campaign',
          category: campaign.category || params.category || 'General',
        },
      });
    } catch (error) {
      console.log('[AD_UPLOAD] failed', error);
      toast.error(handleApiError(error, 'Failed to create ad campaign'));
    } finally {
      setIsSubmitting(false);
      setUploadStep('idle');
    }
  };

  const advertiserName =
    currentUser?.displayName || currentUser?.username || 'Your Brand Page';
  const advertiserAvatar = currentUser?.avatarUrl || currentUser?.photoUrl;

  return (
    <FeatureGuard feature="ads" title="Ads are unavailable">
      <KeyboardAvoidingView
        className="flex-1 bg-[#070707]"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        style={{ paddingTop: insets.top }}
      >
        <Header title="Ad Creative & Media" />

        {/* Step Progress Header (Facebook Boost Style) */}
        <View className="px-5 pt-1 pb-3 border-b border-white/5 bg-[#0A0A0A]">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View className="bg-[#A3E635]/15 border border-[#A3E635]/30 rounded-full px-2.5 py-0.5">
                <Text className="text-[#A3E635] text-[11px] font-inter-bold">STEP 2 OF 3</Text>
              </View>
              <Text className="text-white text-xs font-inter-semibold">Ad Creative & Media</Text>
            </View>
            <Text className="text-[#888] text-xs font-inter">Next: Payment</Text>
          </View>
          {/* Progress Bar (66%) */}
          <View className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <View className="h-full bg-[#A3E635] rounded-full" style={{ width: '66%' }} />
          </View>

          {/* Facebook-style Segmented View Switcher: Edit vs Live Feed Preview */}
          <View className="flex-row bg-[#151515] p-1 rounded-xl mt-3 border border-white/10">
            <Pressable
              onPress={() => setActiveTab('edit')}
              className={`flex-1 flex-row items-center justify-center py-2 rounded-lg gap-2 ${
                activeTab === 'edit' ? 'bg-[#222] shadow-sm' : ''
              }`}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={activeTab === 'edit' ? '#A3E635' : '#888'}
              />
              <Text
                className={`text-xs font-inter-bold ${
                  activeTab === 'edit' ? 'text-white' : 'text-[#888]'
                }`}
              >
                Edit Creative
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('preview')}
              className={`flex-1 flex-row items-center justify-center py-2 rounded-lg gap-2 ${
                activeTab === 'preview' ? 'bg-[#222] shadow-sm' : ''
              }`}
            >
              <Ionicons
                name="eye-outline"
                size={16}
                color={activeTab === 'preview' ? '#A3E635' : '#888'}
              />
              <Text
                className={`text-xs font-inter-bold ${
                  activeTab === 'preview' ? 'text-white' : 'text-[#888]'
                }`}
              >
                Live Ad Preview
              </Text>
              {selectedMedia && (
                <View className="w-2 h-2 rounded-full bg-[#A3E635]" />
              )}
            </Pressable>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom + 120, 140),
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'edit' ? (
            /* ================= EDIT CREATIVE MODE ================= */
            <View>
              {/* Media Picker Hero Card */}
              <Pressable
                className="h-80 bg-[#121212] border-2 border-dashed border-white/20 rounded-3xl items-center justify-center overflow-hidden mb-5 active:border-[#A3E635]"
                onPress={pickAdMedia}
                disabled={isSubmitting}
              >
                {selectedMedia?.type === 'image' ? (
                  <Image
                    source={{ uri: selectedMedia.uri }}
                    className="absolute inset-0"
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : selectedMedia?.type === 'video' ? (
                  <VideoView
                    player={previewPlayer}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                    contentFit="cover"
                    nativeControls={false}
                  />
                ) : null}

                {/* Overlay when media is selected */}
                {selectedMedia ? (
                  <>
                    <LinearGradient
                      colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.7)']}
                      style={{ position: 'absolute', inset: 0 }}
                    />
                    <View className="absolute left-4 right-4 top-4 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2 rounded-full bg-black/70 border border-white/20 px-3 py-1.5 backdrop-blur-md">
                        <Ionicons
                          name={selectedMedia.type === 'video' ? 'videocam' : 'image'}
                          size={14}
                          color="#A3E635"
                        />
                        <Text className="text-xs font-inter-bold text-white uppercase tracking-wider">
                          {selectedMedia.type === 'video' ? 'Video Ad' : 'Image Ad'}
                        </Text>
                      </View>

                      {selectedMedia.type === 'video' && (
                        <Pressable
                          onPress={() => setIsMuted(!isMuted)}
                          className="h-9 w-9 items-center justify-center rounded-full bg-black/70 border border-white/20"
                        >
                          <Ionicons
                            name={isMuted ? 'volume-mute' : 'volume-high'}
                            size={18}
                            color="#FFF"
                          />
                        </Pressable>
                      )}
                    </View>

                    <View className="items-center bg-black/60 px-4 py-2 rounded-2xl border border-white/20">
                      <Ionicons name="swap-horizontal" size={24} color="#A3E635" />
                      <Text className="text-white text-xs font-inter-bold mt-1">
                        Tap to change media
                      </Text>
                    </View>
                  </>
                ) : (
                  /* Empty state */
                  <View className="items-center px-6">
                    <View className="w-16 h-16 bg-[#A3E635]/15 border border-[#A3E635]/30 rounded-2xl items-center justify-center mb-4">
                      <Ionicons name="cloud-upload-outline" size={32} color="#A3E635" />
                    </View>
                    <Text className="text-white font-inter-bold text-lg mb-1">
                      Upload Ad Creative
                    </Text>
                    <Text className="text-[#888] text-xs text-center leading-4 max-w-[260px]">
                      Choose high quality 9:16 vertical video or photo from your gallery.
                    </Text>
                    <View className="mt-4 bg-white/10 px-3 py-1 rounded-full">
                      <Text className="text-white/80 text-[10px] font-inter-semibold">
                        SUPPORTS MP4, MOV, JPG, PNG
                      </Text>
                    </View>
                  </View>
                )}
              </Pressable>

              {/* Form Inputs */}
              <View className="gap-5">
                {/* Title / Headline */}
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="text-outline" size={16} color="#A3E635" />
                      <Text className="text-sm font-inter-bold text-white">Headline / Title</Text>
                    </View>
                    <Text className="text-[11px] font-inter text-[#777]">{title.length}/120</Text>
                  </View>
                  <TextInput
                    className="rounded-2xl border border-white/10 bg-[#121212] px-4 py-3.5 text-white font-inter text-base"
                    placeholder="e.g., Summer Sale - 50% Off Everything!"
                    placeholderTextColor="#555"
                    value={title}
                    onChangeText={setTitle}
                    maxLength={120}
                  />
                </View>

                {/* Details / Description */}
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="document-text-outline" size={16} color="#A3E635" />
                      <Text className="text-sm font-inter-bold text-white">
                        Primary Text / Ad Copy
                      </Text>
                    </View>
                    <Text className="text-[11px] font-inter text-[#777]">
                      {description.length}/500
                    </Text>
                  </View>
                  <TextInput
                    className="min-h-24 rounded-2xl border border-white/10 bg-[#121212] px-4 py-3.5 text-white font-inter text-sm"
                    placeholder="Tell viewers what your offer or product is about..."
                    placeholderTextColor="#555"
                    value={description}
                    onChangeText={setDescription}
                    maxLength={500}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                {/* Call To Action (CTA) Buttons */}
                <View>
                  <View className="flex-row items-center gap-1.5 mb-2">
                    <Ionicons name="navigate-outline" size={16} color="#A3E635" />
                    <Text className="text-sm font-inter-bold text-white">Call-To-Action Button</Text>
                  </View>

                  <View className="flex-row gap-2 mb-3">
                    {[
                      {
                        value: 'learn_more' as const,
                        label: 'Website Link',
                        icon: 'globe-outline' as const,
                      },
                      {
                        value: 'send_message' as const,
                        label: 'Send Message',
                        icon: 'chatbubble-outline' as const,
                      },
                      {
                        value: 'none' as const,
                        label: 'No Button',
                        icon: 'close-circle-outline' as const,
                      },
                    ].map((opt) => {
                      const isSelected = ctaType === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => {
                            setCtaType(opt.value);
                            if (opt.value === 'send_message') setCtaLabel('Send message');
                            if (opt.value === 'learn_more') setCtaLabel('Learn more');
                          }}
                          className={`flex-1 flex-row items-center justify-center py-3 px-2 rounded-xl border ${
                            isSelected
                              ? 'bg-[#A3E635] border-[#A3E635]'
                              : 'bg-[#121212] border-white/10 active:bg-[#181818]'
                          }`}
                        >
                          <Ionicons
                            name={opt.icon}
                            size={15}
                            color={isSelected ? '#000' : '#888'}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            className={`text-xs font-inter-bold ${
                              isSelected ? 'text-black' : 'text-white'
                            }`}
                            numberOfLines={1}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Button Label Preset Chips (When learn_more is selected) */}
                  {ctaType === 'learn_more' && (
                    <View className="mb-3">
                      <Text className="text-[#888] text-[11px] font-inter mb-2">
                        Quick button presets:
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8 }}
                      >
                        {CTA_BUTTON_PRESETS.map((preset) => (
                          <Pressable
                            key={preset}
                            onPress={() => setCtaLabel(preset)}
                            className={`px-3 py-1.5 rounded-full border ${
                              ctaLabel.toLowerCase() === preset.toLowerCase()
                                ? 'bg-white/20 border-[#A3E635]'
                                : 'bg-white/5 border-white/10'
                            }`}
                          >
                            <Text
                              className={`text-xs font-inter-semibold ${
                                ctaLabel.toLowerCase() === preset.toLowerCase()
                                  ? 'text-[#A3E635]'
                                  : 'text-white/70'
                              }`}
                            >
                              {preset}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Destination Website URL */}
                  {ctaType === 'learn_more' && (
                    <View>
                      <Text className="mb-2 text-xs font-inter-semibold text-white/80">
                        Destination Website URL
                      </Text>
                      <View className="flex-row items-center rounded-2xl border border-white/10 bg-[#121212] px-4">
                        <Ionicons name="link-outline" size={18} color="#777" />
                        <TextInput
                          className="flex-1 py-3.5 pl-3 text-white font-inter text-sm"
                          placeholder="https://yourwebsite.com/shop"
                          placeholderTextColor="#555"
                          value={destinationUrl}
                          onChangeText={setDestinationUrl}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="url"
                        />
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ) : (
            /* ================= LIVE FEED PREVIEW MODE ================= */
            <View className="items-center">
              <View className="w-full max-w-[360px] h-[520px] rounded-3xl overflow-hidden bg-black border-2 border-white/20 relative shadow-2xl">
                {/* Media Background */}
                {selectedMedia?.type === 'video' ? (
                  <VideoView
                    player={previewPlayer}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                    contentFit="cover"
                    nativeControls={false}
                  />
                ) : selectedMedia?.type === 'image' ? (
                  <Image
                    source={{ uri: selectedMedia.uri }}
                    className="absolute inset-0"
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="absolute inset-0 items-center justify-center bg-[#151515] p-6">
                    <Ionicons name="images-outline" size={48} color="#444" />
                    <Text className="text-white/60 text-center font-inter-semibold mt-3 text-xs">
                      No media selected yet. Return to "Edit Creative" to upload an image or video.
                    </Text>
                  </View>
                )}

                {/* Dark Gradient Overlay for readability */}
                <LinearGradient
                  colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.85)']}
                  style={{ position: 'absolute', inset: 0 }}
                />

                {/* Facebook Sponsored Header Overlay */}
                <View className="absolute left-4 right-4 top-4 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2.5">
                    <Image
                      source={avatarSource(advertiserAvatar)}
                      className="w-10 h-10 rounded-full border border-white/30"
                      contentFit="cover"
                    />
                    <View>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-white font-inter-bold text-sm" numberOfLines={1}>
                          {advertiserName}
                        </Text>
                        <Ionicons name="checkmark-circle" size={14} color="#A3E635" />
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-white/80 text-[11px] font-inter">Sponsored</Text>
                        <Text className="text-white/50 text-[10px]">•</Text>
                        <Ionicons name="globe-outline" size={11} color="#AAA" />
                      </View>
                    </View>
                  </View>

                  {/* Sound Toggle (if video) */}
                  {selectedMedia?.type === 'video' && (
                    <Pressable
                      onPress={() => setIsMuted(!isMuted)}
                      className="h-8 w-8 items-center justify-center rounded-full bg-black/50 border border-white/20"
                    >
                      <Ionicons
                        name={isMuted ? 'volume-mute' : 'volume-high'}
                        size={16}
                        color="#FFF"
                      />
                    </Pressable>
                  )}
                </View>

                {/* Bottom Ad Content Overlay (Facebook Style) */}
                <View className="absolute left-4 right-4 bottom-4">
                  {/* Headline */}
                  <Text className="text-white text-lg font-inter-bold mb-1 shadow-md" numberOfLines={2}>
                    {title || 'Your Ad Headline'}
                  </Text>

                  {/* Description */}
                  <Text
                    className="text-white/90 text-xs font-inter leading-4 mb-3 shadow-md"
                    numberOfLines={3}
                  >
                    {description ||
                      'Your campaign description and offer details will be displayed here for users across the feed.'}
                  </Text>

                  {/* CTA Button */}
                  {ctaType !== 'none' && (
                    <View className="w-full bg-[#A3E635] py-2.5 px-4 rounded-xl flex-row items-center justify-between shadow-lg shadow-black/40">
                      <Text className="text-black font-inter-bold text-xs">
                        {ctaType === 'send_message'
                          ? 'Send Message'
                          : ctaLabel || 'Learn More'}
                      </Text>
                      <Ionicons
                        name={
                          ctaType === 'send_message'
                            ? 'chatbubble-ellipses'
                            : 'arrow-forward-outline'
                        }
                        size={16}
                        color="#000"
                      />
                    </View>
                  )}
                </View>
              </View>

              <Text className="text-[#666] text-xs font-inter text-center mt-3">
                Live simulation of how your ad appears in the user feed.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Floating Facebook-Style Sticky Action Footer */}
        <View
          className="absolute left-0 right-0 border-t border-white/10 bg-[#0A0A0A]/95 px-5 pt-3 backdrop-blur-lg"
          style={{ bottom: 0, paddingBottom: Math.max(insets.bottom + 12, 20) }}
        >
          {isSubmitting ? (
            <View className="mb-2">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-xs font-inter-semibold text-white/90">
                  {uploadStatusText || 'Creating ad campaign...'}
                </Text>
                <Text className="text-xs font-inter-bold text-[#A3E635]">{uploadProgress}%</Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-white/10">
                <View
                  className="h-full bg-[#A3E635] rounded-full transition-all"
                  style={{ width: `${Math.max(10, uploadProgress)}%` }}
                />
              </View>
            </View>
          ) : (
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-[#888] text-[11px] font-inter">CAMPAIGN TOTAL</Text>
                <Text className="text-white font-inter-bold text-xl">
                  ${params.budgetUsd || '10'} USD{' '}
                  <Text className="text-[#A3E635] text-xs font-inter-semibold">
                    • {params.days || '7'} Days
                  </Text>
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[#888] text-[11px] font-inter">EST. REACH</Text>
                <Text className="text-white text-xs font-inter-bold">
                  ~{Number(params.targetUsers || 500).toLocaleString()} users
                </Text>
              </View>
            </View>
          )}

          <CustomButton
            title={isSubmitting ? 'Uploading & Creating Campaign...' : 'Proceed to Payment  →'}
            onPress={submitAd}
            disabled={isSubmitting}
            containerStyle="bg-[#A3E635] w-full py-4 rounded-2xl shadow-lg shadow-[#A3E635]/20"
            textStyle="text-black font-inter-bold text-base"
          />
        </View>
      </KeyboardAvoidingView>
    </FeatureGuard>
  );
}
