import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts, Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold } from '@expo-google-fonts/barlow';
import { BarlowCondensed_600SemiBold, BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import { useAuth } from './auth';
import { C, F } from './ui/theme';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import BookingsScreen from './screens/BookingsScreen';
import TurfSettings from './screens/TurfSettings';
import ProfileScreen from './screens/ProfileScreen';
import UpiDetails from './screens/UpiDetails';
import GalleryImage from './screens/GalleryImage';
import PitchScreen from './screens/PitchScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.field, primary: C.turf } };
const TAB_ICON = { Dashboard: 'speedometer', Bookings: 'ticket', Turf: 'football', Profile: 'person-circle' };

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: C.turf,
        tabBarInactiveTintColor: '#8C978F',
        tabBarLabelStyle: { fontFamily: F.medium, fontSize: 12 },
        tabBarStyle: { borderTopColor: C.line },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={focused ? TAB_ICON[route.name] : `${TAB_ICON[route.name]}-outline`} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Turf" component={TurfSettings} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const greenHeader = {
  headerShown: true,
  headerStyle: { backgroundColor: C.turf },
  headerTintColor: C.chalk,
  headerTitleStyle: { fontFamily: F.display, fontSize: 22 },
  headerShadowVisible: false,
  headerBackTitle: 'Back',
};

export default function App() {
  const { ready, user } = useAuth();
  const [fontsLoaded] = useFonts({ Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold, BarlowCondensed_600SemiBold, BarlowCondensed_700Bold });

  if (!ready || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.turf }}>
        <ActivityIndicator size="large" color={C.flood} />
      </View>
    );
  }
  // Signed-in and signed-out screens are separate trees, so logging in/out swaps them automatically.
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={Tabs} />
            <Stack.Screen name="Upi" component={UpiDetails} options={{ ...greenHeader, title: 'UPI payments' }} />
            <Stack.Screen name="Gallery" component={GalleryImage} options={{ ...greenHeader, title: 'Venue photos' }} />
            <Stack.Screen name="Pitch" component={PitchScreen} options={({ route }) => ({ ...greenHeader, title: route.params?.id ? 'Edit turf' : 'Add a turf' })} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
