import React, { useState } from 'react';
import { View, Pressable, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { toast } from 'sonner-native';
import { handleApiError } from '../../api/client';
import { getShareProfile } from '../../api/profile/profile.api';
import { ProfileMenu } from './ProfileMenu';

export function ProfileHeader() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleShareProfile = async () => {
    if (isSharing) return;

    try {
      setIsSharing(true);
      const shareData = await getShareProfile();
      await Share.share({
        title: shareData.title,
        message: shareData.message,
      });
    } catch (error) {
      toast.error(handleApiError(error, 'Could not share profile.'));
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <View className="flex-row items-center justify-between px-4 pt-2 pb-2">
        <Pressable className="p-2" onPress={() => router.push('/screens/find-friends')}>
          <Ionicons name="person-add-outline" size={24} color="#FFF" />
        </Pressable>
        
        <View className="flex-row items-center">
          <Pressable className="p-2 mr-2" onPress={handleShareProfile} disabled={isSharing}>
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
