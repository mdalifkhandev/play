import { Image } from "expo-image";
import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "../../store";
import { Ionicons } from '@expo/vector-icons';

const TAB_ICONS = {
  homeActive: require('../../../assets/icon/home-active.svg'),
  homeInactive: require('../../../assets/icon/home-inactive.svg'),
  messageActive: require('../../../assets/icon/message-active.svg'),
  messageInactive: require('../../../assets/icon/message-inactive.svg'),
  create: require('../../../assets/icon/create1.svg'),
  notificationActive: require('../../../assets/icon/notification-active.svg'),
  notificationInactive: require('../../../assets/icon/notification-inactive.svg'),
  profileActive: require('../../../assets/icon/profile-active.svg'),
  profileInactive: require('../../../assets/icon/profile-inactive.svg'),
} as const;

function TabIcon({ source, color, size = 24 }: { source: number; color?: ColorValue; size?: number }) {
  return (
    <Image
      source={source}
      style={{ width: size, height: size, tintColor: color }}
      contentFit="contain"
      cachePolicy="memory-disk"
    />
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const isKidsModeActive = useAppStore((state) => state.isKidsModeActive);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: '#121212',
          borderTopWidth: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 10,
          marginBottom: 5
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#888888',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon source={focused ? TAB_ICONS.homeActive : TAB_ICONS.homeInactive} color={color} />
          ),
        }}
      />

      {/* Kids Mode Search Tab */}
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          href: isKidsModeActive ? '/(tab)/search' : null,
          tabBarIcon: ({ color }) => (
            <Ionicons name="search" size={24} color={color} />
          ),
        }}
      />

      {/* Normal Mode Tabs */}
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          href: !isKidsModeActive ? '/(tab)/inbox' : null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon source={focused ? TAB_ICONS.messageActive : TAB_ICONS.messageInactive} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          href: !isKidsModeActive ? '/(tab)/create' : null,
          tabBarIcon: () => (
            <Image source={TAB_ICONS.create} style={{ width: 50, height: 50, marginTop: 2 }} contentFit="contain" cachePolicy="memory-disk" />
          ),
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: 'Notification',
          href: !isKidsModeActive ? '/(tab)/notification' : null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon source={focused ? TAB_ICONS.notificationActive : TAB_ICONS.notificationInactive} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon source={focused ? TAB_ICONS.profileActive : TAB_ICONS.profileInactive} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="live"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
