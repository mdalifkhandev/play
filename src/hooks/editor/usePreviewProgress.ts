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
  isPreviewPlayingRef
}: UsePreviewProgressProps) {
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  
  // Keep ref in sync
  useEffect(() => {
    isPreviewPlayingRef.current = isPreviewPlaying;
  }, [isPreviewPlaying, isPreviewPlayingRef]);

  const togglePreviewPlayback = () => setIsPreviewPlaying(prev => !prev);

  useEffect(() => {
    if (isPreviewPlaying) {
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
  }, [isPreviewPlaying, isVideo, sound, videoDurationSec, videoPlayer, videoTrimEndSec, videoTrimStartSec]);

  useEffect(() => {
    if (!sound || !isPreviewPlaying) return;

    const watcher = setInterval(() => {
      const currentTime = Number(sound.currentTime ?? 0);
      const trimStartSec = getTrimTime(trimLeft);
      const trimEndSec = getTrimTime(trimRight, 100);

      if (currentTime >= trimEndSec || currentTime < trimStartSec - 0.25) {
        seekSound(sound, trimStartSec);
        if (isPreviewPlaying) {
          try { sound.play(); } catch (e) { }
        }
      }
    }, 200);

    return () => clearInterval(watcher);
  }, [audioDurationSec, isPreviewPlaying, sound, trimLeft, trimRight, getTrimTime, seekSound]);

  useEffect(() => {
    if (!isPreviewPlaying) return;

    const handleTimeUpdate = () => {
      const videoCurrentTime = isVideo && videoPlayer ? Number(videoPlayer.currentTime ?? 0) : 0;
      const audioCurrentTime = sound ? Number(sound.currentTime ?? 0) : 0;
      const nextTime = isVideo ? videoCurrentTime - videoTrimStartSec : audioCurrentTime - getTrimTime(trimLeft);
      const safeTime = Math.max(0, nextTime);
      const duration = previewDurationSec;

      if (isVideo && videoDurationSec > 0 && (videoCurrentTime >= videoTrimEndSec || videoCurrentTime < videoTrimStartSec - 0.1)) {
        try { videoPlayer.currentTime = videoTrimStartSec; } catch (e) { }
        if (sound) {
          seekSound(sound, getTrimTime(trimLeft));
        }
        setPreviewCurrentTime(0);
        return;
      }

      if (safeTime >= duration - 0.1) {
        if (isVideo) {
          try { videoPlayer.currentTime = videoTrimStartSec; } catch (e) { }
        }
        if (sound) {
          seekSound(sound, getTrimTime(trimLeft));
        }
        setPreviewCurrentTime(0);
        return;
      }

      setPreviewCurrentTime(Math.min(duration, safeTime));
    };

    let subscription: any;
    if (isVideo && videoPlayer) {
      try {
         // @ts-ignore
         subscription = videoPlayer.addListener('timeUpdate', handleTimeUpdate);
      } catch (e) {}
    }

    const progressTimer = !subscription ? setInterval(() => {
       if (!isVideo && !sound) {
         setPreviewCurrentTime(prev => {
            let updated = prev + 0.2;
            if (updated >= previewDurationSec) updated = 0;
            return updated;
         });
         return;
       }
       handleTimeUpdate();
    }, 200) : null;

    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [isPreviewPlaying, isVideo, previewDurationSec, sound, trimLeft, videoPlayer, videoTrimEndSec, videoTrimStartSec, getTrimTime, seekSound, videoDurationSec]);

  useFocusEffect(
    useCallback(() => {
      setIsPreviewPlaying(true);
      return () => {
        try { videoPlayer?.pause(); } catch (e) { }
        try { sound?.pause(); } catch (e) { }
      };
    }, [sound, videoPlayer])
  );

  const previewProgressPercent = Math.max(0, Math.min(100, (previewCurrentTime / Math.max(1, previewDurationSec)) * 100));

  return {
    isPreviewPlaying,
    setIsPreviewPlaying,
    togglePreviewPlayback,
    previewCurrentTime,
    previewProgressPercent
  };
}
