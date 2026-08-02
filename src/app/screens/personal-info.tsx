import React, { useState } from 'react';
import { View, Text, ScrollView, Platform, KeyboardAvoidingView, Pressable, Image, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { CustomInput } from '../../components/inputs/CustomInput';
import { CustomButton } from '../../components/ui/CustomButton';
import { useAppStore } from '../../store';

export default function PersonalInfoScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppStore(state => state.user);
  
  const [displayName, setDisplayName] = useState(user?.firstName ? `${user.firstName} ${user.lastName}` : '');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [number, setNumber] = useState(user?.phone || '');
  const [dob, setDob] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');

  const handleUpdate = () => {
    // API call to update profile
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }} className="px-6 pt-16">
        <Header showBackButton={true} title="Edit Profile" />

        <View className="items-center mt-6 mb-8">
          <View className="w-24 h-24 rounded-full bg-gray-800 overflow-hidden items-center justify-center mb-3">
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} className="w-full h-full" />
            ) : (
              <Ionicons name="person" size={40} color="#666" />
            )}
          </View>
          <Pressable>
            <Text className="text-white text-base font-inter-medium">Change Photo</Text>
          </Pressable>
        </View>

        <CustomInput
          label="Display Name"
          placeholder="Rokey Mahmud"
          value={displayName}
          onChangeText={setDisplayName}
          containerStyle="mb-5"
          isDark
        />

        <CustomInput
          label="User Name"
          placeholder="Rokey Mahmud"
          value={userName}
          onChangeText={setUserName}
          containerStyle="mb-5"
          isDark
        />

        <CustomInput
          label="Email"
          placeholder="alice@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          containerStyle="mb-5"
          isDark
        />

        <CustomInput
          label="Number"
          placeholder="258795*****"
          value={number}
          onChangeText={setNumber}
          keyboardType="phone-pad"
          containerStyle="mb-5"
          isDark
        />

        <CustomInput
          label="Date Of Birth"
          placeholder="mm/dd/yyyy"
          value={dob}
          onChangeText={setDob}
          rightIcon="calendar-outline"
          containerStyle="mb-5"
          isDark
        />

        <View className="mb-5">
          <Text className="text-gray-300 font-inter-medium mb-2">Bio</Text>
          <View className="flex-row items-center bg-transparent border border-[#333] rounded-xl px-4 py-3 min-h-[100px]">
            <TextInput
              placeholder="Tell us about yourself and your music..."
              placeholderTextColor="#666"
              value={bio}
              onChangeText={setBio}
              multiline
              textAlignVertical="top"
              className="flex-1 text-white font-inter-regular h-full"
            />
          </View>
        </View>

        <CustomInput
          label="Instagram"
          placeholder="@username"
          value={instagram}
          onChangeText={setInstagram}
          iconName="logo-instagram"
          containerStyle="mb-5"
          isDark
        />

        <CustomInput
          label="YouTube"
          placeholder="Channel URL"
          value={youtube}
          onChangeText={setYoutube}
          iconName="logo-youtube"
          containerStyle="mb-8"
          isDark
        />

        <CustomButton
          title="Complete"
          onPress={handleUpdate}
          containerStyle="mb-4"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
