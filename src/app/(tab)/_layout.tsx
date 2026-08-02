import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

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
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, focused }) => (
            <Image source={focused ? require('../../../assets/icon/message-active.svg') : require('../../../assets/icon/message-inactive.svg')} style={{ width: 24, height: 24, tintColor: color }} contentFit="contain" />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: () => (
            <Image source={require('../../../assets/icon/create.svg')} style={{ width: 50, height: 50, marginTop: 2 }} contentFit="contain" />
          ),
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: 'Notification',
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
