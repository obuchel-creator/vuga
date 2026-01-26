import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './HomeScreen';
import ReportsScreen from './ReportsScreen';
import ProfileScreen from './ProfileScreen';
import HelpScreen from './HelpScreen';
import AnalyticsScreen from './AnalyticsScreen';
import AdminScreen from './AdminScreen';
import LeaderboardScreen from './LeaderboardScreen';
import BadgesScreen from './BadgesScreen';
import { VUGA_COLORS } from './vugaColors';
import TimelineScreen from './TimelineScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: true,
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Home') iconName = 'home';
            else if (route.name === 'Reports') iconName = 'list';
            else if (route.name === 'Profile') iconName = 'person';
            else if (route.name === 'Help') iconName = 'help-circle';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: VUGA_COLORS.light.primary,
          tabBarInactiveTintColor: '#888',
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Reports" component={ReportsScreen} />
        <Tab.Screen name="Timeline" component={TimelineScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        <Tab.Screen name="Help" component={HelpScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Tab.Screen name="Badges">
          {() => <BadgesScreen userId={1} />}
        </Tab.Screen>
        <Tab.Screen name="Admin" component={AdminScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
