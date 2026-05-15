import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import MatchScreen from '../screens/MatchScreen';
import ChatScreen from '../screens/ChatScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReviewScreen from '../screens/ReviewScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();

// Tab navigator (bottom tabs)
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Match: focused ? 'people' : 'people-outline',
            Chat: focused ? 'chatbubbles' : 'chatbubbles-outline',
            Schedule: focused ? 'calendar' : 'calendar-outline',
            Review: focused ? 'star' : 'star-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        headerShown: true,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Trang chủ', title: 'Trang chủ' }} />
      <Tab.Screen name="Match" component={MatchScreen} options={{ tabBarLabel: 'Ghép cặp', title: 'Ghép cặp kỹ năng' }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarLabel: 'Tin nhắn', title: 'Tin nhắn' }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ tabBarLabel: 'Lịch học', title: 'Lịch học' }} />
      <Tab.Screen name="Review" component={ReviewScreen} options={{ tabBarLabel: 'Đánh giá', title: 'Đánh giá' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Cá nhân', title: 'Hồ sơ cá nhân' }} />
    </Tab.Navigator>
  );
}

// Root stack (wraps tabs + chat room)
export default function AppNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <RootStack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={{ headerShown: true, title: 'Cuộc trò chuyện' }}
      />
    </RootStack.Navigator>
  );
}
