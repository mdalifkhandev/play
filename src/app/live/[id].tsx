import { useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StatusBar, StyleSheet, View } from 'react-native';
import { LiveBottomActions } from '../../components/live/LiveBottomActions';
import { LiveChatStream } from '../../components/live/LiveChatStream';
import { LiveSingleHeader } from '../../components/live/LiveSingleHeader';

import { MOCK_LIVES } from '../(tab)/live';

export default function LiveSingleScreen() {
  const { id } = useLocalSearchParams();

  const mockData = MOCK_LIVES.find(m => m.id === id);
  const videoUrl = mockData?.videoUrl || 'https://vjs.zencdn.net/v/oceans.mp4';

  const player = useVideoPlayer(videoUrl, player => {
    player.loop = true;
    player.play();
  });

  const streamData = {
    hostAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100',
    hostName: 'Dianne Wilson',
    viewers: '41.3K',
  };

  return (
    <View className="flex-1 bg-black relative">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        nativeControls={false}
        contentFit="cover"
      />

      <View className="absolute inset-0 bg-black/20" />

      <LiveSingleHeader
        hostAvatar={streamData.hostAvatar}
        hostName={streamData.hostName}
        viewers={streamData.viewers}
      />

      <LiveChatStream />

      <LiveBottomActions />
    </View>
  );
}
