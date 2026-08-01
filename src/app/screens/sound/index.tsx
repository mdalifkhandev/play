import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Pressable, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';

const MOCK_SOUNDS = [
  { id: '1', title: 'Summer Vibes', author: 'DJ Motin', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', time: '00:15', usage: '1.5M' },
  { id: '2', title: 'Funny Background', author: 'Comedy Central', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', time: '00:08', usage: '2.1M' },
  { id: '3', title: 'Epic Trailer', author: 'Movie Tunes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', time: '00:30', usage: '500K' },
  { id: '4', title: 'Chill Lo-Fi', author: 'Sleepy', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', time: '01:00', usage: '3M' },
];

export default function SoundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [sound, setSound] = useState<AudioPlayer | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    return sound
      ? () => {
          sound.remove();
        }
      : undefined;
  }, [sound]);

  const toggleSound = (item: typeof MOCK_SOUNDS[0]) => {
    if (playingId === item.id || loadingId === item.id) {
      if (sound) {
        sound.pause();
        sound.remove();
        setSound(null);
      }
      setPlayingId(null);
      setLoadingId(null);
      return;
    }

    if (sound) {
      sound.pause();
      sound.remove();
      setSound(null);
    }

    setLoadingId(item.id);
    setPlayingId(null);

    try {
      const newSound = createAudioPlayer(item.url);
      newSound.play();
      setSound(newSound);
      
      newSound.addListener('playbackStatusUpdate', (status) => {
        if (status.isLoaded && status.playing) {
          setLoadingId(null);
          setPlayingId(item.id);
        }
        if (status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (e) {
      console.log('Error playing sound', e);
      setLoadingId(null);
    }
  };

  const handleSelectSound = (item: typeof MOCK_SOUNDS[0]) => {
    if (sound) {
      sound.remove();
    }
    router.push({ pathname: '/(tab)/create', params: { soundUrl: item.url, title: item.title } });
  };

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View 
        className="flex-row items-center px-4 pt-4 pb-4 border-b border-[#2A2A2A]"
        style={{ paddingTop: insets.top + 10 }}
      >
        <Pressable onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </Pressable>
        <Text className="text-white text-lg font-bold">Sounds</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {MOCK_SOUNDS.map((item) => (
          <Pressable 
            key={item.id} 
            className="flex-row items-center justify-between px-4 py-3 border-b border-[#1C1C1E]"
            onPress={() => handleSelectSound(item)}
          >
            <View className="flex-row items-center flex-1">
              <View className="w-14 h-14 rounded-lg bg-[#2A2A2A] mr-3 items-center justify-center relative overflow-hidden">
                <Ionicons name="musical-notes" size={24} color="#98FF2F" />
                {playingId === item.id && (
                  <View className="absolute inset-0 bg-black/50 items-center justify-center">
                    <Ionicons name="stats-chart" size={20} color="#98FF2F" />
                  </View>
                )}
              </View>
              <View>
                <Text className="text-white font-semibold text-base">{item.title}</Text>
                <Text className="text-[#888] text-sm mt-1">{item.author}</Text>
                <Text className="text-[#666] text-xs mt-0.5">{item.time} • {item.usage} videos</Text>
              </View>
            </View>
            <Pressable 
              className={`w-12 h-10 rounded-lg items-center justify-center ${playingId === item.id ? 'bg-[#FF3B30]' : 'bg-[#98FF2F]'}`}
              onPress={() => toggleSound(item)}
            >
              {loadingId === item.id ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Ionicons name={playingId === item.id ? "stop" : "play"} size={20} color={playingId === item.id ? "#FFF" : "#000"} />
              )}
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
