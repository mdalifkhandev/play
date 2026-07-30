import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

export interface FeedItemProps {
  id: string;
  type: 'video' | 'image';
  source: string;
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
  isActive: boolean; // Tells if this item is currently visible to play/pause
}

export const FeedItem = ({
  type,
  source,
  user,
  description,
  date,
  stats,
  isActive
}: FeedItemProps) => {
  const insets = useSafeAreaInsets();

  // Setup video player if type is video
  const player = useVideoPlayer(source, player => {
    player.loop = true;
    if (isActive) {
      player.play();
    }
  });

  // Play/pause based on visibility
  useEffect(() => {
    if (type === 'video' && player) {
      if (isActive) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isActive, type, player]);

  const togglePlay = () => {
    if (type === 'video' && player) {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    }
  };

  return (
    <View style={{ height: WINDOW_HEIGHT, width: WINDOW_WIDTH, backgroundColor: '#000' }}>
      <Pressable style={StyleSheet.absoluteFill} onPress={togglePlay}>
        {type === 'video' ? (
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            nativeControls={false}
            contentFit="cover"
          />
        ) : (
          <Image
            source={{ uri: source }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        )}
      </Pressable>

      {/* Bottom Gradient Overlay for better text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={[styles.bottomOverlay, { paddingBottom: insets.bottom + 80 }]}
      />

      {/* Right Action Buttons */}
      <View style={[styles.rightSidebar, { bottom: insets.bottom + 100 }]}>
        <View style={styles.actionButton}>
          <View style={styles.profileContainer}>
            <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
            <View style={styles.followButton}>
              <Ionicons name="add" size={14} color="#000" />
            </View>
          </View>
        </View>

        <Pressable style={styles.actionButton}>
          <Ionicons name="heart" size={36} color="#E4FB52" />
          <Text style={styles.actionText}>{stats.likes}</Text>
        </Pressable>

        <Pressable style={styles.actionButton}>
          <Ionicons name="chatbubble-ellipses" size={32} color="#FFF" />
          <Text style={styles.actionText}>{stats.comments}</Text>
        </Pressable>

        <Pressable style={styles.actionButton}>
          <Ionicons name="bookmark" size={32} color="#FFF" />
          <Text style={styles.actionText}>{stats.bookmarks}</Text>
        </Pressable>

        <Pressable style={styles.actionButton}>
          <Ionicons name="arrow-redo" size={36} color="#FFF" />
          <Text style={styles.actionText}>{stats.shares}</Text>
        </Pressable>

        {/* Record/Music Icon */}
        <View style={styles.musicRecord}>
          <View style={styles.musicRecordInner} />
        </View>
      </View>

      {/* Bottom Text Details */}
      <View style={[styles.bottomContainer, { bottom: insets.bottom + 60 }]}>
        <View style={styles.fullScreenBadge}>
          <Ionicons name="scan-outline" size={16} color="#FFF" />
          <Text style={styles.fullScreenText}>Full screen</Text>
        </View>

        <Text style={styles.usernameText}>
          {user.username} <Text style={styles.dateText}>• {date}</Text>
        </Text>

        <Text style={styles.descriptionText} numberOfLines={2}>
          {description} <Text style={styles.moreText}>more</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  rightSidebar: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  profileContainer: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  followButton: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    backgroundColor: '#E4FB52',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicRecord: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 8,
    borderColor: '#333',
  },
  musicRecordInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#000',
  },
  bottomContainer: {
    position: 'absolute',
    left: 16,
    right: 80, // Leave space for right sidebar
  },
  fullScreenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  fullScreenText: {
    color: '#FFF',
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
  },
  usernameText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  dateText: {
    fontWeight: '400',
    color: '#CCC',
  },
  descriptionText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
  moreText: {
    color: '#CCC',
    fontWeight: 'bold',
  }
});
