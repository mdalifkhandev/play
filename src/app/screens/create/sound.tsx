import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer } from 'expo-audio';
import { CustomInput } from '../../../components/inputs/CustomInput';
import { SearchIcon } from '../../../components/icons/SearchIcon';
import { useLocalSearchParams } from 'expo-router';

// Using the downloaded local assets from assets/sound
const DUMMY_TRACKS = [
  { id: '1', title: 'Rainy Window Lo-Fi', artist: 'Kaazoom', duration: '00:15', url: require('../../../../assets/sound/kaazoom-rainy-window-study-lofi-15-sec-stinger-526099.mp3') },
  { id: '2', title: 'Amazon Nature Waterfall', artist: 'MeditativeTiger', duration: '00:15', url: require('../../../../assets/sound/meditativetiger-15-second-amazon-nature-waterfall-395552.mp3') },
  { id: '3', title: 'Bamboo Waterfall Loop', artist: 'MeditativeTiger', duration: '00:15', url: require('../../../../assets/sound/meditativetiger-bamboo-waterfall-15-second-loop-395563.mp3') },
  { id: '4', title: 'Catchy Jazzy Stinger', artist: 'Sonican', duration: '00:15', url: require('../../../../assets/sound/sonican-catchy-jazzy-15-sec-stinger-343720.mp3') },
];

export default function SoundScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { returnTo, uri } = useLocalSearchParams<{ returnTo?: string; uri?: string }>();

  const [activeTab, setActiveTab] = useState('Trending');
  const [searchQuery, setSearchQuery] = useState('');

  // Audio state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  // Use a ref to strictly track the active player and prevent overlapping sounds
  const activePlayerRef = useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activePlayerRef.current) {
        activePlayerRef.current.pause();
        activePlayerRef.current.remove();
        activePlayerRef.current = null;
      }
    };
  }, []);

  const handleTogglePlay = (track: typeof DUMMY_TRACKS[0]) => {
    // If clicking the currently playing/loading track, stop it
    if (playingId === track.id || loadingId === track.id) {
      if (activePlayerRef.current) {
        activePlayerRef.current.pause();
        activePlayerRef.current.remove();
        activePlayerRef.current = null;
      }
      setPlayingId(null);
      setLoadingId(null);
      return;
    }

    // Stop current track if switching
    if (activePlayerRef.current) {
      activePlayerRef.current.pause();
      activePlayerRef.current.remove();
      activePlayerRef.current = null;
    }

    setLoadingId(track.id);
    setPlayingId(null);

    try {
      const newSound = createAudioPlayer(track.url);
      newSound.play();
      activePlayerRef.current = newSound;

      newSound.addListener('playbackStatusUpdate', (status: any) => {
        if (status.error) {
          console.log('Audio playback error:', status.error);
          setLoadingId(null);
          setPlayingId(null);
        }
        if (status.isLoaded && status.playing) {
          setLoadingId(null);
          setPlayingId(track.id);
        }
        if (status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (e) {
      console.log('Error playing sound', e);
      setLoadingId(null);
      setPlayingId(null);
    }
  };

  const handleUse = (track: typeof DUMMY_TRACKS[0]) => {
    if (activePlayerRef.current) {
      activePlayerRef.current.pause();
      activePlayerRef.current.remove();
      activePlayerRef.current = null;
    }

    const targetPath = returnTo || '/(tab)/create';

    router.push({
      pathname: targetPath as any,
      params: {
        soundUrl: track.url,
        title: track.title,
        ...(uri ? { uri } : {})
      }
    });
  };

  return (
    <View className="flex-1 bg-[#121212]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => {
          if (activePlayerRef.current) {
            activePlayerRef.current.pause();
            activePlayerRef.current.remove();
            activePlayerRef.current = null;
          }
          router.back();
        }} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="flex-1 text-center text-white font-inter-semibold text-[17px] mr-6">
          Select Audio
        </Text>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center px-4 mb-2 mt-2 gap-3">
        <View className="flex-1 flex-row items-center bg-[#2A2A2A] rounded-full px-4 py-2">
          <SearchIcon width={20} height={20} />
          <TextInput
            className="flex-1 ml-2 text-white text-base font-inter-regular p-0 h-8"
            placeholder="GO"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <Pressable>
          <Ionicons name="ellipsis-horizontal" size={24} color="#888" />
        </Pressable>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 border-b border-[#333] mb-4 gap-6">
        {['Trending', 'Mood', 'Genre'].map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} className={`pb-3 border-b-2 ${activeTab === tab ? 'border-[#98D83A]' : 'border-transparent'}`}>
            <Text className={`font-inter-semibold text-[15px] ${activeTab === tab ? 'text-white' : 'text-[#888]'}`}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      <ScrollView className="flex-1 px-4">
        {DUMMY_TRACKS.map(track => {
          const isThisPlaying = playingId === track.id;
          const isThisLoading = loadingId === track.id;

          return (
            <View key={track.id} className="flex-row items-center bg-[#1A1A1A] rounded-xl p-2.5 mb-3 border border-[#333]">
              <Pressable onPress={() => handleTogglePlay(track)} className="relative">
                <View className="w-[60px] h-[60px] rounded-lg bg-[#333] items-center justify-center relative overflow-hidden">
                  <Ionicons name="musical-notes" size={28} color="#98FF2F" />

                  {isThisLoading ? (
                    <View className="absolute inset-0 bg-black/60 items-center justify-center">
                      <ActivityIndicator size="small" color="#98FF2F" />
                    </View>
                  ) : (
                    <View className="absolute inset-0 bg-black/40 items-center justify-center">
                      <Ionicons name={isThisPlaying ? "pause" : "play"} size={24} color="#98FF2F" />
                    </View>
                  )}
                </View>
              </Pressable>

              <View className="flex-1 ml-3">
                <Text className="text-white font-inter-medium text-[16px] mb-0.5">{track.title}</Text>
                <Text className="text-[#888] font-inter-regular text-[13px]">
                  {track.artist} • {track.duration}
                </Text>
              </View>

              <Pressable
                onPress={() => handleUse(track)}
                className="border border-[#98D83A] rounded-lg px-5 py-1.5 ml-2"
                style={({ pressed }) => ({ backgroundColor: pressed ? 'rgba(152, 216, 58, 0.2)' : 'transparent' })}
              >
                <Text className="text-[#98D83A] font-inter-semibold text-[15px]">Use</Text>
              </Pressable>
            </View>
          );
        })}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
