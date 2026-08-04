import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Image, TextInput, ScrollView, Switch } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer } from 'expo-audio';
import * as Location from 'expo-location';

export default function PostDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    uri, mediaType, overlayText, soundUrl, title,
    originalVolume, addedVolume, trimLeft, trimRight, videoTrimLeft, videoTrimRight,
    exposure: expParam, contrast: contParam, activeFilter, activeEffect
  } = useLocalSearchParams<{ 
    uri: string; mediaType?: 'photo' | 'video'; overlayText: string; soundUrl: string; title: string;
    originalVolume: string; addedVolume: string; trimLeft: string; trimRight: string;
    videoTrimLeft?: string; videoTrimRight?: string;
    exposure: string; contrast: string; activeFilter: string; activeEffect: string;
  }>();

  const exposure = expParam ? parseInt(expParam) : 50;

  const [caption, setCaption] = useState('');
  const [forKids, setForKids] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  // Ref for caption input to auto-focus
  const captionInputRef = React.useRef<TextInput>(null);

  const mockImage = uri || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800';

  const appendToCaption = (text: string) => {
    setCaption(prev => {
      const trimmed = prev.trimEnd();
      return trimmed.length > 0 ? `${trimmed} ${text} ` : `${text} `;
    });
    // Add a slight delay for the focus so state can update
    setTimeout(() => {
      captionInputRef.current?.focus();
    }, 100);
  };

  const handleCurrentLocation = async () => {
    try {
      setIsFetchingLocation(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        setIsFetchingLocation(false);
        return;
      }
      
      let loc = await Location.getCurrentPositionAsync({});
      let geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
      
      if (geocode.length > 0) {
        const place = geocode[0];
        // Prefer city/district, fallback to name, then region
        const locName = place.city || place.subregion || place.name || place.region;
        const locString = `📍 ${locName}, ${place.country}`;
        setLocation(locString);
      } else {
        setLocation('📍 Unknown Location');
      }
      setIsEditingLocation(false);
    } catch (e) {
      console.log(e);
      alert('Error fetching location. Make sure GPS is enabled.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handlePost = () => {
    router.push({
      pathname: '/screens/create/post-success',
      params: { 
        uri: mockImage,
        mediaType: mediaType || 'photo',
        overlayText, soundUrl, title,
        originalVolume, addedVolume, trimLeft, trimRight,
        videoTrimLeft: videoTrimLeft || '',
        videoTrimRight: videoTrimRight || '',
        exposure: expParam, contrast: contParam, activeFilter, activeEffect
      }
    } as any);
  };

  // Audio Player for final preview
  const [sound, setSound] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      let player: any = null;
      if (soundUrl) {
        try {
          const source = /^\d+$/.test(soundUrl) ? parseInt(soundUrl, 10) : soundUrl;
          player = createAudioPlayer(source);
          player.play();
          player.loop = true;
          setSound(player);
        } catch (error) {
          console.log("Post details audio error:", error);
        }
      }
      return () => {
        if (player) {
          player.pause();
          try { player.remove(); } catch(e) {}
        }
        setSound(null);
      };
    }, [soundUrl])
  );

  useEffect(() => {
    if (sound) {
      if (addedVolume !== undefined) {
        sound.volume = Number(addedVolume) / 100;
      }
      if (trimLeft !== undefined) {
        const startMs = Math.floor((Number(trimLeft) / 100) * 30 * 1000);
        if (typeof sound.seekTo === 'function') {
          try { sound.seekTo(startMs / 1000); } catch(e) {}
        }
      }
    }
  }, [sound, addedVolume, trimLeft]);

  return (
    <View className="flex-1 bg-[#121212]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#222]">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-white font-inter-semibold text-[17px]">
          Post Details
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        
        {/* Top Thumbnail */}
        <View className="w-full h-40 rounded-2xl overflow-hidden mb-6 relative bg-black items-center justify-center">
          <Image 
            source={{ uri: mockImage }} 
            className="w-full h-full absolute inset-0"
            resizeMode="cover"
            style={{
              transform: activeEffect === 'Zoom' ? [{ scale: 1.15 }] : [{ scale: 1 }]
            }}
          />

          {/* Simulate Glitch Effect */}
          {activeEffect === 'Glitch' && (
            <>
              <View className="absolute inset-0 bg-red-500/20" style={{ transform: [{ translateX: -2 }] }} pointerEvents="none" />
              <View className="absolute inset-0 bg-blue-500/20" style={{ transform: [{ translateX: 2 }] }} pointerEvents="none" />
            </>
          )}

          {/* Simulate Flash Effect */}
          {activeEffect === 'Flash' && (
            <View className="absolute inset-0 bg-white/40" pointerEvents="none" />
          )}

          {/* Simulate VHS Effect */}
          {activeEffect === 'VHS' && (
            <View className="absolute inset-0 bg-green-500/10 border-t-2 border-black/20" pointerEvents="none" style={{ top: 0, bottom: 0 }} />
          )}

          {/* Simulate Exposure Effect Overlay */}
          {exposure !== 50 && (
            <View 
              className="absolute inset-0 pointer-events-none" 
              style={{ 
                backgroundColor: exposure > 50 ? 'white' : 'black',
                opacity: Math.abs(exposure - 50) / 100
              }} 
            />
          )}

          {/* Simulate Filter Effect Overlay */}
          {activeFilter && activeFilter !== 'Normal' && (
            <View 
              className="absolute inset-0 pointer-events-none" 
              style={{ 
                backgroundColor: 
                  activeFilter === 'Vivid' ? 'rgba(255, 50, 50, 0.15)' :
                  activeFilter === 'Mono' ? 'rgba(0, 0, 0, 0.7)' :
                  activeFilter === 'Vintage' ? 'rgba(112, 66, 20, 0.3)' :
                  activeFilter === 'Warm' ? 'rgba(255, 165, 0, 0.2)' : 'transparent',
              }} 
            />
          )}

          {overlayText && (
            <View className="absolute inset-0 items-center justify-center z-20 pointer-events-none">
              <Text className="text-white font-inter-bold text-xl text-center px-4" style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 5 }}>
                {overlayText}
              </Text>
            </View>
          )}
          
          {/* Mock Music Sticker if sound exists */}
          {soundUrl && title && (
            <View className="absolute bottom-2 left-2 bg-black/60 px-3 py-1.5 rounded-xl flex-row items-center z-20 pointer-events-none">
              <Ionicons name="musical-notes" size={12} color="white" />
              <Text className="text-white font-inter-medium text-xs ml-1" numberOfLines={1}>{title}</Text>
            </View>
          )}
        </View>

        <View className="bg-[#1C1C1E] rounded-xl p-4 mb-6 border border-[#333]">
          <Text className="text-white font-inter-semibold text-base mb-3">Audio Mix</Text>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[#BBB] font-inter-regular">Original sound</Text>
            <Text className="text-[#98FF2F] font-inter-semibold">{originalVolume || '100'}%</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-[#BBB] font-inter-regular">Added music</Text>
            <Text className="text-[#98FF2F] font-inter-semibold">{soundUrl ? `${addedVolume || '100'}%` : 'Off'}</Text>
          </View>
          {mediaType === 'video' && (
            <Text className="text-[#888] font-inter-regular text-xs mt-3">
              Final video keeps your original sound and added music together using these volumes.
            </Text>
          )}
        </View>

        {/* Caption */}
        <Text className="text-white font-inter-semibold text-base mb-2">Caption</Text>
        <View className="bg-[#1C1C1E] rounded-xl p-4 min-h-[120px] mb-4 border border-[#333]">
          <TextInput
            ref={captionInputRef}
            className="text-white font-inter-regular text-base p-0 m-0"
            placeholder="Add a description......."
            placeholderTextColor="#888"
            multiline
            textAlignVertical="top"
            value={caption}
            onChangeText={setCaption}
          />
        </View>

        {/* Hashtags */}
        <View className="flex-row flex-wrap gap-2 mb-6">
          <Pressable onPress={() => appendToCaption('#nightlife')} className="bg-[#333] px-4 py-1.5 rounded-md active:bg-[#98FF2F]">
            <Text className="text-gray-300 font-inter-medium text-sm">#nightlife</Text>
          </Pressable>
          <Pressable onPress={() => appendToCaption('#dance')} className="bg-[#333] px-4 py-1.5 rounded-md active:bg-[#98FF2F]">
            <Text className="text-gray-300 font-inter-medium text-sm">#dance</Text>
          </Pressable>
          <Pressable onPress={() => appendToCaption('#noir')} className="bg-[#333] px-4 py-1.5 rounded-md active:bg-[#98FF2F]">
            <Text className="text-gray-300 font-inter-medium text-sm">#noir</Text>
          </Pressable>
          <Pressable onPress={() => appendToCaption('#')} className="bg-[#333] px-4 py-1.5 rounded-md border border-[#555]">
            <Text className="text-gray-300 font-inter-medium text-sm">+ Hashtag</Text>
          </Pressable>
        </View>

        {/* List Options */}
        <View className="gap-6 mb-8">
          <Pressable onPress={() => appendToCaption('@')} className="flex-row items-center">
            <Ionicons name="at-outline" size={24} color="#98FF2F" />
            <Text className="text-white font-inter-medium text-base ml-3">Mention Someone</Text>
          </Pressable>
          
          {isEditingLocation ? (
            <View className="w-full">
              <View className="flex-row items-center border-b border-[#333] pb-2">
                <Ionicons name="location" size={24} color="#98FF2F" />
                <TextInput
                  className="flex-1 text-white font-inter-regular text-base ml-3 p-0"
                  placeholder="Type a location..."
                  placeholderTextColor="#888"
                  value={locationInput}
                  onChangeText={setLocationInput}
                  autoFocus
                  onSubmitEditing={() => {
                    setLocation(locationInput.trim() || null);
                    setIsEditingLocation(false);
                  }}
                />
                <Pressable onPress={() => { setLocation(locationInput.trim() || null); setIsEditingLocation(false); }} className="p-1">
                   <Ionicons name="checkmark-circle" size={24} color="#98FF2F" />
                </Pressable>
              </View>
              <Pressable 
                className="flex-row items-center mt-3 ml-2"
                onPress={handleCurrentLocation}
                disabled={isFetchingLocation}
              >
                <Ionicons name="navigate" size={18} color="#0095f6" />
                <Text className="text-[#0095f6] font-inter-medium text-sm ml-2">
                  {isFetchingLocation ? 'Locating...' : 'Use Current Location'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row items-center w-full">
              <Pressable 
                onPress={() => {
                  setLocationInput(location ? location.replace('📍 ', '') : '');
                  setIsEditingLocation(true);
                }} 
                className="flex-row items-center flex-1"
              >
                <Ionicons name="location-outline" size={24} color={location ? "#98FF2F" : "white"} />
                <Text className={`font-inter-medium text-base ml-3 ${location ? 'text-[#98FF2F]' : 'text-white'}`}>
                  {location || 'Add Location'}
                </Text>
              </Pressable>
              {location && (
                <Pressable onPress={() => setLocation(null)} className="p-2">
                  <Ionicons name="close-circle" size={20} color="#666" />
                </Pressable>
              )}
            </View>
          )}
          
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="happy-outline" size={24} color="white" />
              <Text className="text-white font-inter-medium text-base ml-3">For kids</Text>
            </View>
            <Switch
              value={forKids}
              onValueChange={setForKids}
              trackColor={{ false: '#333', true: '#98FF2F' }}
              thumbColor={forKids ? 'white' : '#888'}
              ios_backgroundColor="#333"
            />
          </View>
        </View>

      </ScrollView>

      {/* Bottom Buttons */}
      <View 
        className="flex-row items-center justify-center px-4 pt-4 gap-4 bg-[#121212]"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 32) }}
      >
        <Pressable 
          onPress={() => router.back()}
          className="flex-1 py-3 rounded-xl border border-[#98FF2F] bg-[#222] items-center"
        >
          <Text className="text-[#98FF2F] font-inter-semibold text-base">Cancel</Text>
        </Pressable>
        <Pressable 
          onPress={handlePost}
          className="flex-1 py-3 rounded-xl bg-[#98FF2F] items-center"
        >
          <Text className="text-black font-inter-semibold text-base">Post</Text>
        </Pressable>
      </View>

    </View>
  );
}
