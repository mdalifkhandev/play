import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileMenu } from './ProfileMenu';

export function ProfileHeader() {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <View className="flex-row items-center justify-between px-4 pt-2 pb-2">
        <Pressable className="p-2">
          <Ionicons name="person-add-outline" size={24} color="#FFF" />
        </Pressable>
        
        <View className="flex-row items-center">
          <Pressable className="p-2 mr-2">
            <Ionicons name="paper-plane-outline" size={24} color="#FFF" />
          </Pressable>
          <Pressable className="p-2" onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu-outline" size={28} color="#FFF" />
          </Pressable>
        </View>
      </View>

      <ProfileMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
}
