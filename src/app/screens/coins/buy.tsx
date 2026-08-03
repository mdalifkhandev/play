import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '../../../../src/components/ui/Header';
import { CustomButton } from '../../../../src/components/ui/CustomButton';

const CoinPackage = ({ 
  coins, 
  price, 
  isPopular, 
  selected, 
  onSelect 
}: { 
  coins: number, 
  price: string, 
  isPopular?: boolean, 
  selected: boolean, 
  onSelect: () => void 
}) => (
  <Pressable 
    onPress={onSelect}
    className={`w-[47%] bg-[#1C1C1E] rounded-2xl p-6 items-center border relative mb-4 ${selected ? 'border-[#98D83A]' : 'border-[#333]'}`}
  >
    {isPopular && (
      <View className="absolute -top-3 bg-[#98D83A] px-3 py-1 rounded-full z-10">
        <Text className="text-black text-[10px] font-inter-bold tracking-wider">POPULAR</Text>
      </View>
    )}
    
    <View className="w-10 h-10 rounded-full bg-[#2A2A2C] border border-[#444] items-center justify-center mb-4">
      <View className="w-6 h-6 rounded-full bg-[#FFD700] items-center justify-center">
        <Text className="text-black font-inter-bold text-xs">$</Text>
      </View>
    </View>
    
    <Text className="text-white text-xl font-inter-bold mb-1">{coins}</Text>
    <Text className="text-gray-400 text-xs font-inter-regular mb-4">COINS</Text>
    <Text className="text-[#98D83A] text-lg font-inter-bold">${price}</Text>
  </Pressable>
);

export default function BuyCoinsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  const packages = [
    { id: 1, coins: 100, price: "0.99" },
    { id: 2, coins: 500, price: "1.99", isPopular: true },
    { id: 3, coins: 1000, price: "3.99" },
    { id: 4, coins: 2000, price: "7.99" },
    { id: 5, coins: 5000, price: "19.99" },
    { id: 6, coins: 10000, price: "39.99" },
  ];

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}>
      <Header title="Buy Coins" />
      
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between">
          {packages.map((pkg) => (
            <CoinPackage 
              key={pkg.id}
              coins={pkg.coins}
              price={pkg.price}
              isPopular={pkg.isPopular}
              selected={selectedPackage === pkg.id}
              onSelect={() => setSelectedPackage(pkg.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View className="px-6 mt-4">
        <CustomButton 
          title="Continue" 
          variant="primary" 
          disabled={!selectedPackage}
          onPress={() => router.push('/screens/coins/payment-method')} 
        />
      </View>
    </View>
  );
}
