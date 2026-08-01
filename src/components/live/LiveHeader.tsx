import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function LiveHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 16 }} className="flex-row items-center justify-center pb-4">
      <Text className="text-white text-lg font-bold">Live Stream</Text>
      <Pressable onPress={() => router.push('/screens/search' as any)} className="absolute right-4" style={{ top: insets.top + 10 }}>
        <Image
          source={require('../../../assets/icon/search.svg')}
          style={{ width: 24, height: 24 }}
          contentFit="contain"
        />
      </Pressable>
    </View>
  );
}
