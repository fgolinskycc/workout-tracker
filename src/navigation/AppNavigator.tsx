import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/HomeScreen';
import { WorkoutScreen } from '../screens/WorkoutScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { WorkoutDetailScreen } from '../screens/WorkoutDetailScreen';
import { COLORS, FONT_SIZES } from '../constants/theme';
import { RootTabParamList, RootStackParamList } from '../types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<
  keyof RootTabParamList,
  { active: IoniconsName; inactive: IoniconsName }
> = {
  Home:     { active: 'home',        inactive: 'home-outline' },
  Workout:  { active: 'barbell',     inactive: 'barbell-outline' },
  History:  { active: 'time',        inactive: 'time-outline' },
  Progress: { active: 'trending-up', inactive: 'trending-up-outline' },
};

const TabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerStyle: {
        backgroundColor: COLORS.surface,
        shadowColor: 'transparent',
        elevation: 0,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      },
      headerTintColor: COLORS.text,
      headerTitleStyle: {
        fontWeight: '700',
        fontSize: FONT_SIZES.lg,
        color: COLORS.text,
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: {
        backgroundColor: COLORS.tabBar,
        borderTopColor: COLORS.border,
        borderTopWidth: 1,
        paddingTop: 4,
      },
      tabBarLabelStyle: { fontSize: FONT_SIZES.xs, fontWeight: '600' },
      tabBarHideOnKeyboard: true,
      tabBarIcon: ({ focused, color, size }) => {
        const icons = TAB_ICONS[route.name as keyof RootTabParamList];
        const name = focused ? icons.active : icons.inactive;
        return <Ionicons name={name} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
    <Tab.Screen name="Workout" component={WorkoutScreen} options={{ title: 'Log Workout', headerShown: false }} />
    <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
    <Tab.Screen name="Progress" component={ProgressScreen} options={{ title: 'Progress' }} />
  </Tab.Navigator>
);

export const AppNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tabs" component={TabNavigator} />
    <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
  </Stack.Navigator>
);
