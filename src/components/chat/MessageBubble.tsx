import React from 'react';
import { Linking, Pressable, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { avatarSource } from '../../utils/avatar';

export interface MessageType {
  id: string;
  text: string;
  time: string;
  sender: 'me' | 'other';
  avatar?: string;
  attachmentType?: 'image' | 'video' | 'audio' | 'file';
  attachmentUrl?: string;
  isRead?: boolean;
}

function VideoMessage({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = true;
  });
  return (
    <View style={{ width: 238, height: 318, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' }}>
      <VideoView
        player={player}
        nativeControls
        style={{ width: 238, height: 318 }}
      />
    </View>
  );
}

function AudioMessage({ uri, isMe }: { uri: string; isMe: boolean }) {
  const playerRef = React.useRef<AudioPlayer | null>(null);
  const subscriptionRef = React.useRef<{ remove: () => void } | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    const progressTimer = setInterval(() => {
      const player = playerRef.current as any;
      if (!player) return;

      const nextCurrent = Number(player.currentTime ?? 0);
      const nextDuration = Number(player.duration ?? 0);
      if (Number.isFinite(nextCurrent)) setCurrentTime(Math.max(0, nextCurrent));
      if (Number.isFinite(nextDuration) && nextDuration > 0) setDuration(nextDuration);
    }, 350);

    return () => {
      clearInterval(progressTimer);
      const player = playerRef.current;
      playerRef.current = null;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      if (!player) return;

      try { player.pause(); } catch {}
      try { player.remove(); } catch {
        try { (player as any).release?.(); } catch {}
      }
    };
  }, []);

  const toggleAudio = () => {
    const currentPlayer = playerRef.current;

    if (currentPlayer && isPlaying) {
      try { currentPlayer.pause(); } catch {}
      setIsPlaying(false);
      return;
    }

    if (currentPlayer) {
      try {
        currentPlayer.play();
        setIsPlaying(true);
      } catch {}
      return;
    }

    try {
      setIsLoading(true);
      const player = createAudioPlayer(uri, { updateInterval: 250 });
      playerRef.current = player;
      subscriptionRef.current = player.addListener('playbackStatusUpdate', (status: any) => {
        if (playerRef.current !== player) return;

        if (status.isLoaded && status.playing) {
          setIsLoading(false);
          setIsPlaying(true);
        }

        if (status.didJustFinish) {
          setIsPlaying(false);
          setCurrentTime(0);
        }
      });
      player.play();
    } catch {
      setIsLoading(false);
      void Linking.openURL(uri);
    }
  };
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : isPlaying ? 0.2 : 0;
  const playedWidth = `${Math.max(3, progress * 100)}%` as const;

  return (
    <Pressable
      className="flex-row items-center rounded-xl px-3 py-2"
      style={{ width: 278, backgroundColor: isMe ? '#075E54' : '#A3E635' }}
      onPress={toggleAudio}
    >
      <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: '#FDB52A' }}>
        <Ionicons
          name={isLoading ? 'hourglass-outline' : isPlaying ? 'pause' : 'play'}
          size={22}
          color="#fff"
        />
      </View>
      <View className="ml-3 flex-1">
        <View className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: isMe ? '#62a99c' : '#5d8f18' }}>
          <View className="h-full rounded-full" style={{ width: playedWidth, backgroundColor: isMe ? '#d5fff7' : '#111' }} />
        </View>
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-xs" style={{ color: isMe ? '#d8fff7' : '#1b1b1b' }}>
            {formatDuration(currentTime)}
          </Text>
          <Text className="text-xs" style={{ color: isMe ? '#d8fff7' : '#1b1b1b' }}>
            {duration > 0 ? formatDuration(duration) : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function MessageBubble({ msg }: { msg: MessageType }) {
  const router = useRouter();
  const isMe = msg.sender === 'me';
  const hasAttachment = Boolean(msg.attachmentType && msg.attachmentUrl);
  const text = shouldRenderText(msg.text, msg.attachmentType) ? msg.text : '';
  const bubbleColor = isMe ? '#075E54' : '#A3E635';
  const textColor = isMe ? '#fff' : '#111';
  const timeColor = isMe ? '#c9ded9' : 'rgba(0,0,0,0.55)';
  const attachmentBubbleClass = msg.attachmentType === 'audio' || msg.attachmentType === 'file' ? 'p-0' : 'p-1';

  return (
    <View className={`flex-row mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
      {!isMe && (
        <View className="mr-2 justify-end pb-1 relative">
          <Image
            source={avatarSource(msg.avatar)}
            style={{ width: 32, height: 32, borderRadius: 16 }}
            contentFit="cover"
          />
          <View className="absolute bottom-1 right-0 w-2.5 h-2.5 bg-[#00C853] rounded-full border-2 border-[#0A0A0A]" />
        </View>
      )}

      <View
        className={`${hasAttachment ? attachmentBubbleClass : 'px-3 py-2'} rounded-2xl ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
        style={{ maxWidth: hasAttachment ? 292 : '75%', backgroundColor: bubbleColor }}
      >
        {msg.attachmentType === 'image' && msg.attachmentUrl && (
          <View style={{ width: 238, height: 300, borderRadius: 10, overflow: 'hidden' }}>
            <Image
              source={{ uri: msg.attachmentUrl }}
              style={{ width: 238, height: 300 }}
              contentFit="cover"
            />
          </View>
        )}
        {msg.attachmentType === 'video' && msg.attachmentUrl && (
          <VideoMessage uri={msg.attachmentUrl} />
        )}
        {msg.attachmentType === 'audio' && (
          msg.attachmentUrl ? <AudioMessage uri={msg.attachmentUrl} isMe={isMe} /> : null
        )}
        {msg.attachmentType === 'file' && (
          <Pressable
            className="flex-row items-center rounded-xl px-3 py-3"
            style={{ width: 238, backgroundColor: isMe ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }}
            onPress={() => msg.attachmentUrl && Linking.openURL(msg.attachmentUrl)}
          >
            <View className="w-10 h-10 rounded-lg items-center justify-center" style={{ backgroundColor: isPdf(msg.attachmentUrl) ? '#E53935' : '#2b2b2b' }}>
              <Ionicons name={isPdf(msg.attachmentUrl) ? 'document-text' : 'document'} size={22} color="#FFF" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-semibold" style={{ color: textColor }} numberOfLines={1}>
                {fileLabel(msg.attachmentUrl)}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: timeColor }}>
                Tap to open
              </Text>
            </View>
          </Pressable>
        )}
        {text ? (
          <LinkifiedMessageText
            text={text}
            color={textColor}
            className={`${hasAttachment ? 'mt-2 px-1' : ''} text-base`}
            onOpenProfile={(profileKey) => router.push(`/screens/user/${encodeURIComponent(profileKey)}`)}
          />
        ) : null}
        <View className={`flex-row items-center justify-end ${hasAttachment ? 'px-1 mt-1' : 'mt-1'}`}>
          <Text className="text-[10px]" style={{ color: timeColor, marginRight: 4 }}>
            {msg.time}
          </Text>
          {isMe && !msg.id.startsWith('optimistic-') && (
            <Ionicons
              name={msg.isRead ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={msg.isRead ? '#4DA3FF' : timeColor}
            />
          )}
          {isMe && msg.id.startsWith('optimistic-') && (
            <Ionicons name="time-outline" size={12} color={timeColor} />
          )}
        </View>
      </View>
    </View>
  );
}

function LinkifiedMessageText({
  text,
  color,
  className,
  onOpenProfile,
}: {
  text: string;
  color: string;
  className?: string;
  onOpenProfile: (profileKey: string) => void;
}) {
  const parts = splitMessageLinks(text);

  return (
    <Text className={className} style={{ color }}>
      {parts.map((part, index) => {
        if (part.type !== 'link') return part.value;

        return (
          <Text
            key={`${part.value}-${index}`}
            style={{ color: '#4DA3FF', textDecorationLine: 'underline' }}
            onPress={() => openMessageLink(part.value, onOpenProfile)}
          >
            {part.value}
          </Text>
        );
      })}
    </Text>
  );
}

function splitMessageLinks(text: string): Array<{ type: 'text' | 'link'; value: string }> {
  const urlPattern = /(play:\/\/screens\/user\/[^\s]+|https?:\/\/play\.app\s*\/\s*@[a-zA-Z0-9._-]+|https?:\/\/[^\s]+)/gi;
  const parts: Array<{ type: 'text' | 'link'; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlPattern.exec(text))) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'link', value: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts.length ? parts : [{ type: 'text', value: text }];
}

