import { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

interface UsePreviewProgressProps {
  isVideo: boolean;
  videoPlayer: any;
  sound: any;
  previewDurationSec: number;
  videoDurationSec: number;
  videoTrimStartSec: number;
  videoTrimEndSec: number;
  trimLeft: string | undefined;
  trimRight: string | undefined;
  audioDurationSec: number;
  getTrimTime: (percentStr?: string, fallbackPercent?: number) => number;
  seekSound: (player: any, seconds: number) => void;
  isPreviewPlayingRef: React.MutableRefObject<boolean>;
}

export function usePreviewProgress({
  isVideo,
  videoPlayer,
  sound,
  previewDurationSec,
  videoDurationSec,
  videoTrimStartSec,
  videoTrimEndSec,
  trimLeft,
  trimRight,
  audioDurationSec,
  getTrimTime,
  seekSound,
  isPreviewPlayingRef,
  isMediaReady
}: UsePreviewProgressProps & { isMediaReady: boolean }) {
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  
  // Keep ref in sync
  useEffect(() => {
    isPreviewPlayingRef.current = isPreviewPlaying;
  }, [isPreviewPlaying, isPreviewPlayingRef]);

  const togglePreviewPlayback = () => setIsPreviewPlaying(prev => !prev);

  useEffect(() => {
    if (isPreviewPlaying && isMediaReady) {
      if (isVideo) {
        if (videoDurationSec > 0 && (videoPlayer.currentTime < videoTrimStartSec || videoPlayer.currentTime >= videoTrimEndSec)) {
          try { videoPlayer.currentTime = videoTrimStartSec; } catch (e) { }
        }
        try { videoPlayer.play(); } catch (e) { }
      }
      if (sound) {
        try { sound.play(); } catch (e) { }
      }
    } else {
      if (isVideo) {
        try { videoPlayer.pause(); } catch (e) { }
      }
      if (sound) {
        try { sound.pause(); } catch (e) { }
      }
    }
  }, [isPreviewPlaying, isVideo, sound, videoDurationSec, videoPlayer, videoTrimEndSec, videoTrimStartSec, isMediaReady]);

  useEffect(() => {
    if (!sound || !isPreviewPlaying) return;

    const watcher = setInterval(() => {
      try {
        const currentTime = Number(sound.currentTime ?? 0);
        const trimStartSec = getTrimTime(trimLeft);
        const trimEndSec = getTrimTime(trimRight, 100);

        if (currentTime >= trimEndSec || currentTime < trimStartSec - 0.25) {
          seekSound(sound, trimStartSec);
          if (isPreviewPlaying) {
            try { sound.play(); } catch (e) { }
          }
        }
      } catch (err) {
        // Audio might be released
      }
    }, 200);

    return () => clearInterval(watcher);
  }, [audioDurationSec, isPreviewPlaying, sound, trimLeft, trimRight, getTrimTime, seekSound]);

  useEffect(() => {
    if (!isPreviewPlaying) return;

    const progressTimer = setInterval(() => {
       if (!isVideo && !sound) {
         setPreviewCurrentTime(prev => {
            const current = Number.isFinite(prev) ? prev : 0;
            const dur = Number.isFinite(previewDurationSec) && previewDurationSec > 0 ? previewDurationSec : 1;
            let updated = current + 0.2;
            if (updated >= dur) updated = 0;
            return updated;
         });
         return;
       }
       
       try {
         const rawVideoTime = isVideo && videoPlayer ? Number(videoPlayer.currentTime) : 0;
         const videoCurrentTime = Number.isFinite(rawVideoTime) ? rawVideoTime : 0;
         
         const rawAudioTime = sound ? Number(sound.currentTime) : 0;
         const audioCurrentTime = Number.isFinite(rawAudioTime) ? rawAudioTime : 0;
         
         const startOffset = isVideo ? (Number.isFinite(videoTrimStartSec) ? videoTrimStartSec : 0) : getTrimTime(trimLeft);
         const endOffset = isVideo ? (Number.isFinite(videoTrimEndSec) ? videoTrimEndSec : 0) : getTrimTime(trimRight, 100);
         
         const nextTime = isVideo ? videoCurrentTime - startOffset : audioCurrentTime - startOffset;
         const safeTime = Math.max(0, nextTime);
         const duration = Number.isFinite(previewDurationSec) && previewDurationSec > 0 ? previewDurationSec : 1;

         if (isVideo && videoDurationSec > 0 && (videoCurrentTime >= endOffset || videoCurrentTime < startOffset - 0.1)) {
           try { videoPlayer.currentTime = startOffset; } catch (e) { }
           if (sound) seekSound(sound, getTrimTime(trimLeft));
           setPreviewCurrentTime(0);
           return;
         }

         if (safeTime >= duration - 0.1) {
           if (isVideo) try { videoPlayer.currentTime = startOffset; } catch (e) { }
           if (sound) seekSound(sound, getTrimTime(trimLeft));
           setPreviewCurrentTime(0);
           return;
         }

         setPreviewCurrentTime(Math.min(duration, safeTime));
       } catch (err) {
         // Player might be released, ignore
       }
    }, 200);

    return () => clearInterval(progressTimer);
  }, [isPreviewPlaying, isVideo, previewDurationSec, sound, trimLeft, trimRight, videoPlayer, videoTrimEndSec, videoTrimStartSec, getTrimTime, seekSound, videoDurationSec]);

  useFocusEffect(
    useCallback(() => {
      setIsPreviewPlaying(true);
      return () => {
        try { videoPlayer?.pause(); } catch (e) { }
        try { sound?.pause(); } catch (e) { }
      };
    }, [sound, videoPlayer])
  );

  const rawPercent = (previewCurrentTime / Math.max(1, previewDurationSec)) * 100;
  const previewProgressPercent = Number.isFinite(rawPercent) ? Math.max(0, Math.min(100, rawPercent)) : 0;

  return {
    isPreviewPlaying,
    setIsPreviewPlaying,
    togglePreviewPlayback,
    previewCurrentTime,
    previewProgressPercent
  };
}
