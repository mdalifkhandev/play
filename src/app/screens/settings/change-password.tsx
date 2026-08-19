import React, { useState } from 'react';
import { View, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../../components/ui/Header';
import { CustomInput } from '../../../components/inputs/CustomInput';
import { CustomButton } from '../../../components/ui/CustomButton';
import { changePassword } from '../../../api/auth/auth.api';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../../store';
import { toast } from 'sonner-native';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAppStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        currentPassword: oldPassword,
        newPassword,
        confirmPassword,
      });
      toast.success('Password changed successfully!');
      
      // Clear inputs
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to change password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
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
            isLoading={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
