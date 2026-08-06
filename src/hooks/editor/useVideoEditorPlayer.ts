import { useState, useCallback, useRef, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { createAudioPlayer } from 'expo-audio';
import { useVideoPlayer } from 'expo-video';

interface UseVideoEditorPlayerProps {
  uri: string;
  isVideo: boolean;
  soundUrl?: string;
  trimLeft?: string;
  isPreviewPlayingRef: React.MutableRefObject<boolean>;
  audioDurationSec: number;
}

export function useVideoEditorPlayer({
  uri,
  isVideo,
  soundUrl,
  trimLeft,
  isPreviewPlayingRef,
  audioDurationSec,
}: UseVideoEditorPlayerProps) {
  const [sound, setSound] = useState<any>(null);

  const videoSource = useMemo(() => {
    return isVideo ? { uri, contentType: 'progressive' } as any : null;
  }, [isVideo, uri]);

  const videoPlayer = useVideoPlayer(videoSource, player => {
    if (!player) return;
    player.loop = true;
    player.muted = true;
  });

  const getTrimTime = useCallback((percentStr?: string, fallbackPercent = 0) => {
    const percent = percentStr !== undefined && percentStr !== '' ? Number(percentStr) : fallbackPercent;
    return Math.floor((percent / 100) * audioDurationSec * 1000) / 1000;
  }, [audioDurationSec]);

  const seekSound = useCallback((player: any, seconds: number) => {
    if (!player || !Number.isFinite(seconds)) return;
    if (typeof player.seekTo === 'function') {
      try { player.seekTo(seconds); } catch (e) { }
    }
    try { player.currentTime = seconds; } catch (e) { }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let player: any = null;
      
      if (videoPlayer && isPreviewPlayingRef.current) {
        try { videoPlayer.play(); } catch(e) {}
      }
      
      if (soundUrl) {
        try {
          const source = /^\d+$/.test(soundUrl) ? parseInt(soundUrl, 10) : soundUrl;
          player = createAudioPlayer(source);
          
          player.addListener('playbackStatusUpdate', (status: any) => {
            // Check status if needed
          });

          seekSound(player, getTrimTime(trimLeft));
          if (isPreviewPlayingRef.current) {
            player.play();
          }
          setTimeout(() => seekSound(player, getTrimTime(trimLeft)), 100);
          player.loop = true;
          setSound(player);
        } catch (error) {
          console.log("Preview audio error:", error);
        }
      }
      
      return () => {
        if (videoPlayer) {
          try { videoPlayer.pause(); } catch(e) {}
        }
        
        if (player) {
          try { player.pause(); } catch (e) { }
          try { player.release(); } catch (e) {}
        }
      };
    }, [soundUrl, trimLeft, audioDurationSec, videoPlayer])
  );

  return {
    videoPlayer,
    sound,
    seekSound,
    getTrimTime
  };
}
