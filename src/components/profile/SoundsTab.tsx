import React from 'react';
import { View, Text, Pressable, Image as RNImage } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function SoundsTab() {
  const sounds = [
    { id: '1', title: 'PLAY', duration: '00:05', views: '2.1M video', image: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=100' },
    { id: '2', title: 'PAUSE', duration: '00:30', views: '900K video', image: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=100' },
    { id: '3', title: 'RECORD', duration: '02:10', views: '5.7M video', image: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=100' },
    { id: '4', title: 'GO', duration: '00:12', views: '1.5M video', image: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=100' },
    { id: '5', title: 'STOP', duration: '01:45', views: '3.2M video', image: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=100' },
  ];

  return (
    <View className="mt-4 px-4 pb-10">
      {sounds.map((item) => (
        <View key={item.id} className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 rounded-lg bg-[#222] mr-3 overflow-hidden relative">
              <RNImage source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} />
              <View className="absolute inset-0 items-center justify-center bg-black/30">
                <Ionicons name="play" size={20} color="#FFF" />
              </View>
            </View>
            <View>
              <Text className="text-white text-xs font-bold mb-1 uppercase tracking-wider">{item.title}</Text>
              <Text className="text-[#888] text-[10px] font-semibold">{item.duration} - {item.views}</Text>
            </View>
          </View>
          
          <Pressable className="w-10 h-7 bg-[#A3E635] rounded items-center justify-center">
            <Ionicons name="play" size={14} color="#000" />
          </Pressable>
        </View>
      ))}
    </View>
  );
}
