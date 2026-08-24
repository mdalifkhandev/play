import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Component, memo, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Pressable, Share, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { handleApiError } from '../../api/client';
import { createReelComment, deleteComment, editComment, likeReel, listReelComments, saveReel, shareReel, unlikeReel, unsaveReel } from '../../api/engagement/engagement.api';
import type { ReelComment } from '../../api/engagement/engagement.types';
import { followUser, getFollowState, unfollowUser } from '../../api/profile/profile.api';
import { recordReelView } from '../../api/reels/reels.api';
import { ReportSheet } from '../moderation/ReportSheet';
import { useAppStore } from '../../store';
import { avatarSource } from '../../utils/avatar';

export interface FeedItemProps {
  id: string;
  type: 'video' | 'image';
  source: string;
  thumbnailUrl?: string;
  user: {
    id: string;
    username: string;
    profileImage: string;
    isPremium?: boolean;
  };
  description: string;
  date: string;
  stats: {
    likes: number;
    comments: number;
    bookmarks: number;
    shares: number;
    views: number;
  };
  viewerState?: {
    isLiked: boolean;
    isSaved: boolean;
  } | null;
  edit?: {
    filter?: string | null;
    effect?: string | null;
    overlayText?: {
      text: string;
      x: number;
      y: number;
      fontSize: number;
    } | null;
  } | null;
  isActive: boolean;
  shouldMountVideo?: boolean;
  isFullscreen?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

const isRemoteUri = (source: string) => /^https?:\/\//i.test(source);
const isImageThumbnail = (source?: string) => !!source && !/\.(mp4|mov|m4v|webm)(\?|$)/i.test(source);
const recordedViewIds = new Set<string>();
let isReelViewEndpointAvailable = true;
const DESCRIPTION_PREVIEW_LENGTH = 48;

function mediaFilterOverlay(filter?: string | null): string {
  const key = (filter || '').toLowerCase();
  if (key === 'vivid') return 'rgba(255, 50, 50, 0.15)';
  if (key === 'mono' || key === 'grayscale') return 'rgba(0, 0, 0, 0.45)';
  if (key === 'vintage') return 'rgba(112, 66, 20, 0.3)';
  if (key === 'warm') return 'rgba(255, 165, 0, 0.2)';
  if (key === 'cool') return 'rgba(40, 140, 255, 0.18)';
  if (key === 'sepia') return 'rgba(112, 66, 20, 0.35)';
  return 'transparent';
}

class FeedVideoBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.log('Feed video render failed:', error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function formatCount(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(Math.max(0, value));
}

function FeedFallback({
  showSpinner = false,
  showPlayIcon = true,
}: {
  showSpinner?: boolean;
  showPlayIcon?: boolean;
}) {
  return (
    <View className="absolute inset-0 items-center justify-center bg-[#111]">
      {showPlayIcon && <Ionicons name="play-circle-outline" size={48} color="#98FF2F" />}
      {showSpinner && <ActivityIndicator size="small" color="#98FF2F" className="mt-4" />}
    </View>
  );
}

function CommentsModal({
  reelId,
  visible,
  onClose,
  onCommentCountChange,
  onCommentCountSet,
}: {
  reelId: string;
  visible: boolean;
  onClose: () => void;
  onCommentCountChange: (nextCount: number) => void;
  onCommentCountSet: (nextCount: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const currentUser = useAppStore(state => state.user);
  const currentUserId = currentUser?.id || currentUser?._id;
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const loadComments = useCallback(async (cursor?: string) => {
    if (!visible || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const result = await listReelComments(reelId, cursor);
      setComments(previous => cursor ? [...previous, ...result.items] : result.items);
      setNextCursor(result.nextCursor);
      if (!cursor && typeof result.totalCount === 'number') {
        onCommentCountSet(result.totalCount);
      }
    } catch (error) {
      toast.error(handleApiError(error, 'Failed to load comments'));
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [onCommentCountSet, reelId, visible]);

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      setComments([]);
      setNextCursor(null);
      setText('');
      setEditingId(null);
      setPendingDeleteId(null);
      if (!isLoadingRef.current) {
        isLoadingRef.current = true;
        setIsLoading(true);
        listReelComments(reelId)
          .then(result => {
            setComments(result.items);
            setNextCursor(result.nextCursor);
            if (typeof result.totalCount === 'number') {
              onCommentCountSet(result.totalCount);
            }
          })
          .catch(error => {
            toast.error(handleApiError(error, 'Failed to load comments'));
          })
          .finally(() => {
            isLoadingRef.current = false;
            setIsLoading(false);
          });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [onCommentCountSet, reelId, visible]);

  const submitComment = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      if (editingId) {
        const updated = await editComment(editingId, trimmed);
        setComments(previous => previous.map(comment => comment.id === editingId ? updated : comment));
        setEditingId(null);
      } else {
        const created = await createReelComment(reelId, trimmed);
        setComments(previous => [created, ...previous]);
        onCommentCountChange(1);
      }
      setText('');
    } catch (error) {
      toast.error(handleApiError(error, editingId ? 'Failed to edit comment' : 'Failed to post comment'));
    } finally {
      setIsSending(false);
    }
  };

  const startEdit = (comment: ReelComment) => {
    setEditingId(comment.id);
    setText(comment.text);
  };

  const removeComment = async () => {
    const commentId = pendingDeleteId;
    if (!commentId) return;

    const previous = comments;
    setPendingDeleteId(null);
    setComments(current => current.filter(comment => comment.id !== commentId));
    onCommentCountChange(-1);

    try {
      await deleteComment(commentId);
    } catch (error) {
      setComments(previous);
      onCommentCountChange(1);
      toast.error(handleApiError(error, 'Failed to delete comment'));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={0}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="max-h-[68%] rounded-t-3xl bg-[#121212] px-4 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-white text-lg font-inter-bold">Comments</Text>
            <Pressable onPress={onClose} className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
              <Ionicons name="close" size={20} color="#FFF" />
            </Pressable>
          </View>

          <FlatList
            data={comments}
            keyExtractor={item => item.id}
            className="min-h-[220px]"
            keyboardShouldPersistTaps="handled"
            onEndReached={() => nextCursor && loadComments(nextCursor)}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <View className="h-[180px] items-center justify-center">
                {isLoading ? <ActivityIndicator color="#98FF2F" /> : <Text className="text-gray-400">No comments yet</Text>}
              </View>
            }
            renderItem={({ item }) => {
              const isOwnComment = currentUserId && item.authorId === currentUserId;

              return (
                <View className="mb-4 flex-row">
                  <Image
                    source={avatarSource(item.authorAvatar)}
                    style={{ width: 34, height: 34, borderRadius: 17 }}
                    contentFit="cover"
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-white text-sm font-inter-semibold">{item.authorName || 'User'}</Text>
                    <Text className="mt-1 text-gray-200 text-sm">{item.text}</Text>
                    <View className="mt-2 flex-row gap-4">
                      {isOwnComment ? (
                        <>
                          <Pressable onPress={() => startEdit(item)}>
                            <Text className="text-[#98FF2F] text-xs font-inter-semibold">Edit</Text>
                          </Pressable>
                          <Pressable onPress={() => setPendingDeleteId(item.id)}>
                            <Text className="text-red-400 text-xs font-inter-semibold">Delete</Text>
                          </Pressable>
                        </>
                      ) : (
                        <Pressable onPress={() => setReportCommentId(item.id)}>
                          <Text className="text-red-400 text-xs font-inter-semibold">Report</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />

          <View className="mt-3 flex-row items-center gap-2">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={editingId ? 'Edit comment...' : 'Add a comment...'}
              placeholderTextColor="#777"
              className="flex-1 rounded-full bg-white/10 px-4 py-3 text-white"
              multiline
              blurOnSubmit={false}
              returnKeyType="send"
              onSubmitEditing={submitComment}
            />
            <Pressable
              disabled={!text.trim() || isSending}
              onPressIn={submitComment}
              className={`h-11 w-11 items-center justify-center rounded-full ${text.trim() && !isSending ? 'bg-[#98FF2F]' : 'bg-white/10'}`}
            >
              {isSending ? <ActivityIndicator color="#000" size="small" /> : <Ionicons name="send" size={18} color={text.trim() ? '#000' : '#777'} />}
            </Pressable>
          </View>

          {pendingDeleteId && (
            <View className="absolute inset-0 items-center justify-center bg-black/55 px-6">
              <View className="w-full rounded-2xl bg-[#1C1C1E] p-5">
                <Text className="text-white text-lg font-inter-bold text-center">Delete comment?</Text>
                <Text className="mt-2 text-center text-gray-400 text-sm">This comment will be removed from the conversation.</Text>
                <View className="mt-5 flex-row gap-3">
                  <Pressable
                    className="flex-1 rounded-xl bg-white/10 py-3 items-center"
                    onPress={() => setPendingDeleteId(null)}
                  >
                    <Text className="text-white font-inter-semibold">Cancel</Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 rounded-xl bg-red-500 py-3 items-center"
                    onPress={removeComment}
                  >
                    <Text className="text-white font-inter-semibold">Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </View>
        <ReportSheet
          visible={Boolean(reportCommentId)}
          targetType="comment"
          targetId={reportCommentId || undefined}
          title="Report comment"
          onClose={() => setReportCommentId(null)}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

type ShareChannel = 'profile' | 'other';

function ShareOptionsSheet({
  visible,
  isSharing,
  onClose,
  onSelect,
}: {
  visible: boolean;
  isSharing: boolean;
  onClose: () => void;
  onSelect: (channel: ShareChannel) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/55" onPress={onClose}>
        <Pressable
          className="rounded-t-3xl bg-[#151515] px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom + 12, 24) }}
          onPress={(event) => event.stopPropagation()}
        >
          <View className="mb-5 h-1 w-12 self-center rounded-full bg-white/25" />
          <Text className="text-white text-lg font-inter-bold">Share reel</Text>
          <Text className="mt-1 text-gray-400 text-sm">Where do you want to share this?</Text>

          <View className="mt-5 gap-3">
            <Pressable
              disabled={isSharing}
              onPress={() => onSelect('profile')}
              className="flex-row items-center rounded-2xl bg-white/10 px-4 py-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-[#98FF2F]">
                <Ionicons name="person-circle-outline" size={24} color="#000" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white text-base font-inter-semibold">Share to my profile</Text>
                <Text className="text-gray-400 text-xs">Post this reel share on your profile.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#777" />
            </Pressable>

            <Pressable
              disabled={isSharing}
              onPress={() => onSelect('other')}
              className="flex-row items-center rounded-2xl bg-white/10 px-4 py-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Ionicons name="share-social-outline" size={22} color="#FFF" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white text-base font-inter-semibold">Share somewhere else</Text>
                <Text className="text-gray-400 text-xs">Open your phone share options.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#777" />
            </Pressable>
          </View>

          <Pressable
            disabled={isSharing}
            onPress={onClose}
            className="mt-4 h-12 items-center justify-center rounded-2xl bg-white/10"
          >
            {isSharing ? <ActivityIndicator color="#98FF2F" /> : <Text className="text-white font-inter-semibold">Cancel</Text>}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FeedVideo({
  source,
  thumbnailUrl,
  isActive,
  isMuted,
  shouldMountVideo,
  onDoubleTap,
  onPlaybackUpdate,
  onBufferingChange,
}: {
  source: string;
  thumbnailUrl?: string;
  isActive: boolean;
  isMuted: boolean;
  shouldMountVideo?: boolean;
  onDoubleTap: () => void;
  onPlaybackUpdate?: (currentTime: number, duration: number) => void;
  onBufferingChange?: (isBuffering: boolean, hasFirstFrame: boolean, hasError: boolean) => void;
}) {
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasFirstFrame, setHasFirstFrame] = useState(false);
  const [hasError, setHasError] = useState(!source);
  const [feedbackIcon, setFeedbackIcon] = useState<'play' | 'pause' | null>(null);
  const playRequestRef = useRef(0);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstFrameFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const lastTapRef = useRef(0);

  const videoSource = useMemo(() => {
    if (!shouldMountVideo) return null;
    if (!source) return null;
    return isRemoteUri(source) ? { uri: source, contentType: 'progressive' as const } : source;
  }, [source, shouldMountVideo]);

  const player = useVideoPlayer(videoSource, currentPlayer => {
    if (!currentPlayer) return;
    currentPlayer.loop = true;
    currentPlayer.muted = isMuted;
  });

  useEffect(() => {
    setIsBuffering(true);
    setHasFirstFrame(false);
    setHasError(!source);
    onBufferingChange?.(true, false, !source);
  }, [source, onBufferingChange]);

  useEffect(() => {
    try {
      // expo-video exposes mutable playback controls on the player instance.
      // eslint-disable-next-line react-hooks/immutability
      player.muted = isMuted;
    } catch (error) {
      console.log('Feed video mute toggle failed:', error);
    }
  }, [isMuted, player]);

  useEffect(() => {
    if (!player) return;

    try {
      // eslint-disable-next-line react-hooks/immutability
      player.timeUpdateEventInterval = isActive ? 0.25 : 0;
    } catch (error) {
      console.log('Feed video progress interval failed:', error);
    }

    if (!isActive) {
      onPlaybackUpdate?.(0, 0);
    }

    return () => {
      try {
        // eslint-disable-next-line react-hooks/immutability
        player.timeUpdateEventInterval = 0;
      } catch {
        // Player may already be released while scrolling away.
      }
    };
  }, [isActive, onPlaybackUpdate, player]);

  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener('timeUpdate', payload => {
      onPlaybackUpdate?.(payload.currentTime, player.duration || 0);
    });

    return () => subscription.remove();
  }, [onPlaybackUpdate, player]);

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

      if (firstFrameFallbackTimerRef.current) {
        clearTimeout(firstFrameFallbackTimerRef.current);
        firstFrameFallbackTimerRef.current = null;
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
        if (!firstFrameFallbackTimerRef.current) {
          firstFrameFallbackTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setHasFirstFrame(true);
              setIsBuffering(false);
              onBufferingChange?.(false, true, hasError);
            }
          }, 350);
        }
        playSafely();
      }
      
      onBufferingChange?.(
        status === 'loading' || status === 'idle', 
        hasFirstFrame, 
        status === 'error' ? true : hasError
      );
    });

    return () => subscription.remove();
  }, [hasError, isActive, playSafely, player, hasFirstFrame, onBufferingChange]);

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
      if (firstFrameFallbackTimerRef.current) {
        clearTimeout(firstFrameFallbackTimerRef.current);
        firstFrameFallbackTimerRef.current = null;
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
      {!hasFirstFrame && isImageThumbnail(thumbnailUrl) ? (
        <Image source={{ uri: thumbnailUrl }} className="absolute inset-0" style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        hasError ? <FeedFallback showSpinner={false} showPlayIcon /> : null
      )}
      {shouldMountVideo && player ? (
        <VideoView
          player={player}
          className="absolute inset-0"
          style={{ width: '100%', height: '100%', opacity: hasError ? 0 : 1 }}
          nativeControls={false}
          contentFit="cover"
          surfaceType="textureView"
          useExoShutter={false}
          onFirstFrameRender={() => {
            if (firstFrameFallbackTimerRef.current) {
              clearTimeout(firstFrameFallbackTimerRef.current);
              firstFrameFallbackTimerRef.current = null;
            }
            setHasFirstFrame(true);
            setIsBuffering(false);
            onBufferingChange?.(false, true, hasError);
          }}
        />
      ) : null}
      {hasError && (
        <View className="absolute inset-0 items-center justify-center bg-black/70 px-8">
          <Ionicons name="alert-circle-outline" size={34} color="#98FF2F" />
          <Text className="text-white text-center text-sm font-inter-semibold mt-3">Video could not play</Text>
        </View>
      )}
      {feedbackIcon && (
        <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
          <Ionicons name={`${feedbackIcon}-circle-outline`} size={64} color="#98FF2F" />
        </View>
      )}
    </Pressable>
  );
}

export const FeedItem = memo(({
  id,
  type,
  source,
  thumbnailUrl,
  user,
  description,
  date,
  stats,
  viewerState,
  edit,
  isActive,
  shouldMountVideo = true,
  isFullscreen = false,
  onFullscreenChange,
}: FeedItemProps) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const currentUser = useAppStore(state => state.user);
  const currentUserId = currentUser?.id || currentUser?._id;
  const isOwnReel = Boolean(currentUserId && user.id === currentUserId);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(viewerState?.isLiked ?? false);
  const [isSaved, setIsSaved] = useState(viewerState?.isSaved ?? false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowStateLoaded, setIsFollowStateLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [likeCount, setLikeCount] = useState(stats.likes);
  const [commentCount, setCommentCount] = useState(stats.comments);
  const [bookmarkCount, setBookmarkCount] = useState(stats.bookmarks);
  const [shareCount, setShareCount] = useState(stats.shares);
  const [playbackTime, setPlaybackTime] = useState({ currentTime: 0, duration: 0 });
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<'like' | 'save' | 'share' | 'follow' | null>(null);
  const [shouldRenderVideo, setShouldRenderVideo] = useState(false);
  
  // State for bubbling up buffering to render spinner above everything
  const [videoBufferingState, setVideoBufferingState] = useState({
    isBuffering: true,
    hasFirstFrame: false,
    hasError: false
  });

  const lastTap = useRef(0);
  const collapsedDescription = useMemo(() => description.replace(/\s+/g, ' ').trim(), [description]);
  const shouldShowMore = collapsedDescription.length > DESCRIPTION_PREVIEW_LENGTH;
  const feedFilterOverlay = mediaFilterOverlay(edit?.filter);
  const feedEffectKey = (edit?.effect || '').toLowerCase();
  const feedOverlayText = edit?.overlayText;
  const shouldHideDescription = Boolean(feedOverlayText?.text?.trim());
  const playbackProgress = playbackTime.duration > 0
    ? Math.min(1, Math.max(0, playbackTime.currentTime / playbackTime.duration))
    : 0;

  const handlePlaybackUpdate = useCallback((currentTime: number, duration: number) => {
    setPlaybackTime(prev => {
      const newCurrentTime = Number.isFinite(currentTime) ? currentTime : 0;
      const newDuration = Number.isFinite(duration) ? duration : 0;
      if (prev.currentTime === newCurrentTime && prev.duration === newDuration) return prev;
      return { currentTime: newCurrentTime, duration: newDuration };
    });
  }, []);

  const handleBufferingChange = useCallback((isBuffering: boolean, hasFirstFrame: boolean, hasError: boolean) => {
    setVideoBufferingState(prev => {
      if (prev.isBuffering === isBuffering && prev.hasFirstFrame === hasFirstFrame && prev.hasError === hasError) return prev;
      return { isBuffering, hasFirstFrame, hasError };
    });
  }, []);

  const handleLike = useCallback(async () => {
    if (busyAction === 'like') return;

    const nextLiked = !isLiked;
    const previousLiked = isLiked;
    const previousCount = likeCount;
    setBusyAction('like');
    setIsLiked(nextLiked);
    setLikeCount(current => Math.max(0, current + (nextLiked ? 1 : -1)));

    try {
      const result = nextLiked ? await likeReel(id) : await unlikeReel(id);
      if (typeof result.likeCount === 'number') setLikeCount(result.likeCount);
      if (typeof result.isLiked === 'boolean') setIsLiked(result.isLiked);
    } catch (error) {
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      toast.error(handleApiError(error, nextLiked ? 'Failed to like reel' : 'Failed to unlike reel'));
    } finally {
      setBusyAction(null);
    }
  }, [busyAction, id, isLiked, likeCount]);

  const handleSave = useCallback(async () => {
    if (busyAction === 'save') return;

    const nextSaved = !isSaved;
    const previousSaved = isSaved;
    const previousCount = bookmarkCount;
    setBusyAction('save');
    setIsSaved(nextSaved);
    setBookmarkCount(current => Math.max(0, current + (nextSaved ? 1 : -1)));

    try {
      const result = nextSaved ? await saveReel(id) : await unsaveReel(id);
      if (typeof result.isSaved === 'boolean') setIsSaved(result.isSaved);
    } catch (error) {
      setIsSaved(previousSaved);
      setBookmarkCount(previousCount);
      toast.error(handleApiError(error, nextSaved ? 'Failed to save reel' : 'Failed to unsave reel'));
    } finally {
      setBusyAction(null);
    }
  }, [bookmarkCount, busyAction, id, isSaved]);

  const handleFollowToggle = useCallback(async () => {
    if (busyAction === 'follow' || !user.id || isOwnReel) return;

    const nextFollowing = !isFollowing;
    const previousFollowing = isFollowing;
    setBusyAction('follow');
    setIsFollowing(nextFollowing);

    try {
      const result = nextFollowing ? await followUser(user.id) : await unfollowUser(user.id);
      setIsFollowing(result.isFollowing);
      setIsFollowStateLoaded(true);
    } catch (error) {
      setIsFollowing(previousFollowing);
      toast.error(handleApiError(error, nextFollowing ? 'Failed to follow user' : 'Failed to unfollow user'));
    } finally {
      setBusyAction(null);
    }
  }, [busyAction, isFollowing, isOwnReel, user.id]);

  const handleShare = useCallback(async (channel: ShareChannel) => {
    if (busyAction === 'share') return;

    const previousCount = shareCount;
    setBusyAction('share');
    setShareCount(current => current + 1);

    try {
      if (channel === 'other') {
        await Share.share({
          message: description ? `${description}\n${source}` : source,
          url: source,
        });
      }

      const result = await shareReel(id, channel);
      if (typeof result.shareCount === 'number') setShareCount(result.shareCount);
      setIsShareSheetOpen(false);
      toast.success(channel === 'profile' ? 'Shared to your profile' : 'Share counted');
    } catch (error) {
      setShareCount(previousCount);
      toast.error(handleApiError(error, 'Failed to share reel'));
    } finally {
      setBusyAction(null);
    }
  }, [busyAction, description, id, shareCount, source]);

  const handleCommentCountChange = useCallback((delta: number) => {
    setCommentCount(current => Math.max(0, current + delta));
  }, []);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!isLiked) {
        void handleLike();
      }
    }
    lastTap.current = now;
  }, [handleLike, isLiked]);

  const handleOpenUserProfile = useCallback(() => {
    if (!user.id) return;
    router.push({
      pathname: '/screens/user/[id]',
      params: { id: user.id },
    } as never);
  }, [router, user.id]);

  useEffect(() => {
    setIsExpanded(false);
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    setIsFollowing(false);
    setIsFollowStateLoaded(false);

    if (!user.id || isOwnReel) {
      setIsFollowStateLoaded(true);
      return () => {
        cancelled = true;
      };
    }

    getFollowState(user.id)
      .then(result => {
        if (cancelled) return;
        setIsFollowing(result.isFollowing);
      })
      .catch(error => {
        if (cancelled) return;
        console.log('Feed follow state failed:', handleApiError(error, 'Failed to load follow state'));
      })
      .finally(() => {
        if (!cancelled) {
          setIsFollowStateLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOwnReel, user.id]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (shouldMountVideo) {
      timer = setTimeout(() => {
        setShouldRenderVideo(true);
      }, 220);
    } else {
      setShouldRenderVideo(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [shouldMountVideo]);

  useEffect(() => {
    if (
      type !== 'video' ||
      !isActive ||
      !shouldMountVideo ||
      !isReelViewEndpointAvailable ||
      recordedViewIds.has(id)
    ) return;

    const timer = setTimeout(() => {
      if (recordedViewIds.has(id)) return;

      recordedViewIds.add(id);
      void recordReelView(id)
        .catch(error => {
          if (error?.response?.status === 404) {
            isReelViewEndpointAvailable = false;
            return;
          }
          console.log('Record reel view failed:', handleApiError(error, 'Failed to record reel view'));
        });
    }, 3000);

    return () => clearTimeout(timer);
  }, [id, isActive, shouldMountVideo, type]);

  return (
    <View style={{ height, width }} className="">

      {type === 'video' ? (
        shouldRenderVideo ? (
          <FeedVideoBoundary fallback={<FeedFallback showSpinner={false} showPlayIcon />}>
            <FeedVideo
              source={source}
              thumbnailUrl={thumbnailUrl}
              isActive={isActive && shouldMountVideo}
              isMuted={isMuted}
              shouldMountVideo={shouldMountVideo}
              onDoubleTap={handleDoubleTap}
              onPlaybackUpdate={handlePlaybackUpdate}
              onBufferingChange={handleBufferingChange}
            />
          </FeedVideoBoundary>
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

      {feedEffectKey === 'glitch' && (
        <View className="absolute inset-0" pointerEvents="none">
          <View className="absolute inset-0 bg-red-500/10" style={{ transform: [{ translateX: -3 }] }} />
          <View className="absolute inset-0 bg-blue-500/10" style={{ transform: [{ translateX: 3 }] }} />
        </View>
      )}

      {feedEffectKey === 'flash' && (
        <View className="absolute inset-0 bg-white/35" pointerEvents="none" />
      )}

      {feedEffectKey === 'vhs' && (
        <View className="absolute inset-0 bg-green-500/10 border-t-2 border-black/20" pointerEvents="none" />
      )}

      {feedEffectKey === 'sparkle' && (
        <View className="absolute inset-0" pointerEvents="none">
          <View className="absolute left-1/4 top-1/4">
            <Ionicons name="sparkles" size={24} color="#FFF" />
          </View>
          <View className="absolute right-1/4 top-1/2">
            <Ionicons name="sparkles" size={32} color="#FFF" />
          </View>
          <View className="absolute bottom-1/4 left-1/3">
            <Ionicons name="sparkles" size={16} color="#FFF" />
          </View>
        </View>
      )}

      {feedFilterOverlay !== 'transparent' && (
        <View className="absolute inset-0" pointerEvents="none" style={{ backgroundColor: feedFilterOverlay }} />
      )}



      {!isFullscreen && (
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.5)', 'transparent']}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '25%', paddingTop: insets.top }}
          pointerEvents="none"
        />
      )}

      {/* Bottom Gradient Overlay for text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 0.85, 1]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '35%' }}
        pointerEvents="none"
      />

      {type === 'video' && (
        <View
          className="absolute left-0 right-0"
          style={{ bottom: isFullscreen ? insets.bottom + 12 : insets.bottom + 63 }}
          pointerEvents="none"
        >
          <View className="h-1 overflow-hidden bg-white/25">
            <View
              className="h-full bg-[#98FF2F]"
              style={{ width: `${playbackProgress * 100}%` }}
            />
          </View>
        </View>
      )}


      {/* Right Action Buttons */}
      {!isFullscreen && (
      <View className="absolute right-4 items-center gap-5" style={{ bottom: insets.bottom + 100 }}>
        <Pressable className="items-center justify-center" onPress={handleLike} disabled={busyAction === 'like'}>
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#E4FB52" : "#FFF"} style={{ textShadowColor: 'rgba(255,255,255,0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }} />
          <Text className="text-white text-xs font-semibold mt-1" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{formatCount(likeCount)}</Text>
        </Pressable>

        <Pressable className="items-center justify-center" onPress={() => setIsCommentsOpen(true)}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FFF" />
          <Text className="text-white text-xs font-semibold mt-1" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{formatCount(commentCount)}</Text>
        </Pressable>

        <Pressable className="items-center justify-center" onPress={handleSave} disabled={busyAction === 'save'}>
          <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isSaved ? "#FFF" : "#FFF"} style={isSaved ? { textShadowColor: 'rgba(255,255,255,0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 } : undefined} />
          <Text className="text-white text-xs font-semibold mt-1" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{formatCount(bookmarkCount)}</Text>
        </Pressable>

        <Pressable className="items-center justify-center" onPress={() => setIsShareSheetOpen(true)} disabled={busyAction === 'share'}>
          <Ionicons name="arrow-redo-outline" size={24} color="#FFF" />
          <Text className="text-white text-xs font-semibold mt-1" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{formatCount(shareCount)}</Text>
        </Pressable>
        {!isOwnReel && (
          <Pressable className="items-center justify-center" onPress={() => setIsReportSheetOpen(true)}>
            <Ionicons name="flag-outline" size={24} color="#FFF" />
          </Pressable>
        )}
        <Pressable className="items-center justify-center" onPress={() => setIsMuted(!isMuted)}>
          <Ionicons name={isMuted ? "volume-mute-outline" : "volume-high-outline"} size={24} color="#FFF" />
         
        </Pressable>


      </View>
      )}

      {/* Centered Full Screen Button */}
      {!isExpanded && (
        <View className="absolute left-0 right-0 items-center pointer-events-auto" style={{ bottom: insets.bottom + 155 }}>
          <Pressable className="flex-row items-center bg-black/50 px-3 py-1.5 rounded-2xl" onPress={() => onFullscreenChange?.(!isFullscreen)}>
            <Ionicons name={isFullscreen ? "contract-outline" : "scan-outline"} size={16} color="#FFF" />
            <Text className="text-white ml-1.5 text-xs font-medium">{isFullscreen ? 'Back' : 'Full screen'}</Text>
          </Pressable>
        </View>
      )}

      {/* Bottom Text Details */}
      <View className={`absolute left-4 pb-2 ${isFullscreen ? 'right-4' : 'right-20'}`} style={{ bottom: insets.bottom + 60 }} pointerEvents="box-none">

        <View className="flex-row items-center mb-2">
          <Pressable className="flex-1 flex-row items-center" onPress={handleOpenUserProfile}>
            <Image
              source={avatarSource(user.profileImage)}
              className="w-9 h-9 rounded-full border border-white"
              style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'white' }}
            />
            <View className="flex-1 ml-2.5">
              <View className="flex-row items-center">
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  className="text-white text-base font-bold flex-shrink"
                  style={{ textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
                >
                  {user.username}
                </Text>
                {user.isPremium && (
                  <View className="ml-1.5 h-5 w-5 rounded-full bg-[#A3E635] items-center justify-center border border-black/40">
                    <MaterialCommunityIcons name="crown" size={13} color="#0A0A0A" />
                  </View>
                )}
              </View>
              <Text numberOfLines={1} className="text-[#CCC] text-sm font-normal">{date}</Text>
            </View>
          </Pressable>
          {isFollowStateLoaded && !isOwnReel && (
            <Pressable
              className={`px-3 py-1.5 rounded-full border ${isFollowing ? 'bg-white/10 border-white/40' : 'bg-[#98FF2F] border-[#98FF2F]'}`}
              onPress={handleFollowToggle}
              disabled={busyAction === 'follow'}
            >
              <Text className={`text-xs font-inter-bold ${isFollowing ? 'text-white' : 'text-black'}`}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          )}
        </View>

        {description ? (
          <Pressable onPress={() => setIsExpanded(current => !current)}>
            <Text
              numberOfLines={isExpanded ? undefined : 2}
              className="text-white text-sm leading-5"
              style={{ textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
            >
              {isExpanded || !shouldShowMore
                ? description
                : `${collapsedDescription.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd()}... `}
              {!isExpanded && shouldShowMore && (
                <Text className="text-[#CCC] font-bold">more</Text>
              )}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {feedOverlayText?.text ? (
        <View
          className="absolute items-center"
          pointerEvents="none"
          style={{
            left: 24,
            right: 24,
            top: `${Math.max(8, Math.min(82, feedOverlayText.y * 100))}%`,
            zIndex: 20,
          }}
        >
          <Text
            className="text-white text-center font-inter-bold"
            style={{
              fontSize: Math.max(20, Math.min(42, feedOverlayText.fontSize || 36)),
              textShadowColor: 'rgba(0, 0, 0, 0.75)',
              textShadowOffset: { width: -1, height: 1 },
              textShadowRadius: 10,
            }}
          >
            {feedOverlayText.text}
          </Text>
        </View>
      ) : null}

      {/* Global Loading Spinner for the Video - Rendered on TOP of text */}
      {type === 'video' && videoBufferingState.isBuffering && !videoBufferingState.hasError && !videoBufferingState.hasFirstFrame && isImageThumbnail(thumbnailUrl) && (
        <View className="absolute inset-0 items-center justify-center bg-black/20" pointerEvents="none" style={{ zIndex: 9999, elevation: 100 }}>
          <ActivityIndicator size="large" color="#98FF2F" />
        </View>
      )}

      <CommentsModal
        reelId={id}
        visible={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        onCommentCountChange={handleCommentCountChange}
        onCommentCountSet={setCommentCount}
      />
      <ShareOptionsSheet
        visible={isShareSheetOpen}
        isSharing={busyAction === 'share'}
        onClose={() => setIsShareSheetOpen(false)}
        onSelect={handleShare}
      />
      <ReportSheet
        visible={isReportSheetOpen}
        targetType="reel"
        targetId={id}
        title="Report reel"
        onClose={() => setIsReportSheetOpen(false)}
      />
    </View>
  );
});

FeedItem.displayName = 'FeedItem';
