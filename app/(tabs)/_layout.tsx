import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

export default function TabLayout() {
  const router = useRouter();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/');
    });

    return () => sub.remove();
  }, []);

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: false }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/water-icon.jpg')}
              style={{
                width: 34,
                height: 34,
                opacity: focused ? 1 : 0.5,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="pantry"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/basket-icon.jpg')}
              style={{
                width: 26,
                height: 26,
                opacity: focused ? 1 : 0.5,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/palm-icon.png')}
              style={{
                width: 28,
                height: 28,
                opacity: focused ? 1 : 0.5,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}

