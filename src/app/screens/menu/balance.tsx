import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomButton } from '../../../components/ui/CustomButton';
import { Header } from '../../../components/ui/Header';

export default function BalanceScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'All' | 'Live Gifts'>('All');

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Balance" />
      
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Estimate Balance Section */}
        <View className="items-center mt-6">
          <Pressable className="flex-row items-center mb-4">
            <Text className="text-[#888] text-sm mr-1">Estimate balance USD</Text>
            <Ionicons name="caret-down" size={14} color="#888" />
          </Pressable>
          <Text className="text-white text-6xl font-bold font-inter-bold mb-8">0.00</Text>
          
          <CustomButton 
            title="Withdraw Balance" 
            onPress={() => {}}
            containerStyle="w-full bg-[#A3E635]"
            textStyle="text-black"
          />
        </View>

        {/* Tabs */}
        <View className="flex-row items-center mt-8 mb-4">
          <Pressable 
            onPress={() => setActiveTab('All')}
            className={`px-4 py-1 rounded-md mr-3 ${activeTab === 'All' ? 'bg-[#A3E635]' : 'bg-[#333]'}`}
          >
            <Text className={`text-sm ${activeTab === 'All' ? 'text-black' : 'text-[#888]'}`}>All</Text>
          </Pressable>
          
          <Pressable 
            onPress={() => setActiveTab('Live Gifts')}
            className={`px-4 py-1 rounded-md ${activeTab === 'Live Gifts' ? 'bg-[#A3E635]' : 'bg-[#333]'}`}
          >
            <Text className={`text-sm ${activeTab === 'Live Gifts' ? 'text-black' : 'text-[#888]'}`}>Live Gifts</Text>
          </Pressable>
        </View>

        {/* Transactions */}
        <Pressable className="flex-row items-center justify-between bg-[#151515] p-4 rounded-xl border border-[#222]">
          <Text className="text-white text-base font-medium">Transactions</Text>
          <View className="flex-row items-center">
            <Text className="text-[#888] text-sm mr-1">View all</Text>
            <Ionicons name="chevron-forward" size={16} color="#888" />
          </View>
        </Pressable>

        {/* Services */}
        <View className="mt-8">
          <Text className="text-[#888] text-sm mb-4">Services</Text>
          <Pressable className="bg-[#151515] p-6 rounded-xl border border-[#222] items-center justify-center">
            <Ionicons name="stats-chart" size={24} color="white" className="mb-2" />
            <Text className="text-white text-base font-medium mt-2">Monetisation</Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}
