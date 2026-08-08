import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
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
  const [isAudioReady, setIsAudioReady] = useState(!soundUrl);
  const [isVideoReady, setIsVideoReady] = useState(!isVideo);

  const videoSource = useMemo(() => {
    return isVideo ? { uri, contentType: 'progressive' } as any : null;
  }, [isVideo, uri]);

  const videoPlayer = useVideoPlayer(videoSource, player => {
    if (!player) return;
    player.loop = true;
    player.muted = true;
  });

  // Track video readiness
  useEffect(() => {
    if (!videoPlayer) return;
    const sub = videoPlayer.addListener('statusChange', (payload: any) => {
      const currentStatus = payload?.status || payload;
      if (currentStatus === 'readyToPlay') {
        setIsVideoReady(true);
      }
    });
    // Check initial status
    if (videoPlayer.status === 'readyToPlay') {
      setIsVideoReady(true);
    }
    return () => sub.remove();
  }, [videoPlayer]);

  const getTrimTime = useCallback((percentStr?: string, fallbackPercent = 0) => {
    const percent = percentStr !== undefined && percentStr !== '' ? Number(percentStr) : fallbackPercent;
    return Math.floor((percent / 100) * audioDurationSec * 1000) / 1000;
  }, [audioDurationSec]);

  const seekSound = useCallback((player: any, seconds: number) => {
    if (!player || !Number.isFinite(seconds)) return;
    if (typeof player.seekTo === 'function') {
      try { 
        const result = player.seekTo(seconds);
        if (result && typeof result.catch === 'function') {
          result.catch(() => {});
        }
      } catch (e) { }
    }
    try { player.currentTime = seconds; } catch (e) { }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let player: any = null;
      
      // Reset audio readiness if soundUrl changes
      setIsAudioReady(!soundUrl);

      if (soundUrl) {
        try {
          const source = /^\d+$/.test(soundUrl) ? parseInt(soundUrl, 10) : soundUrl;
          player = createAudioPlayer(source);
          
          let hasInitialized = false;
          player.addListener('playbackStatusUpdate', (status: any) => {
            if (status.isLoaded && !hasInitialized) {
              hasInitialized = true;
              const trimTime = getTrimTime(trimLeft);
              if (typeof player.seekTo === 'function') {
                const result = player.seekTo(trimTime);
                if (result && typeof result.then === 'function') {
                  result.then(() => {
                    setIsAudioReady(true);
                    if (isPreviewPlayingRef.current) {
                      try { player.play(); } catch (e) {}
                    }
                  }).catch(() => {
                    setIsAudioReady(true);
                    if (isPreviewPlayingRef.current) {
                      try { player.play(); } catch (e) {}
                    }
                  });
                } else {
                  setIsAudioReady(true);
                  if (isPreviewPlayingRef.current) {
                    try { player.play(); } catch (e) {}
                  }
                }
              } else {
                setIsAudioReady(true);
                if (isPreviewPlayingRef.current) {
                  try { player.play(); } catch (e) {}
                }
              }
            }
          });

          player.loop = true;
          setSound(player);
        } catch (error) {
          console.log("Preview audio error:", error);
          setIsAudioReady(true); // Fallback so it doesn't hang
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

  const isMediaReady = isVideoReady && isAudioReady;

  return {
    videoPlayer,
    sound,
    seekSound,
    getTrimTime,
    isMediaReady
  };
}
