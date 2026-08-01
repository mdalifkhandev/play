import { Pressable, ScrollView, Text, View } from 'react-native';

export function LiveCategoryBar({ activeCategory, onSelect }: { activeCategory: string, onSelect: (c: string) => void }) {
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-2" contentContainerStyle={{ gap: 10 }}>
        {['All', 'Live', 'Watch', 'Recent Live'].map((cat) => (
          <Pressable
            key={cat}
            onPress={() => onSelect(cat)}
            className={`px-4 py-1.5 rounded-[4px] ${activeCategory === cat ? 'bg-[#98FF2F]' : 'bg-[#333333]'}`}
          >
            <Text className={`text-sm font-semibold ${activeCategory === cat ? 'text-black' : 'text-[#AAAAAA]'}`}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
