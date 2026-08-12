import { useState } from 'react';
import { useRouter } from 'expo-router';
import { buildVideoEditSpec } from '../../utils/exportEditedMedia';

interface UseMediaExportProps {
  mockImage: string;
  mediaType?: 'photo' | 'video';
  soundUrl: string;
  overlayText: string;
  originalVolume?: string;
  addedVolume?: string;
  trimLeft?: string;
  trimRight?: string;
  audioDurationSec: number;
  videoTrimStartSec: number;
  videoTrimEndSec: number;
  activeFilter?: string | null;
  activeEffect?: string | null;
  textPan: any;
  title: string;
  soundDuration?: string;
  musicId?: string;
  musicArtist?: string;
  musicCoverUrl?: string;
  videoTrimLeft?: string;
  videoTrimRight?: string;
  videoTrimStart?: string;
  videoTrimEnd?: string;
  videoDurationSec: number;
  exposure: number;
  contrast: number;
  videoPlayer: any;
  sound: any;
}

export function useMediaExport({
  mockImage,
  mediaType,
  soundUrl,
  overlayText,
  originalVolume,
  addedVolume,
  trimLeft,
  trimRight,
  audioDurationSec,
  videoTrimStartSec,
  videoTrimEndSec,
  activeFilter,
  activeEffect,
  textPan,
  title,
  soundDuration,
  musicId,
  musicArtist,
  musicCoverUrl,
  videoTrimLeft,
  videoTrimRight,
  videoTrimStart,
  videoTrimEnd,
  videoDurationSec,
  exposure,
  contrast,
  videoPlayer,
  sound
}: UseMediaExportProps) {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);

  const navigateToPostDetails = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      try { videoPlayer?.pause(); } catch (e) { }
      try { sound?.pause(); } catch (e) { }

      const editSpec = buildVideoEditSpec({
        uri: mockImage,
        mediaType,
        soundUrl,
        overlayText,
        originalVolume,
        addedVolume,
        trimLeft,
        trimRight,
        audioDurationSec,
        videoTrimStartSec,
        videoTrimEndSec,
        activeFilter: activeFilter || undefined,
        activeEffect: activeEffect || undefined,
        textOffsetX: (textPan.x as any)._value,
        textOffsetY: (textPan.y as any)._value,
      });

      router.push({
        pathname: '/screens/create/post-details',
        params: {
          uri: mockImage,
          mediaType: mediaType || 'photo',
          videoEdit: editSpec ? JSON.stringify(editSpec) : undefined,
          overlayText: overlayText,
          soundUrl: soundUrl || '',
          title: title || '',
          soundDuration: soundDuration || '',
          musicId: musicId || '',
          musicArtist: musicArtist || '',
          musicCoverUrl: musicCoverUrl || '',
          originalVolume: originalVolume?.toString() || '',
          addedVolume: addedVolume?.toString() || '',
          trimLeft: trimLeft?.toString() || '',
          trimRight: trimRight?.toString() || '',
          videoTrimLeft: videoTrimLeft?.toString() || '',
          videoTrimRight: videoTrimRight?.toString() || '',
          videoTrimStart: videoTrimStart || '',
          videoTrimEnd: videoTrimEnd || '',
          videoDuration: videoDurationSec.toString(),
          exposure: exposure.toString(),
          contrast: contrast.toString(),
          activeFilter: activeFilter,
          activeEffect: activeEffect || '',
          textOffsetX: ((textPan.x as any)._value ?? 0).toString(),
          textOffsetY: ((textPan.y as any)._value ?? 0).toString()
        }
      } as any);
    } catch (error) {
      console.log('Export edited video error:', error);
      router.push({
        pathname: '/screens/create/post-details',
        params: {
          uri: mockImage,
          mediaType: mediaType || 'photo',
          overlayText: overlayText,
          // Fallbacks for other fields if needed, but in standard flow this wouldn't hit unless buildVideoEditSpec crashes
        }
      } as any);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    navigateToPostDetails
  };
}
