import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Platform, KeyboardAvoidingView, Pressable, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/ui/Header';
import { CustomInput } from '../../components/inputs/CustomInput';
import { CustomButton } from '../../components/ui/CustomButton';
import { useAppStore } from '../../store';
import { defaultUserAvatar } from '../../utils/avatar';
import { setupProfile } from '../../api/auth/auth.api';
import { getMe } from '../../api/profile/profile.api';
import { handleApiError } from '../../api/client';
import { toast } from 'sonner-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function PersonalInfoScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppStore(state => state.user);
  const setAuth = useAppStore(state => state.setAuth);
  
  const initialName = user?.profile?.displayName || user?.firstName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const initialUsername = user?.profile?.username || '';
  const initialPhone = user?.profile?.phoneNumber || user?.phone || '';
  const initialDob = user?.profile?.dateOfBirth || '';
  const initialBio = user?.profile?.bio || '';
  const initialInstagram = user?.profile?.instagram || '';
  const initialYoutube = user?.profile?.youtube || '';
  const initialPhotoUrl = user?.profile?.photoUrl || user?.profilePicture || null;

  const [displayName, setDisplayName] = useState(initialName);
  const [userName, setUserName] = useState(initialUsername);
  const [email, setEmail] = useState(user?.email || '');
  const [number, setNumber] = useState(initialPhone);
  const [dob, setDob] = useState(initialDob);
  const [bio, setBio] = useState(initialBio);
  const [instagram, setInstagram] = useState(initialInstagram);
  const [youtube, setYoutube] = useState(initialYoutube);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const hasChanges = useMemo(() => {
    return (
      displayName !== initialName ||
      userName !== initialUsername ||
      number !== initialPhone ||
      dob !== initialDob ||
      bio !== initialBio ||
      instagram !== initialInstagram ||
      youtube !== initialYoutube ||
      localPhotoUri !== null
    );
  }, [displayName, userName, number, dob, bio, instagram, youtube, localPhotoUri, initialName, initialUsername, initialPhone, initialDob, initialBio, initialInstagram, initialYoutube]);

  const pickImage = async () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              toast.error('Camera permission is required to take a photo.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setLocalPhotoUri(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              toast.error('Gallery permission is required to choose a photo.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setLocalPhotoUri(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleUpdate = async () => {
    if (!hasChanges) return;

    if (number && !number.startsWith('+')) {
      toast.error('Phone number must start with a country code (e.g., +880)');
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      
      if (displayName !== initialName) formData.append('displayName', displayName);
      if (userName !== initialUsername && userName) formData.append('username', userName);
      if (number !== initialPhone) formData.append('phoneNumber', number);
      if (dob !== initialDob && dob) {
        // dob is stored in state as YYYY-MM-DD which is correct for API
        formData.append('dateOfBirth', dob);
      }
      if (bio !== initialBio) formData.append('bio', bio);
      if (instagram !== initialInstagram) formData.append('instagram', instagram);
      if (youtube !== initialYoutube) formData.append('youtube', youtube);

      if (localPhotoUri) {
        const filename = localPhotoUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('photo', {
          uri: localPhotoUri,
          name: filename,
          type,
        } as any);
      }

      console.log('--- SENDING TO BACKEND ---');
      const formDataEntries = (formData as any)._parts || [];
      console.log(JSON.stringify(formDataEntries, null, 2));

      await setupProfile(formData);
      
      // Fetch fresh user data
      const updatedData = await getMe();
      if (updatedData?.user) {
        setAuth(useAppStore.getState().token!, useAppStore.getState().refreshToken!, updatedData.user);
        toast.success('Profile updated successfully!');
        setLocalPhotoUri(null); // Reset local photo so it uses the URL now
      }
    } catch (error: any) {
      const message = handleApiError(error, 'Failed to update profile');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom + 120, 120) }} className="px-6 pt-16">
        <Header showBackButton={true} title="Edit Profile" />

        <View className="items-center mt-6 mb-8">
          <Pressable onPress={pickImage}>
            <View className="w-24 h-24 rounded-full bg-gray-800 overflow-hidden items-center justify-center mb-3">
              <Image
                source={localPhotoUri ? { uri: localPhotoUri } : (initialPhotoUrl ? { uri: initialPhotoUrl } : defaultUserAvatar)}
                className="w-full h-full"
              />
            </View>
          </Pressable>
          <Pressable onPress={pickImage}>
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

        <Pressable onPress={() => setShowDatePicker(true)} className="mb-5">
          <View pointerEvents="none">
            <CustomInput
              label="Date Of Birth"
              placeholder="YYYY-MM-DD"
              value={dob}
              onChangeText={() => {}}
              rightIcon="calendar-outline"
              containerStyle="mb-0"
              isDark
              editable={false}
            />
          </View>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={dob ? new Date(`${dob}T00:00:00.000Z`) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              if (Platform.OS === 'android') {
                setShowDatePicker(false);
              }
              if (selectedDate) {
                const formattedDate = selectedDate.toISOString().slice(0, 10);
                setDob(formattedDate);
              }
            }}
          />
        )}

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

        {hasChanges && (
          <CustomButton
            title={isLoading ? "Updating..." : "Complete"}
            onPress={handleUpdate}
            disabled={isLoading}
            containerStyle="mb-4"
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
