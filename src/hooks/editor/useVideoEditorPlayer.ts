import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
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

  const soundSource = useMemo(() => {
    if (!soundUrl) return null;
    return /^\d+$/.test(soundUrl) ? parseInt(soundUrl, 10) : soundUrl;
  }, [soundUrl]);

  const sound = useAudioPlayer(soundSource);

  useEffect(() => {
    if (sound && soundSource) {
      sound.loop = true;
    }
  }, [sound, soundSource]);

  // Track video readiness
  useEffect(() => {
    if (!videoPlayer) return;
    const sub = videoPlayer.addListener('statusChange', (payload: any) => {
      const currentStatus = payload?.status || payload;
      if (currentStatus === 'readyToPlay') {
        setIsVideoReady(true);
      }
    });
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

  // Track audio readiness and seek to trimLeft
  useEffect(() => {
    setIsAudioReady(!soundUrl);
    
    if (soundUrl && sound) {
      let hasInitialized = false;
      const listener = sound.addListener('playbackStatusUpdate', (status: any) => {
        if (status.isLoaded && !hasInitialized) {
          hasInitialized = true;
          const trimTime = getTrimTime(trimLeft);
          if (typeof sound.seekTo === 'function') {
            const result = sound.seekTo(trimTime);
            if (result && typeof result.then === 'function') {
              result.then(() => {
                setIsAudioReady(true);
                if (isPreviewPlayingRef.current) {
                  try { sound.play(); } catch (e) {}
                }
              }).catch(() => {
                setIsAudioReady(true);
                if (isPreviewPlayingRef.current) {
                  try { sound.play(); } catch (e) {}
                }
              });
            } else {
              setIsAudioReady(true);
              if (isPreviewPlayingRef.current) {
                try { sound.play(); } catch (e) {}
              }
            }
          } else {
            setIsAudioReady(true);
            if (isPreviewPlayingRef.current) {
              try { sound.play(); } catch (e) {}
            }
          }
        }
      });
      return () => listener.remove();
    }
  }, [soundUrl, sound, trimLeft, getTrimTime, isPreviewPlayingRef]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (videoPlayer) {
          try { videoPlayer.pause(); } catch(e) {}
        }
        if (sound) {
          try { sound.pause(); } catch (e) { }
        }
      };
    }, [sound, videoPlayer])
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
