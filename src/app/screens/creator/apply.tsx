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
import {
  createCreatorCategory,
  createOccupation,
  getCreatorEligibility,
  getCreatorCategories,
  getOccupations,
  submitCreatorApplication,
  uploadCreatorDocument,
  type CreatorCategory,
  type Occupation,
} from '../../../api/creators';
import { handleApiError } from '../../../api/client';
import { FeatureGuard } from '../../../components/settings/FeatureGuard';
import { useAppStore } from '../../../store';
import { useKeyboardBottomInset } from '../../../hooks/common/useKeyboardBottomInset';

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
  const [contentCategoryId, setContentCategoryId] = useState<string | undefined>();
  const [categoryQuery, setCategoryQuery] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<CreatorCategory[]>([]);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [contentLanguage, setContentLanguage] = useState('');
  const [contentLanguageCode, setContentLanguageCode] = useState<string | undefined>();
  const [languageQuery, setLanguageQuery] = useState('');
  const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false);
  const [country, setCountry] = useState('');
  const [countryCode, setCountryCode] = useState<string | undefined>();
  const [countryQuery, setCountryQuery] = useState('');
  const [isCountrySheetOpen, setIsCountrySheetOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('Submitting application...');
  const [submitProgress, setSubmitProgress] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [idFrontUri, setIdFrontUri] = useState<string | null>(null);
  const [idBackUri, setIdBackUri] = useState<string | null>(null);
  const [isCheckingApplication, setIsCheckingApplication] = useState(true);
  const keyboardHeight = useKeyboardBottomInset();

  React.useEffect(() => {
    let isMounted = true;

    const checkExistingApplication = async () => {
      try {
        const eligibility = await getCreatorEligibility();
        if (!isMounted) return;

        if (eligibility.status === 'pending' || eligibility.status === 'held') {
          router.replace('/screens/creator/pending');
          return;
        }

        if (eligibility.status === 'approved') {
          router.replace('/screens/creator/success');
          return;
        }

        if (!eligibility.canApply && eligibility.status !== 'rejected') {
          router.replace('/screens/creator/criteria');
          return;
        }
      } catch (error) {
        console.log('Creator application status check failed:', handleApiError(error, 'Could not check creator status.'));
      } finally {
        if (isMounted) setIsCheckingApplication(false);
      }
    };

    void checkExistingApplication();

    return () => {
      isMounted = false;
    };
  }, [router]);

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

  const loadCategories = React.useCallback(async (query = '') => {
    setIsLoadingCategories(true);
    try {
      const result = await getCreatorCategories(query);
      setCategoryOptions(result.items || []);
    } catch (error) {
      console.log('Category list failed:', handleApiError(error, 'Could not load categories.'));
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isOccupationSheetOpen) return;

    const timer = setTimeout(() => {
      loadOccupations(occupationQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [isOccupationSheetOpen, loadOccupations, occupationQuery]);

  React.useEffect(() => {
    if (!isCategorySheetOpen) return;

    const timer = setTimeout(() => {
      loadCategories(categoryQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [categoryQuery, isCategorySheetOpen, loadCategories]);

  const openOccupationSheet = () => {
    setOccupationQuery(occupation);
    setIsOccupationSheetOpen(true);
  };

  const openCategorySheet = () => {
    setCategoryQuery(contentCategory);
    setIsCategorySheetOpen(true);
  };

  const openLanguageSheet = () => {
    setLanguageQuery(contentLanguage);
    setIsLanguageSheetOpen(true);
  };

  const openCountrySheet = () => {
    setCountryQuery(country);
    setIsCountrySheetOpen(true);
  };

  const selectOccupation = (item: Occupation) => {
    setOccupation(item.name);
    setOccupationId(item.id);
    setOccupationQuery(item.name);
    Keyboard.dismiss();
    setIsOccupationSheetOpen(false);
  };

  const selectCategory = (item: CreatorCategory) => {
    setContentCategory(item.name);
    setContentCategoryId(item.id);
    setCategoryQuery(item.name);
    Keyboard.dismiss();
    setIsCategorySheetOpen(false);
  };

  const selectLanguage = (item: FixedOption) => {
    setContentLanguage(item.name);
    setContentLanguageCode(item.code);
    setLanguageQuery(item.name);
    Keyboard.dismiss();
    setIsLanguageSheetOpen(false);
  };

  const selectCountry = (item: FixedOption) => {
    setCountry(item.name);
    setCountryCode(item.code);
    setCountryQuery(item.name);
    Keyboard.dismiss();
    setIsCountrySheetOpen(false);
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

  const createAndSelectCategory = async () => {
    const name = categoryQuery.trim();
    if (name.length < 2) {
      toast.error('Please enter a valid category.');
      return;
    }

    try {
      setIsLoadingCategories(true);
      const item = await createCreatorCategory(name);
      selectCategory(item);
    } catch (error) {
      toast.error(handleApiError(error, 'Could not save category.'));
    } finally {
      setIsLoadingCategories(false);
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

    const missingFields: string[] = [];
    if (!fullName.trim()) missingFields.push('Full name');
    if (!email.trim()) missingFields.push('Email');
    if (!contentCategory.trim()) missingFields.push('Content category');
    if (!contentLanguage.trim()) missingFields.push('Content language');
    if (!country.trim()) missingFields.push('Country/Region');
    if (!reason.trim()) missingFields.push('Reason');

    if (missingFields.length) {
      toast.error(`Please complete: ${missingFields.join(', ')}`);
      return;
    }

    if (reason.trim().length < 20) {
      toast.error('Please write at least 20 characters in reason.');
      return;
    }

    if (!idFrontUri || !idBackUri) {
      toast.error('Please add both ID card front and back images.');
      return;
    }

    setIsSubmitting(true);
    setSubmitProgress(0);
    setSubmitMessage('Checking creator eligibility...');
    try {
      const eligibility = await getCreatorEligibility();

      if (!eligibility.canApply) {
        const incompleteRequirements = eligibility.requirements
          .filter(item => item.enabled !== false && !item.complete)
          .map(item => item.title);
        toast.error(
          incompleteRequirements.length
            ? `Complete these first: ${incompleteRequirements.join(', ')}`
            : 'Creator requirements are not complete yet.',
        );
        router.replace('/screens/creator/criteria');
        return;
      }

      setSubmitProgress(5);
      setSubmitMessage('Uploading ID card front...');
      const idFrontUrl = await uploadCreatorDocument(idFrontUri, progress => {
        setSubmitProgress(Math.min(45, Math.round(progress * 0.45)));
      });

      setSubmitMessage('Uploading ID card back...');
      const idBackUrl = await uploadCreatorDocument(idBackUri, progress => {
        setSubmitProgress(45 + Math.min(45, Math.round(progress * 0.45)));
      });

      setSubmitMessage('Submitting application...');
      setSubmitProgress(95);
      await submitCreatorApplication({
        fullName: fullName.trim(),
        email: email.trim(),
        ...(dateOfBirth.trim() ? { dateOfBirth } : {}),
        ...(occupationId ? { occupationId } : {}),
        ...(occupation.trim() ? { occupation: occupation.trim() } : {}),
        ...(contentCategoryId ? { contentCategoryId } : {}),
        contentCategory: contentCategory.trim(),
        ...(contentLanguageCode ? { contentLanguageCode } : {}),
        contentLanguage: contentLanguage.trim(),
        ...(countryCode ? { countryCode } : {}),
        country: country.trim(),
        reason: reason.trim(),
        idFrontUrl,
        idBackUrl,
      });
      setSubmitProgress(100);
      toast.success('Creator application submitted.');
      router.replace('/screens/creator/pending');
    } catch (error) {
      toast.error(handleApiError(error, 'Creator application could not be submitted.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FeatureGuard feature="creatorApplications" title="Creator applications are unavailable">
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Creator Application" />

      {isCheckingApplication ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E4FB52" />
          <Text className="mt-3 text-[#888] text-sm">Checking application status...</Text>
        </View>
      ) : (
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: Math.max(insets.bottom + keyboardHeight + 120, 140),
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
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

        <Pressable onPress={openCategorySheet}>
          <View pointerEvents="none">
            <CustomInput
              label="Content Category"
              placeholder="Music, Gaming, Education..."
              placeholderTextColor="#555"
              rightIcon="chevron-down"
              inputContainerStyle="bg-[#151515] border border-[#333]"
              className="text-black text-base"
              value={contentCategory}
              onChangeText={() => {}}
              editable={false}
            />
          </View>
        </Pressable>

        <Pressable onPress={openLanguageSheet}>
          <View pointerEvents="none">
            <CustomInput
              label="Content Language"
              placeholder="Bangla, English..."
              placeholderTextColor="#555"
              rightIcon="chevron-down"
              inputContainerStyle="bg-[#151515] border border-[#333]"
              className="text-black text-base"
              value={contentLanguage}
              onChangeText={() => {}}
              editable={false}
            />
          </View>
        </Pressable>

        <Pressable onPress={openCountrySheet}>
          <View pointerEvents="none">
            <CustomInput
              label="Country/Region"
              placeholder="Bangladesh"
              placeholderTextColor="#555"
              rightIcon="chevron-down"
              inputContainerStyle="bg-[#151515] border border-[#333]"
              className="text-black text-base"
              value={country}
              onChangeText={() => {}}
              editable={false}
            />
          </View>
        </Pressable>

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
          title="SUBMIT APPLICATION"
          onPress={handleSubmit}
          disabled={isSubmitting}
          isLoading={isSubmitting}
          containerStyle="bg-[#E4FB52] mb-6"
          textStyle="text-black"
        />
      </ScrollView>
      )}

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

      <Modal
        visible={isCategorySheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCategorySheetOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Pressable
            className="flex-1 bg-black/60 justify-end"
            onPress={() => {
              Keyboard.dismiss();
              setIsCategorySheetOpen(false);
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
                <Text className="text-white text-lg font-inter-bold">Select category</Text>
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    setIsCategorySheetOpen(false);
                  }}
                  className="h-9 w-9 rounded-full bg-[#242424] items-center justify-center"
                >
                  <Ionicons name="close" size={18} color="#FFF" />
                </Pressable>
              </View>

              <View className="bg-white rounded-xl px-4 h-12 flex-row items-center mb-4">
                <Ionicons name="search-outline" size={18} color="#555" />
                <TextInput
                  value={categoryQuery}
                  onChangeText={(text) => {
                    setCategoryQuery(text);
                    setContentCategoryId(undefined);
                  }}
                  placeholder="Search or type your category"
                  placeholderTextColor="#777"
                  className="flex-1 text-black ml-2"
                />
              </View>

              {isLoadingCategories ? (
                <View className="py-6 items-center">
                  <ActivityIndicator color="#E4FB52" />
                </View>
              ) : (
                <ScrollView
                  className="max-h-72"
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {categoryOptions.map(item => (
                    <Pressable
                      key={item.id}
                      onPress={() => selectCategory(item)}
                      className="py-3 border-b border-white/10 flex-row items-center justify-between"
                    >
                      <Text className="text-white text-base">{item.name}</Text>
                      {contentCategoryId === item.id ? <Ionicons name="checkmark" size={20} color="#E4FB52" /> : null}
                    </Pressable>
                  ))}
                  {categoryQuery.trim().length >= 2 && !categoryOptions.some(item => item.name.toLowerCase() === categoryQuery.trim().toLowerCase()) ? (
                    <Pressable
                      onPress={createAndSelectCategory}
                      className="mt-4 bg-[#E4FB52] rounded-xl h-12 items-center justify-center"
                    >
                      <Text className="text-black font-inter-bold">Create {categoryQuery.trim()}</Text>
                    </Pressable>
                  ) : null}
                </ScrollView>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <FixedOptionSheet
        visible={isLanguageSheetOpen}
        title="Select language"
        query={languageQuery}
        onQueryChange={(text) => {
          setLanguageQuery(text);
          setContentLanguageCode(undefined);
        }}
        placeholder="Search language"
        options={LANGUAGE_OPTIONS}
        selectedCode={contentLanguageCode}
        keyboardHeight={keyboardHeight}
        bottomInset={insets.bottom}
        onClose={() => {
          Keyboard.dismiss();
          setIsLanguageSheetOpen(false);
        }}
        onSelect={selectLanguage}
      />

      <FixedOptionSheet
        visible={isCountrySheetOpen}
        title="Select country"
        query={countryQuery}
        onQueryChange={(text) => {
          setCountryQuery(text);
          setCountryCode(undefined);
        }}
        placeholder="Search country"
        options={COUNTRY_OPTIONS}
        selectedCode={countryCode}
        keyboardHeight={keyboardHeight}
        bottomInset={insets.bottom}
        onClose={() => {
          Keyboard.dismiss();
          setIsCountrySheetOpen(false);
        }}
        onSelect={selectCountry}
      />

      {isSubmitting ? (
        <View className="absolute inset-0 bg-black/60 items-center justify-center px-8">
          <View className="bg-[#171717] border border-white/10 rounded-2xl px-6 py-5 items-center w-full max-w-sm">
            <ActivityIndicator color="#E4FB52" size="large" />
            <Text className="text-white font-inter-bold text-base mt-4">{submitMessage}</Text>
            <Text className="text-[#A0A0A0] text-sm text-center mt-2">
              Please wait while we send your creator information.
            </Text>
            <View className="w-full h-2 rounded-full bg-white/10 mt-4 overflow-hidden">
              <View
                className="h-full rounded-full bg-[#E4FB52]"
                style={{ width: `${Math.max(5, submitProgress)}%` }}
              />
            </View>
            <Text className="text-[#E4FB52] text-xs font-inter-semibold mt-2">{submitProgress}%</Text>
          </View>
        </View>
      ) : null}
    </View>
    </FeatureGuard>
  );
}

type FixedOption = {
  code: string;
  name: string;
};

function FixedOptionSheet({
  visible,
  title,
  query,
  onQueryChange,
  placeholder,
  options,
  selectedCode,
  keyboardHeight,
  bottomInset,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  query: string;
  onQueryChange: (text: string) => void;
  placeholder: string;
  options: FixedOption[];
  selectedCode?: string;
  keyboardHeight: number;
  bottomInset: number;
  onClose: () => void;
  onSelect: (item: FixedOption) => void;
}) {
  const filteredOptions = React.useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return options;
    return options.filter(item =>
      item.name.toLowerCase().includes(search) ||
      item.code.toLowerCase().includes(search)
    );
  }, [options, query]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
          <Pressable
            className="bg-[#141414] rounded-t-3xl px-5 pt-5"
            style={{
              paddingBottom: Math.max(bottomInset + 24, 32),
              marginBottom: Platform.OS === 'android' ? keyboardHeight : 0,
              maxHeight: keyboardHeight ? '68%' : '82%',
            }}
            onPress={() => undefined}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-inter-bold">{title}</Text>
              <Pressable onPress={onClose} className="h-9 w-9 rounded-full bg-[#242424] items-center justify-center">
                <Ionicons name="close" size={18} color="#FFF" />
              </Pressable>
            </View>

            <View className="bg-white rounded-xl px-4 h-12 flex-row items-center mb-4">
              <Ionicons name="search-outline" size={18} color="#555" />
              <TextInput
                value={query}
                onChangeText={onQueryChange}
                placeholder={placeholder}
                placeholderTextColor="#777"
                className="flex-1 text-black ml-2"
              />
            </View>

            <ScrollView className="max-h-80" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {filteredOptions.map(item => (
                <Pressable
                  key={item.code}
                  onPress={() => onSelect(item)}
                  className="py-3 border-b border-white/10 flex-row items-center justify-between"
                >
                  <Text className="text-white text-base">
                    {item.name}
                  </Text>
                  {selectedCode === item.code ? <Ionicons name="checkmark" size={20} color="#E4FB52" /> : null}
                </Pressable>
              ))}
              {!filteredOptions.length ? (
                <Text className="text-[#888] text-sm text-center py-6">No result found.</Text>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const LANGUAGE_OPTIONS: FixedOption[] = [
  { code: 'bn', name: 'Bangla' },
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ar', name: 'Arabic' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'tr', name: 'Turkish' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

const COUNTRY_OPTIONS: FixedOption[] = [
  { code: 'BD', name: 'Bangladesh' },
  { code: 'IN', name: 'India' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'NP', name: 'Nepal' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'SG', name: 'Singapore' },
];
