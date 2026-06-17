import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import type { AppTabParamList } from './types';
import { theme } from '../theme/theme';
import { CameraHomeScreen } from '../features/camera/screens/CameraHomeScreen';
import { TimelinePlaceholderScreen } from '../features/timeline/screens/TimelinePlaceholderScreen';
import { MemoriesPlaceholderScreen } from '../features/memories/screens/MemoriesPlaceholderScreen';
import { ExpenseListScreen } from '../features/expenses/screens/ExpenseListScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';

const Tab = createBottomTabNavigator<AppTabParamList>();

const tabBarStyle = {
  position: 'absolute' as const,
  backgroundColor: 'rgba(18, 24, 36, 0.88)',
  borderTopColor: 'rgba(255, 255, 255, 0.08)',
  borderTopWidth: 1,
  elevation: 0,
  shadowOpacity: 0,
  height: 72,
  paddingBottom: 12,
  paddingTop: 8,
};

export const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="CameraTab"
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.35)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600' as const,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="CameraTab"
        component={CameraHomeScreen}
        options={{
          tabBarLabel: '📷 Camera',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📷</Text>
          ),
        }}
      />
      <Tab.Screen
        name="TimelineTab"
        component={TimelinePlaceholderScreen}
        options={{
          tabBarLabel: 'Timeline',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>⏰</Text>
          ),
        }}
      />
      <Tab.Screen
        name="MemoriesTab"
        component={MemoriesPlaceholderScreen}
        options={{
          tabBarLabel: 'Kỷ niệm',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📅</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ExpensesTab"
        component={ExpenseListScreen}
        options={{
          tabBarLabel: 'Chi tiêu',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>💰</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};