function openMessageLink(link: string, onOpenProfile: (profileKey: string) => void) {
  const profileKey = profileKeyFromLink(link);
  if (profileKey) {
    onOpenProfile(profileKey);
    return;
  }

  void Linking.openURL(link);
}

function profileKeyFromLink(link: string) {
  const normalizedLink = link.replace(/\s+/g, '');
  const appMatch = normalizedLink.match(/^play:\/\/screens\/user\/([^?\s#]+)/i);
  if (appMatch?.[1]) return decodeURIComponent(appMatch[1]).replace(/^@/, '');

  const webMatch = normalizedLink.match(/^https?:\/\/play\.app\/@([^?\s#]+)/i);
  if (webMatch?.[1]) return decodeURIComponent(webMatch[1]).replace(/^@/, '');

  return null;
}

function shouldRenderText(text: string, attachmentType?: MessageType['attachmentType']) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (attachmentType && /^\[(image|video|audio|file)\]$/i.test(trimmed)) return false;
  return true;
}

function formatDuration(value: number) {
  const seconds = Math.max(0, Math.floor(value || 0));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function isPdf(url?: string) {
  return /\.pdf(\?|$)/i.test(url || '');
}

function fileLabel(url?: string) {
  if (!url) return 'Document';
  const raw = decodeURIComponent(url.split('/').pop()?.split('?')[0] || '');
  if (!raw) return isPdf(url) ? 'PDF document' : 'Document';
  if (raw.length > 28) return `${raw.slice(0, 24)}...`;
  return raw;
}
