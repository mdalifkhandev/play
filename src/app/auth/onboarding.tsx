import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Dimensions, Image, Text, View } from "react-native";
import PagerView from "react-native-pager-view";

const { width } = Dimensions.get("window");

export default function Onboarding() {
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const goToNextPage = () => {
    if (currentPage < 2) {
      pagerRef.current?.setPage(currentPage + 1);
    } else {
      router.push("/auth/login");
    }
  };

  return (
    <View className="flex-1 bg-[#121212]">
      {/* @ts-expect-error - React 19 types mismatch with PagerView */}
      <PagerView
        style={{ flex: 1 }}
        initialPage={0}
        ref={pagerRef}
        onPageSelected={(e: any) => setCurrentPage(e.nativeEvent.position)}
      >
        {/* Screen 2: Loading/Welcome */}

        <View key="1" className="flex-1 bg-[#121212] py-10">
          {/* Center Logo + Text */}
          <View className="flex-1 items-center justify-center mt-12">
            <View className="flex-row items-center">
              <Image
                source={require('../../../assets/images/icon.png')}
                style={{ width: 60, height: 60, resizeMode: 'contain' }}
                className="mr-2"
              />
              <Text className="text-[36px] font-inter-semibold  text-[#DFFD53]">
                Play
              </Text>
            </View>
          </View>

          {/* Bottom Dots */}
          <View className="items-center pb-24">
            <View className="flex-row gap-2">
              <View className="w-6 h-6 rounded-full bg-[#98D83A]" />
              <View className="w-6 h-6 rounded-full bg-gray-500" />
              <View className="w-6 h-6 rounded-full bg-gray-500" />
            </View>
          </View>
        </View>

        {/* Screen 3: Top 10 Cars */}
        <View key="2" className="flex-1 bg-[#121212]">
          <Image
            source={require('../../../assets/images/top10.png')}
            style={{ width: '100%', height: '100%', resizeMode: 'contain', position: 'absolute' }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(18,18,18,0.8)', '#121212']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%' }}
          />

        </View>

        {/* Screen 4: Scholarship */}
        <View key="3" className="flex-1 bg-[#121212]">
          <Image
            source={require('../../../assets/images/scholarship.png')}
            style={{ width: '100%', height: '100%', resizeMode: 'contain', position: 'absolute' }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(18,18,18,0.8)', '#121212']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%' }}
          />

        </View>
      </PagerView>


    </View>
  );
}
