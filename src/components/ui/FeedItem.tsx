import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface FeedItemProps {
  id: string;
  type: 'video' | 'image';
  source: string;
  thumbnailUrl?: string;
  user: {
    username: string;
    profileImage: string;
  };
  description: string;
  date: string;
  stats: {
    likes: string;
    comments: string;
    bookmarks: string;
    shares: string;
  };
  isActive: boolean;
  shouldMountVideo?: boolean;
}

const isRemoteUri = (source: string) => /^https?:\/\//i.test(source);
const isImageThumbnail = (source?: string) => !!source && !/\.(mp4|mov|m4v|webm)(\?|$)/i.test(source);

function FeedFallback({ showSpinner = false }: { showSpinner?: boolean }) {
  return (
    <View className="absolute inset-0 items-center justify-center bg-[#111]">
      <Ionicons name="play-circle-outline" size={48} color="#98FF2F" />
      {showSpinner && <ActivityIndicator size="small" color="#98FF2F" className="mt-4" />}
    </View>
  );
}

function FeedVideo({
  source,
  thumbnailUrl,
  isActive,
  onDoubleTap,
}: {
  source: string;
  thumbnailUrl?: string;
  isActive: boolean;
  onDoubleTap: () => void;
}) {
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasFirstFrame, setHasFirstFrame] = useState(false);
  const [hasError, setHasError] = useState(!source);
  const [feedbackIcon, setFeedbackIcon] = useState<'play' | 'pause' | null>(null);
  const playRequestRef = useRef(0);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const lastTapRef = useRef(0);

  const videoSource = useMemo(() => {
    if (!source) return null;
    return isRemoteUri(source) ? { uri: source, contentType: 'progressive' as const } : source;
  }, [source]);

  const player = useVideoPlayer(videoSource, currentPlayer => {
    currentPlayer.loop = true;
    currentPlayer.muted = false;
  });

  const pauseSafely = useCallback(() => {
    if (!isMountedRef.current) return;

    try {
      player?.pause();
    } catch (error) {
      console.log('Feed video pause failed:', error);
    }
  }, [player]);

  const playSafely = useCallback(() => {
    const requestId = ++playRequestRef.current;
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
    }

    playTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current || requestId !== playRequestRef.current || !isActive || hasError) return;

      try {
        if (player?.status === 'readyToPlay') {
          player.play();
        }
      } catch (error) {
        console.log('Feed video play failed:', error);
        setHasError(true);
      }
    }, 120);
  }, [hasError, isActive, player]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      playRequestRef.current += 1;

      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }

      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener('statusChange', payload => {
      const status = payload?.status || player.status;
      setIsBuffering(status === 'loading' || status === 'idle');

      if (status === 'error') {
        setHasError(true);
      }

      if (status === 'readyToPlay' && isActive && !hasError) {
        playSafely();
      }
    });

    return () => subscription.remove();
  }, [hasError, isActive, playSafely, player]);

  useEffect(() => {
    if (isActive && !hasError) {
      playSafely();
    } else {
      playRequestRef.current += 1;
      pauseSafely();
    }

    return () => {
      playRequestRef.current += 1;
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [hasError, isActive, pauseSafely, playSafely, player]);

  const showFeedbackIcon = useCallback((icon: 'play' | 'pause') => {
    setFeedbackIcon(icon);

    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackIcon(null);
    }, 650);
  }, []);

  const togglePlay = useCallback(() => {
    try {
      if (player?.playing) {
        player.pause();
        showFeedbackIcon('pause');
      } else if (player?.status === 'readyToPlay' && !hasError) {
        player.play();
        showFeedbackIcon('play');
      }
    } catch (error) {
      console.log('Feed video toggle failed:', error);
      setHasError(true);
    }
  }, [hasError, player, showFeedbackIcon]);

  const handlePress = () => {
    const now = Date.now();

    if (now - lastTapRef.current < 300) {
      onDoubleTap();
    } else {
      togglePlay();
    }

    lastTapRef.current = now;
  };

  return (
    <Pressable className="absolute inset-0" onPress={handlePress}>
      {isImageThumbnail(thumbnailUrl) ? (
        <Image source={{ uri: thumbnailUrl }} className="absolute inset-0" style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <FeedFallback showSpinner={isBuffering && !hasFirstFrame && !hasError} />
      )}
      <VideoView
        player={player}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%', opacity: hasFirstFrame ? 1 : 0 }}
        nativeControls={false}
        contentFit="cover"
        onFirstFrameRender={() => {
          setHasFirstFrame(true);
          setIsBuffering(false);
        }}
      />
      {isBuffering && !hasError && !hasFirstFrame && isImageThumbnail(thumbnailUrl) && (
        <View className="absolute inset-0 items-center justify-center bg-black/20">
          <ActivityIndicator size="large" color="#98FF2F" />
        </View>
      )}
      {hasError && (
        <View className="absolute inset-0 items-center justify-center bg-black/70 px-8">
          <Ionicons name="alert-circle-outline" size={34} color="#98FF2F" />
          <Text className="text-white text-center text-sm font-inter-semibold mt-3">Video could not play</Text>
        </View>
      )}
      {feedbackIcon && (
        <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
          <View className="w-20 h-20 rounded-full bg-black/45 items-center justify-center">
            <Ionicons name={feedbackIcon} size={42} color="#FFF" />
          </View>
        </View>
      )}
    </Pressable>
  );
}

