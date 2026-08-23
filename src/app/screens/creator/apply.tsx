import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Platform, Image, Alert, Modal, TextInput, KeyboardAvoidingView, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';
import { CustomInput } from '../../../components/inputs/CustomInput';
import { createOccupation, getOccupations, submitCreatorApplication, type Occupation } from '../../../api/creators';
import { handleApiError } from '../../../api/client';
import { useAppStore } from '../../../store';

export default function ApplyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppStore(state => state.user);
  const [fullName, setFullName] = useState(user?.profile?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.profile?.dateOfBirth || '');
  const [occupation, setOccupation] = useState('');
  const [occupationId, setOccupationId] = useState<string | undefined>();
  const [occupationQuery, setOccupationQuery] = useState('');
  const [occupationOptions, setOccupationOptions] = useState<Occupation[]>([]);
  const [isOccupationSheetOpen, setIsOccupationSheetOpen] = useState(false);
  const [isLoadingOccupations, setIsLoadingOccupations] = useState(false);
  const [contentCategory, setContentCategory] = useState('');
  const [contentLanguage, setContentLanguage] = useState('');
  const [country, setCountry] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [idFrontUri, setIdFrontUri] = useState<string | null>(null);
  const [idBackUri, setIdBackUri] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, event => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const loadOccupations = React.useCallback(async (query = '') => {
    setIsLoadingOccupations(true);
    try {
      const result = await getOccupations(query);
      setOccupationOptions(result.items || []);
    } catch (error) {
      console.log('Occupation list failed:', handleApiError(error, 'Could not load occupations.'));
    } finally {
      setIsLoadingOccupations(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isOccupationSheetOpen) return;

    const timer = setTimeout(() => {
      loadOccupations(occupationQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [isOccupationSheetOpen, loadOccupations, occupationQuery]);

  const openOccupationSheet = () => {
    setOccupationQuery(occupation);
    setIsOccupationSheetOpen(true);
  };

  const selectOccupation = (item: Occupation) => {
    setOccupation(item.name);
    setOccupationId(item.id);
    setOccupationQuery(item.name);
    Keyboard.dismiss();
    setIsOccupationSheetOpen(false);
  };

  const createAndSelectOccupation = async () => {
    const name = occupationQuery.trim();
    if (name.length < 2) {
      toast.error('Please enter a valid occupation.');
      return;
    }

    try {
      setIsLoadingOccupations(true);
      const item = await createOccupation(name);
      selectOccupation(item);
    } catch (error) {
      toast.error(handleApiError(error, 'Could not save occupation.'));
    } finally {
      setIsLoadingOccupations(false);
    }
  };

  const pickIdImage = async (side: 'front' | 'back') => {
    const setImage = side === 'front' ? setIdFrontUri : setIdBackUri;

    Alert.alert(
      side === 'front' ? 'ID Card Front' : 'ID Card Back',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              toast.error('Camera permission is required.');
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.8,
            });

            if (!result.canceled && result.assets?.[0]?.uri) {
              setImage(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              toast.error('Gallery permission is required.');
              return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.8,
            });

            if (!result.canceled && result.assets?.[0]?.uri) {
              setImage(result.assets[0].uri);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true },
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!fullName.trim() || !email.trim() || !contentCategory.trim() || !contentLanguage.trim() || !country.trim() || reason.trim().length < 20) {
      toast.error('Please complete the creator application form.');
      return;
    }

    if (!idFrontUri || !idBackUri) {
      toast.error('Please add both ID card front and back images.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitCreatorApplication({
        fullName,
        email,
        ...(dateOfBirth.trim() ? { dateOfBirth } : {}),
        ...(occupationId ? { occupationId } : {}),
        ...(occupation.trim() ? { occupation } : {}),
        contentCategory,
        contentLanguage,
        country,
        reason,
      });
      toast.success('Creator application submitted.');
      router.replace('/screens/creator/pending');
    } catch (error) {
      toast.error(handleApiError(error, 'Creator application could not be submitted.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Creator Application" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 }}>
        <CustomInput
          label="Full Name NID"
          placeholder="Full name"
          placeholderTextColor="#555"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-black text-base"
          value={fullName}
          onChangeText={setFullName}
        />

        <CustomInput
          label="Email"
          placeholder="E-mail address or phone number"
          placeholderTextColor="#555"
          keyboardType="email-address"
          autoCapitalize="none"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-black text-base"
          value={email}
          onChangeText={setEmail}
        />

        <Pressable onPress={() => setShowDatePicker(true)}>
          <View pointerEvents="none">
            <CustomInput
              label="Date of birth"
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#555"
              rightIcon="calendar-outline"
              inputContainerStyle="bg-[#151515] border border-[#333]"
              className="text-black text-base flex-1"
              value={dateOfBirth}
              onChangeText={() => {}}
              editable={false}
            />
          </View>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={dateOfBirth ? new Date(`${dateOfBirth}T00:00:00.000Z`) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={(_, selectedDate) => {
              if (Platform.OS === 'android') {
                setShowDatePicker(false);
              }
              if (selectedDate) {
                setDateOfBirth(selectedDate.toISOString().slice(0, 10));
              }
            }}
          />
        )}

        <View className="mb-6">
          <Text className="text-white font-medium text-sm">
            ID Information<Text className="text-red-500">*</Text>
          </Text>
          <Text className="text-[#888] text-xs mt-1 mb-3">Please upload real and valid information</Text>
          
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Pressable
                onPress={() => pickIdImage('front')}
                className="bg-[#1A1A1A] border border-dashed border-[#555] rounded-xl h-28 items-center justify-center mb-2 overflow-hidden"
              >
                {idFrontUri ? (
                  <Image source={{ uri: idFrontUri }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="bg-[#111] p-2 rounded-full">
                    <Ionicons name="camera" size={24} color="#FFF" />
                  </View>
                )}
              </Pressable>
              <Text className="text-center text-[#888] text-xs">ID Card Front</Text>
            </View>

            <View className="flex-1">
              <Pressable
                onPress={() => pickIdImage('back')}
                className="bg-[#1A1A1A] border border-dashed border-[#555] rounded-xl h-28 items-center justify-center mb-2 overflow-hidden"
              >
                {idBackUri ? (
                  <Image source={{ uri: idBackUri }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="bg-[#111] p-2 rounded-full">
                    <Ionicons name="camera" size={24} color="#FFF" />
                  </View>
                )}
              </Pressable>
              <Text className="text-center text-[#888] text-xs">ID Card Back</Text>
            </View>
          </View>
        </View>

        <Pressable onPress={openOccupationSheet}>
          <View pointerEvents="none">
            <CustomInput
              label="Select occupation(Optional)"
              placeholder="Your profession"
              placeholderTextColor="#555"
              rightIcon="chevron-down"
              inputContainerStyle="bg-[#151515] border border-[#333]"
              className="text-black text-base"
              value={occupation}
              onChangeText={() => {}}
              editable={false}
            />
          </View>
        </Pressable>

        <CustomInput
          label="Content Category"
          placeholder="Music, Gaming, Education..."
          placeholderTextColor="#555"
          rightIcon="chevron-down"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-black text-base flex-1"
          value={contentCategory}
          onChangeText={setContentCategory}
        />

        <CustomInput
          label="Content Language"
          placeholder="Bangla, English..."
          placeholderTextColor="#555"
          rightIcon="chevron-down"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-black text-base flex-1"
          value={contentLanguage}
          onChangeText={setContentLanguage}
        />

        <CustomInput
          label="Country/Region"
          placeholder="Bangladesh"
          placeholderTextColor="#555"
          rightIcon="chevron-down"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-black text-base flex-1"
          value={country}
          onChangeText={setCountry}
        />

        <CustomInput
          label="Why do you want to become a Creator?"
          placeholder="Tell us about your passion..."
          placeholderTextColor="#555"
          multiline
          textAlignVertical="top"
          inputContainerStyle="bg-[#151515] border border-[#333] h-28"
          className="text-black text-base"
          value={reason}
          onChangeText={setReason}
        />

        <CustomButton 
          title={isSubmitting ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
          onPress={handleSubmit}
          disabled={isSubmitting}
          containerStyle="bg-[#E4FB52] mb-6"
          textStyle="text-black"
        />
        {isSubmitting ? (
          <View className="items-center -mt-3 mb-6">
            <ActivityIndicator color="#E4FB52" />
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={isOccupationSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOccupationSheetOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Pressable
            className="flex-1 bg-black/60 justify-end"
            onPress={() => {
              Keyboard.dismiss();
              setIsOccupationSheetOpen(false);
            }}
          >
            <Pressable
              className="bg-[#141414] rounded-t-3xl px-5 pt-5"
              style={{
                paddingBottom: Math.max(insets.bottom + 24, 32),
                marginBottom: Platform.OS === 'android' ? keyboardHeight : 0,
                maxHeight: keyboardHeight ? '68%' : '82%',
              }}
              onPress={() => undefined}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg font-inter-bold">Select occupation</Text>
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    setIsOccupationSheetOpen(false);
                  }}
                  className="h-9 w-9 rounded-full bg-[#242424] items-center justify-center"
                >
                  <Ionicons name="close" size={18} color="#FFF" />
                </Pressable>
              </View>

              <View className="bg-white rounded-xl px-4 h-12 flex-row items-center mb-4">
                <Ionicons name="search-outline" size={18} color="#555" />
                <TextInput
                  value={occupationQuery}
                  onChangeText={(text) => {
                    setOccupationQuery(text);
                    setOccupationId(undefined);
                  }}
                  placeholder="Search or type your occupation"
                  placeholderTextColor="#777"
                  className="flex-1 text-black ml-2"
                />
              </View>

              {isLoadingOccupations ? (
                <View className="py-6 items-center">
                  <ActivityIndicator color="#E4FB52" />
                </View>
              ) : (
                <ScrollView
                  className="max-h-72"
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {occupationOptions.map(item => (
                    <Pressable
                      key={item.id}
                      onPress={() => selectOccupation(item)}
                      className="py-3 border-b border-white/10 flex-row items-center justify-between"
                    >
                      <Text className="text-white text-base">{item.name}</Text>
                      {occupationId === item.id ? <Ionicons name="checkmark" size={20} color="#E4FB52" /> : null}
                    </Pressable>
                  ))}
                  {occupationQuery.trim().length >= 2 && !occupationOptions.some(item => item.name.toLowerCase() === occupationQuery.trim().toLowerCase()) ? (
                    <Pressable
                      onPress={createAndSelectOccupation}
                      className="mt-4 bg-[#E4FB52] rounded-xl h-12 items-center justify-center"
                    >
                      <Text className="text-black font-inter-bold">Create {occupationQuery.trim()}</Text>
                    </Pressable>
                  ) : null}
                </ScrollView>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
