import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, Image, Dimensions, PanResponder, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer } from 'expo-audio';

const { width } = Dimensions.get('window');

// Custom interactive slider using PanResponder
const CustomSlider = ({ value, onValueChange, label }: { value: number, onValueChange: (val: number) => void, label: string }) => {
  const latestValue = useRef(value);
  latestValue.current = value;
  const startVal = useRef(value);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startVal.current = latestValue.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        const sliderWidth = width - 32; // Assuming px-4 on both sides
        const dxPercent = (gestureState.dx / sliderWidth) * 100;
        let newValue = Math.round(startVal.current + dxPercent);
        newValue = Math.max(0, Math.min(100, newValue));
        onValueChange(newValue);
      }
    })
  ).current;

  return (
    <View className="mb-2 w-full">
      <View className="flex-row justify-between mb-2">
        <Text className="text-white font-inter-medium text-[15px]">{label}</Text>
        <Text className="text-[#98FF2F] font-inter-medium">{value}%</Text>
      </View>
      <View 
        {...panResponder.panHandlers}
        className="w-full h-10 justify-center relative" // Larger touch target
      >
        <View className="w-full h-1 bg-white/20 rounded-full flex-row items-center relative">
          <View className="h-full bg-[#98FF2F] rounded-full" style={{ width: `${value}%` }} />
          <View className="w-5 h-5 rounded-full bg-[#98FF2F] absolute" style={{ left: `${value}%`, marginLeft: -10 }} />
        </View>
      </View>
    </View>
  );
};