export const FeedItem = memo(({
  type,
  source,
  thumbnailUrl,
  user,
  description,
  date,
  stats,
  isActive,
  shouldMountVideo = true
}: FeedItemProps) => {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [shouldRenderVideo, setShouldRenderVideo] = useState(shouldMountVideo);
  const lastTap = useRef(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setIsLiked(true);
    }
    lastTap.current = now;
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (shouldMountVideo) {
      timer = setTimeout(() => {
        setShouldRenderVideo(true);
      }, 0);
    } else {
      timer = setTimeout(() => {
        setShouldRenderVideo(false);
      }, 350);
    }

    return () => clearTimeout(timer);
  }, [shouldMountVideo]);

  return (
    <View style={{ height, width }} className="">

      {type === 'video' ? (
        shouldRenderVideo ? (
          <FeedVideo source={source} thumbnailUrl={thumbnailUrl} isActive={isActive && shouldMountVideo} onDoubleTap={handleDoubleTap} />
        ) : (
          <View className="absolute inset-0">
            {isImageThumbnail(thumbnailUrl) ? (
              <Image source={{ uri: thumbnailUrl }} className="absolute inset-0" style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <FeedFallback />
            )}
          </View>
        )
      ) : type === 'image' ? (
        <Pressable className="absolute inset-0" onPress={handleDoubleTap}>
          <Image
            source={{ uri: source }}
            className="absolute inset-0"
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </Pressable>
      ) : (
        <View className="absolute inset-0 bg-black" />
      )}

      {/* Top Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.5)', 'transparent']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '25%', paddingTop: insets.top }}
        pointerEvents="none"
      />

      {/* Bottom Gradient Overlay for text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 0.85, 1]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '35%' }}
        pointerEvents="none"
      />


      {/* Right Action Buttons */}
      <View className="absolute right-4 items-center gap-5" style={{ bottom: insets.bottom + 100 }}>
        <Pressable className="items-center justify-center" onPress={() => setIsLiked(!isLiked)}>
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#E4FB52" : "#FFF"} style={{ textShadowColor: 'rgba(255,255,255,0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }} />
          <Text className="text-white text-xs font-semibold mt-1" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{stats.likes}</Text>
        </Pressable>

        <Pressable className="items-center justify-center">
          <Ionicons name="chatbubble-ellipses" size={24} color="#FFF" />
          <Text className="text-white text-xs font-semibold mt-1" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{stats.comments}</Text>
        </Pressable>

        <Pressable className="items-center justify-center" onPress={() => setIsSaved(!isSaved)}>
          <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isSaved ? "#FFF" : "#FFF"} style={isSaved ? { textShadowColor: 'rgba(255,255,255,0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 } : undefined} />
          <Text className="text-white text-xs font-semibold mt-1" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{stats.bookmarks}</Text>
        </Pressable>

        <Pressable className="items-center justify-center">
          <Ionicons name="arrow-redo" size={24} color="#FFF" />
          <Text className="text-white text-xs font-semibold mt-1" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{stats.shares}</Text>
        </Pressable>
        <Pressable className="items-center justify-center">
          <Ionicons name="volume-high-outline" size={24} color="#FFF" />
         
        </Pressable>


      </View>

      {/* Centered Full Screen Button */}
      {!isExpanded && (
        <View className="absolute left-0 right-0 items-center pointer-events-auto" style={{ bottom: insets.bottom + 130 }}>
          <Pressable className="flex-row items-center bg-black/50 px-3 py-1.5 rounded-2xl">
            <Ionicons name="scan-outline" size={16} color="#FFF" />
            <Text className="text-white ml-1.5 text-xs font-medium">Full screen</Text>
          </Pressable>
        </View>
      )}

      {/* Bottom Text Details */}
      <View className="absolute left-4 right-20 pb-2" style={{ bottom: insets.bottom + 60 }} pointerEvents="box-none">

        <View className="flex-row items-center mb-2">
          <Image
            source={{ uri: user.profileImage }}
            className="w-9 h-9 rounded-full border border-white"
            style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'white' }}
          />
          <View className="flex-1 ml-2.5">
            <View className="flex-row items-center flex-wrap">
              <Text
                className="text-white text-base font-bold"
                style={{ textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
              >
                {user.username}
              </Text>
              <Text className="text-[#CCC] text-sm font-normal"> • {date}</Text>
            </View>
          </View>
          <Pressable
            className={`px-3 py-1.5 rounded-full border ${isFollowing ? 'bg-white/10 border-white/40' : 'bg-[#98FF2F] border-[#98FF2F]'}`}
            onPress={() => setIsFollowing(!isFollowing)}
          >
            <Text className={`text-xs font-inter-bold ${isFollowing ? 'text-white' : 'text-black'}`}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={() => setIsExpanded(!isExpanded)}>
          <Text
            className="text-white text-sm leading-5"
            style={{ textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
          >
            {isExpanded || description.length <= 85 ? description : `${description.substring(0, 85)}...`}
            {!isExpanded && description.length > 85 && (
              <Text className="text-[#CCC] font-bold"> more</Text>
            )}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

FeedItem.displayName = 'FeedItem';
