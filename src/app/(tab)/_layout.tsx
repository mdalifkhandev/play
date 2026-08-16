import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "../../store";
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const isKidsModeActive = useAppStore((state) => state.isKidsModeActive);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
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
            <Image source={focused ? require('../../../assets/icon/home-active.svg') : require('../../../assets/icon/home-inactive.svg')} style={{ width: 24, height: 24, tintColor: color }} contentFit="contain" />
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
            <Image source={focused ? require('../../../assets/icon/message-active.svg') : require('../../../assets/icon/message-inactive.svg')} style={{ width: 24, height: 24, tintColor: color }} contentFit="contain" />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          href: !isKidsModeActive ? '/(tab)/create' : null,
          tabBarIcon: () => (
            <Image source={require('../../../assets/icon/create1.svg')} style={{ width: 50, height: 50, marginTop: 2 }} contentFit="contain" />
          ),
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: 'Notification',
          href: !isKidsModeActive ? '/(tab)/notification' : null,
          tabBarIcon: ({ color, focused }) => (
            <Image source={focused ? require('../../../assets/icon/notification-active.svg') : require('../../../assets/icon/notification-inactive.svg')} style={{ width: 24, height: 24, tintColor: color }} contentFit="contain" />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Image source={focused ? require('../../../assets/icon/profile-active.svg') : require('../../../assets/icon/profile-inactive.svg')} style={{ width: 24, height: 24, tintColor: color }} contentFit="contain" />
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
