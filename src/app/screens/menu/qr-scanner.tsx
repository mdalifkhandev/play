import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QRScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);

    // Expected deep link format: play://screens/user/[userId]
    if (data.startsWith('play://screens/user/')) {
      const userId = data.replace('play://screens/user/', '');
      if (userId) {
        // Replace current screen with user profile to prevent huge back stacks
        router.replace(`/screens/user/${userId}`);
        return;
      }
    }

    // If it's another play:// link or an unrecognized QR code
    alert(`Scanned code: ${data}`);
    setTimeout(() => setScanned(false), 2000);
  };

  if (hasPermission === null) {
    return (
      <View className="flex-1 bg-[#0A0A0A] items-center justify-center">
        <Text className="text-white">Requesting camera permission...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View className="flex-1 bg-[#0A0A0A] items-center justify-center p-6">
        <Text className="text-white text-center mb-4">No access to camera</Text>
        <Pressable 
          onPress={() => router.back()}
          className="bg-[#151515] py-3 px-6 rounded-xl border border-[#333]"
        >
          <Text className="text-white font-medium">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black relative">
      <CameraView
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      
      {/* Overlay to focus scanning area */}
      <View className="absolute inset-0 bg-black/60">
        <View className="flex-1" />
        <View className="flex-row">
          <View className="flex-1" />
          {/* Scanner square */}
          <View className="w-64 h-64 border-2 border-[#98FF2F] rounded-3xl bg-transparent" />
          <View className="flex-1" />
        </View>
        <View className="flex-1" />
      </View>

      {/* Header Back Button */}
      <View style={{ paddingTop: insets.top }} className="absolute top-0 left-0 right-0 px-4 py-3 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="p-2 bg-black/50 rounded-full w-10 h-10 items-center justify-center">
          <Ionicons name="close" size={24} color="white" />
        </Pressable>
        <Text className="text-white font-bold text-lg shadow-sm">Scan QR Code</Text>
        <View className="w-10" />
      </View>

      {/* Footer Text */}
      <View style={{ paddingBottom: Math.max(insets.bottom, 24) }} className="absolute bottom-0 left-0 right-0 items-center p-8">
        <Text className="text-white text-center opacity-80 text-base font-medium">
          Align the QR code within the frame to scan
        </Text>
      </View>

      {/* Rescan button if something went wrong */}
      {scanned && (
        <View className="absolute bottom-32 left-0 right-0 items-center">
          <Pressable 
            onPress={() => setScanned(false)}
            className="bg-[#98FF2F] py-3 px-8 rounded-full"
          >
            <Text className="text-black font-bold">Tap to Scan Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
