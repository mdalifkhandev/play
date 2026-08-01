import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { LiveCategoryBar } from '../../components/live/LiveCategoryBar';
import { LiveGridItem, LiveStreamData } from '../../components/live/LiveGridItem';
import { LiveHeader } from '../../components/live/LiveHeader';

export const MOCK_LIVES: LiveStreamData[] = [
  {
    id: '1',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
    hostName: 'Motin',
    hostAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100',
    viewers: '12k',
    badge: 'Live',
    isVideo: true,
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4'
  },
  {
    id: '2',
    thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400',
    hostName: 'Motin',
    hostAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100',
    viewers: '12k',
    badge: 'Live',
    isVideo: true,
    videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4'
  },
  {
    id: '3',
    thumbnail: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400',
    hostName: 'Tèvas',
    hostAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    viewers: '12k',
    badge: 'Live',
    isVideo: true,
    videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4'
  },
  {
    id: '4',
    thumbnail: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
    hostName: 'Tèvas',
    hostAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    viewers: '12k',
    badge: 'Live',
    isVideo: true,
    videoUrl: 'https://media.w3.org/2010/05/bunny/trailer.mp4'
  },
  {
    id: '5',
    thumbnail: 'https://images.unsplash.com/photo-1616012480717-fd9867059ca0?w=400',
    hostName: 'Justin',
    hostAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100',
    viewers: '12k',
    badge: 'Live',
    isVideo: true,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
  },
  {
    id: '6',
    thumbnail: 'https://images.unsplash.com/photo-1546514714-df0ccc50d7bf?w=400',
    hostName: 'Pickett',
    hostAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100',
    viewers: '12k',
    badge: 'Top like',
    isVideo: true,
    videoUrl: 'https://media.w3.org/2010/05/video/movie_300.mp4'
  },
];

export default function LiveAllScreen() {
  const [activeCat, setActiveCat] = useState('All');

  return (
    <View className="flex-1 bg-black">
      <LiveHeader />
      <LiveCategoryBar activeCategory={activeCat} onSelect={setActiveCat} />

      <FlatList
        data={MOCK_LIVES}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 8, paddingBottom: 20 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) => <LiveGridItem item={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
