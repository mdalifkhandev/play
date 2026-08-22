import React from 'react';
import { ActivityIndicator, View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { toast } from 'sonner-native';
import { handleApiError } from '../../../api/client';
import { createAdCampaign, uploadAdMedia, type AdAreaType, type AdAudienceType, type AdUploadStep } from '../../../api/ads/ads.api';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';

export default function AdsUploadScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadStep, setUploadStep] = React.useState<AdUploadStep | 'submitting' | 'idle'>('idle');
  const [selectedMedia, setSelectedMedia] = React.useState<{
    uri: string;
    type: 'image' | 'video';
    fileName?: string | null;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const uploadStatusText =
    uploadStep === 'preparing'
      ? 'Preparing upload...'
      : uploadStep === 'uploading'
        ? `${selectedMedia?.type === 'video' ? 'Uploading video' : 'Uploading image'}... ${uploadProgress}%`
        : uploadStep === 'verifying'
          ? 'Verifying uploaded media...'
          : uploadStep === 'submitting'
            ? 'Sending ad request...'
            : '';
  const previewPlayer = useVideoPlayer(
    selectedMedia?.type === 'video' ? selectedMedia.uri : null,
    player => {
      player.loop = true;
      player.muted = true;
    },
  );

  React.useEffect(() => {
    if (selectedMedia?.type !== 'video') return;

    try {
      previewPlayer.play();
    } catch {
      // Preview can fail briefly while the native player is preparing.
    }
  }, [previewPlayer, selectedMedia?.type, selectedMedia?.uri]);

  const pickAdMedia = async () => {
    if (isSubmitting) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error('Media permission is required to upload an ad');
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
    console.log('[AD_UPLOAD] selected media', {
      uri: asset.uri,
      type: asset.type === 'video' ? 'video' : 'image',
      fileName: asset.fileName,
      fileSize: asset.fileSize,
    });
    setUploadProgress(0);
    setUploadStep('idle');
  };

  const submitAd = async () => {
    if (isSubmitting) return;
    if (!selectedMedia) {
      toast.error('Please upload an ad media first');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadStep('preparing');
    try {
      console.log('[AD_UPLOAD] submit start', {
        mediaType: selectedMedia.type,
        fileName: selectedMedia.fileName,
        category: params.category,
        days: params.days,
      });
      const uploaded = await uploadAdMedia(selectedMedia.uri, selectedMedia.type, setUploadProgress, setUploadStep);
      console.log('[AD_UPLOAD] media upload completed', uploaded);
      setUploadStep('submitting');
      await createAdCampaign({
        category: params.category || 'Food',
        days: Number(params.days || 7),
        budgetUsd: Number(params.budgetUsd || 100),
        targetUsers: Number(params.targetUsers || 100),
        placement: 'feed',
        audienceType: (params.audienceType || 'same_interest') as AdAudienceType,
        areaType: (params.areaType || 'city') as AdAreaType,
        city: params.city || undefined,
        country: params.country || undefined,
        mediaAssetId: uploaded.mediaAssetId,
        mediaKey: uploaded.mediaKey || undefined,
        mediaUrl: uploaded.mediaUrl || selectedMedia.uri,
        title: 'Feed ad request',
        description: 'Ad campaign submitted from mobile app.',
      });
      console.log('[AD_UPLOAD] campaign created');
      toast.success('Ad request sent for admin review');
      router.back();
    } catch (error) {
      console.log('[AD_UPLOAD] failed', error);
      toast.error(handleApiError(error, 'Failed to send ad request'));
    } finally {
      setIsSubmitting(false);
      setUploadStep('idle');
    }
  };

  return (
    <View className="flex-1 bg-[#050505]" style={{ paddingTop: insets.top }}>
      <Header title="Ads Management" />

      <View className="flex-1 px-5 mt-4">
        <Text className="text-white text-lg font-medium mb-4">Upload Ad</Text>

        <Pressable
          className="flex-1 bg-[#0F0F0F] border border-[#222] rounded-3xl items-center justify-center mb-24 overflow-hidden"
          onPress={pickAdMedia}
          disabled={isSubmitting}
        >
          {selectedMedia?.type === 'image' ? (
            <Image source={{ uri: selectedMedia.uri }} className="absolute inset-0" style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : selectedMedia?.type === 'video' ? (
            <VideoView
              player={previewPlayer}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              contentFit="cover"
              nativeControls={false}
            />
          ) : null}

          {selectedMedia && (
            <>
              <View className="absolute inset-0 bg-black/20" />
              <View className="absolute left-4 right-4 top-4 flex-row items-center justify-between">
                <View className="rounded-full bg-black/65 px-3 py-1.5">
                  <Text className="text-xs font-inter-bold text-white">
                    {selectedMedia.type === 'video' ? 'Video preview' : 'Image preview'}
                  </Text>
                </View>
                <View className="h-9 w-9 items-center justify-center rounded-full bg-black/65">
                  <Ionicons name="create-outline" size={18} color="#FFF" />
                </View>
              </View>
            </>
          )}
          
          <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center mb-6 shadow-lg">
            <Ionicons name={selectedMedia ? 'swap-horizontal' : 'add'} size={32} color="#000" />
          </View>

          <Text className="text-white font-bold text-lg mb-2">
            {selectedMedia ? 'Ad selected' : 'Upload Ad here'}
          </Text>
          <Text className="text-[#888] text-sm text-center px-8">
            {selectedMedia ? 'Tap to change the selected media' : 'Choose the ad from your files to upload here'}
          </Text>

        </Pressable>
      </View>

      <View className="absolute bottom-10 left-5 right-5">
        <CustomButton 
          title={isSubmitting ? "Sending..." : "Send Request"}
          onPress={submitAd}
          disabled={isSubmitting}
          containerStyle="bg-[#A3E635] w-full py-4 rounded-xl"
          textStyle="text-black font-bold text-base"
        />
        {isSubmitting && (
          <View className="absolute inset-0 items-center justify-center rounded-xl bg-black/20">
            <ActivityIndicator color="#000" />
          </View>
        )}
        {isSubmitting && (
          <View className="mt-3">
            {!!uploadStatusText && (
              <Text className="mb-2 text-center text-xs font-inter-semibold text-white/80">
                {uploadStatusText}
              </Text>
            )}
            <View className="h-1 overflow-hidden rounded-full bg-white/15">
              <View className="h-full bg-[#A3E635]" style={{ width: `${Math.max(8, uploadProgress)}%` }} />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