export default function EditMusicScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { 
    uri, soundUrl, title, 
    originalVolume: initOrigVol, 
    addedVolume: initAddedVol, 
    trimLeft: initTrimLeft, 
    trimRight: initTrimRight 
  } = useLocalSearchParams<{ 
    uri: string; soundUrl: string; title: string;
    originalVolume?: string; addedVolume?: string; trimLeft?: string; trimRight?: string;
  }>();

  const [originalVolume, setOriginalVolume] = useState(initOrigVol ? parseInt(initOrigVol, 10) : 100);
  const [addedVolume, setAddedVolume] = useState(initAddedVol ? parseInt(initAddedVol, 10) : 100);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [sound, setSound] = useState<any>(null);
  
  // Trim states (percentages)
  const [trimLeft, setTrimLeft] = useState(initTrimLeft ? parseInt(initTrimLeft, 10) : 20);
  const [trimRight, setTrimRight] = useState(initTrimRight ? parseInt(initTrimRight, 10) : 70);

  const mockImage = uri || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800';
  const MAX_DURATION_SEC = 30; // Mock 30 seconds total audio

  // Use refs to track latest values for PanResponder closures
  const latestAddedVolume = useRef(addedVolume);
  latestAddedVolume.current = addedVolume;
  const latestIsMuted = useRef(isMuted);
  latestIsMuted.current = isMuted;

  useEffect(() => {
    let player: any = null;
    if (soundUrl) {
      try {
        const source = /^\d+$/.test(soundUrl) ? parseInt(soundUrl, 10) : soundUrl;
        player = createAudioPlayer(source);
        // Set volume explicitly BEFORE playing to prevent audio leaks
        player.volume = latestIsMuted.current ? 0 : latestAddedVolume.current / 100;
        player.play();
        player.loop = true;
        setSound(player);
      } catch (e) {
        console.log("Error in edit-music preview", e);
      }
    }
    return () => {
      if (player) {
        player.pause();
        player.remove();
      }
    };
  }, [soundUrl]);

  // Sync play/pause state
  useEffect(() => {
    if (sound) {
      if (isPlaying) {
        sound.play();
      } else {
        sound.pause();
      }
    }
  }, [isPlaying, sound]);

  // Sync volume state dynamically when slider changes
  useEffect(() => {
    if (sound) {
      const vol = isMuted ? 0 : addedVolume / 100;
      sound.volume = vol;
      
      if (vol === 0) {
        sound.pause();
      } else {
        // If it was paused purely due to volume=0, resume it if isPlaying is true
        // But avoid repeatedly calling play() while dragging
        if (isPlaying) {
          try {
            // Only call play if it's not currently playing (if the API supports checking)
            // It's safer to just let the main isPlaying useEffect handle the play/pause state for standard toggles.
            // We just call play() once if it was paused.
            sound.play();
          } catch(e) {}
        }
      }
    }
  }, [addedVolume, isMuted, sound]);

  // Use refs to track latest values for PanResponder closures
  const latestTrimLeft = useRef(trimLeft);
  latestTrimLeft.current = trimLeft;
  const latestTrimRight = useRef(trimRight);
  latestTrimRight.current = trimRight;

  // Trim Left Handle
  const leftStart = useRef(trimLeft);
  const leftPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { leftStart.current = latestTrimLeft.current; },
    onPanResponderMove: (evt, gestureState) => {
      const w = width - 32;
      let newLeft = leftStart.current + (gestureState.dx / w) * 100;
      newLeft = Math.max(0, Math.min(latestTrimRight.current - 10, newLeft)); // Keep it at least 10% apart from right
      setTrimLeft(newLeft);
    }
  })).current;

  // Trim Right Handle
  const rightStart = useRef(trimRight);
  const rightPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { rightStart.current = latestTrimRight.current; },
    onPanResponderMove: (evt, gestureState) => {
      const w = width - 32;
      let newRight = rightStart.current + (gestureState.dx / w) * 100;
      newRight = Math.max(latestTrimLeft.current + 10, Math.min(100, newRight));
      setTrimRight(newRight);
    }
  })).current;

  // Format time helper (e.g. 15 -> "00:15")
  const formatTime = (percent: number) => {
    const secs = Math.floor((percent / 100) * MAX_DURATION_SEC);
    return `00:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View className="flex-1 bg-[#121212]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#222]">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-white font-inter-semibold text-[17px]">
          Edit Music
        </Text>
        <Pressable 
          onPress={() => {
            // Save state by passing back to edit.tsx
            router.navigate({
              pathname: '/screens/create/edit' as any,
              params: {
                uri,
                soundUrl,
                title,
                originalVolume: originalVolume.toString(),
                addedVolume: addedVolume.toString(),
                trimLeft: trimLeft.toString(),
                trimRight: trimRight.toString()
              }
            });
          }}
          className="bg-[#98FF2F] px-4 py-1.5 rounded-lg"
        >
          <Text className="text-black font-inter-semibold text-[15px]">Save</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 40, 40) }}>
        {/* Main Preview (Square crop matching mockup) */}
        <View className="items-center justify-center mt-2 px-4">
          <View className="w-full aspect-square rounded-[32px] overflow-hidden relative bg-[#222]">
            <Image 
              source={{ uri: mockImage }} 
              className="w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black/20" />
            
            {/* Play Button */}
            <View className="absolute inset-0 items-center justify-center">
              <Pressable 
                onPress={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 bg-black/50 rounded-full items-center justify-center"
              >
                <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="white" style={{ marginLeft: isPlaying ? 0 : 4 }} />
              </Pressable>
            </View>
            
            {/* Mute Button */}
            <View className="absolute bottom-4 right-4">
              <Pressable 
                onPress={() => setIsMuted(!isMuted)}
                className={`w-12 h-12 rounded-full items-center justify-center ${isMuted ? 'bg-[#98FF2F]' : 'bg-black/50'}`}
              >
                <Ionicons name={isMuted ? "volume-mute" : "volume-medium"} size={24} color={isMuted ? "black" : "white"} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Music Info */}
        <View className="items-center mt-6">
          <Text className="text-white font-inter-semibold text-lg">{title || 'Original Audio'}</Text>
          <Text className="text-[#888] font-inter-regular mt-1">Select sound from library</Text>
        </View>

        {/* Trimmer Section */}
        <View className="px-4 mt-8">
          <View className="flex-row justify-between mb-4">
            <Text className="text-white font-inter-medium">{formatTime(trimLeft)} / {formatTime(trimRight)}</Text>
            <Text className="text-white font-inter-medium">TRIM MODE</Text>
          </View>
          
          {/* Mock Trim Timeline (Interactive) */}
          <View className="h-16 w-full flex-row rounded-lg overflow-hidden relative bg-[#222]">
            <Image 
              source={{ uri: mockImage }} 
              className="w-full h-full opacity-50 absolute inset-0"
              resizeMode="cover"
            />
            <View 
              className="absolute inset-y-0 border-y-4 border-[#98FF2F] bg-black/10 flex-row justify-between"
              style={{ left: `${trimLeft}%`, right: `${100 - trimRight}%` }}
            >
              {/* Left Handle */}
              <View 
                {...leftPan.panHandlers}
                className="w-6 h-full bg-[#98FF2F] items-center justify-center -ml-1 absolute left-0 z-10"
              >
                <View className="w-0.5 h-4 bg-black rounded-full" />
              </View>
              
              {/* Right Handle */}
              <View 
                {...rightPan.panHandlers}
                className="w-6 h-full bg-[#98FF2F] items-center justify-center -mr-1 absolute right-0 z-10"
              >
                <View className="w-0.5 h-4 bg-black rounded-full" />
              </View>
            </View>
          </View>
        </View>

        {/* Volume Sliders */}
        <View className="px-4 mt-8 gap-4">
          <CustomSlider 
            label="Original Sound" 
            value={originalVolume} 
            onValueChange={setOriginalVolume} 
          />
          <CustomSlider 
            label="Added Music" 
            value={addedVolume} 
            onValueChange={setAddedVolume} 
          />
        </View>
      </ScrollView>

    </View>
  );
}
