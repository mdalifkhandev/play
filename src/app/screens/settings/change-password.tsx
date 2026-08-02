import React, { useState } from 'react';
import { View, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../../components/ui/Header';
import { CustomInput } from '../../../components/inputs/CustomInput';
import { CustomButton } from '../../../components/ui/CustomButton';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdate = () => {
    // API call to update password
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }} className="px-6 pt-16">
        <Header showBackButton={true} title="Change Password" />

        <View className="mt-8">
          <CustomInput
            label="Current Password"
            placeholder="Enter old password"
            value={oldPassword}
            onChangeText={setOldPassword}
            isPassword
            containerStyle="mb-6"
          />

          <CustomInput
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            isPassword
            containerStyle="mb-6"
          />

          <CustomInput
            label="Conform Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            containerStyle="mb-10"
          />

          <CustomButton
            title="Update password"
            onPress={handleUpdate}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
