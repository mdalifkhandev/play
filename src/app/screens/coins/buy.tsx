import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '../../../../src/components/ui/Header';
import { CustomButton } from '../../../../src/components/ui/CustomButton';
import { getCoinPackages, type CoinPackage as CoinPackageType } from '../../../../src/api/coins/coins.api';

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
  const [selectedPackage, setSelectedPackage] = useState<CoinPackageType | null>(null);
  const [packages, setPackages] = useState<CoinPackageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPackages = async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    return getCoinPackages()
      .then(items => {
        setPackages(items);
        setSelectedPackage(current => {
          if (current && items.some(item => item.id === current.id)) {
            return items.find(item => item.id === current.id) || current;
          }
          return items.find(item => item.isPopular) || items[0] || null;
        });
      })
      .catch(error => console.log('Coin packages load failed:', error))
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    let mounted = true;

    loadPackages().finally(() => {
      if (!mounted) return;
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}>
      <Header title="Buy Coins" />
      
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadPackages(true)} tintColor="#98FF2F" />
        }
      >
        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator color="#98FF2F" />
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {packages.map((pkg) => (
              <CoinPackage 
                key={pkg.id}
                coins={pkg.coins}
                price={pkg.price.toFixed(2)}
                isPopular={pkg.isPopular}
                selected={selectedPackage?.id === pkg.id}
                onSelect={() => setSelectedPackage(pkg)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View className="px-6 mt-4">
        <CustomButton 
          title="Continue" 
          variant="primary" 
          disabled={!selectedPackage}
          onPress={() => {
            if (!selectedPackage) return;
            router.push({
              pathname: '/screens/coins/payment-method',
              params: {
                packageId: selectedPackage.id,
                coins: String(selectedPackage.coins),
                price: selectedPackage.price.toFixed(2),
                currency: selectedPackage.currency,
              },
            });
          }} 
        />
      </View>
    </View>
  );
}
