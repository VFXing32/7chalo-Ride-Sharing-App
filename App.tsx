import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enableScreens } from 'react-native-screens';
import { NotificationProvider } from './context/NotificationContext';
import AppSplash from './src/utilscreens/AppSplash';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import CodeScreen from './src/screens/Code';
import DetailsScreen from './src/screens/Details';
import SelectionScreen from './src/screens/Selection';
import PostRide from './src/screens/PostRide';
import CheckRidesScreen from './src/screens/CheckRides';
import ShowRidesScreen from './src/screens/ShowRides';
import MenuScreen from './src/screens/Menu'
import EditRide from './src/screens/EditRide';
import RequestsScreen from './src/screens/Requests';
import Profile from './src/screens/Profile';
import Questions from './src/screens/Questions';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

enableScreens();

const Stack = createNativeStackNavigator();

const App = () => {
  const [initialRoute, setInitialRoute] = useState<string>('Home'); // Default fallback to 'Home'
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Check for token and role in AsyncStorage
  useEffect(() => {
    const checkAuthAndRole = async () => {
      try {
        const token = await AsyncStorage.getItem('@7chalo:token');
        const role = await AsyncStorage.getItem('@7chalo:role');

        if (token) {
          // Navigate based on the stored role
          if (role === 'Captain' || role === 'Passenger') {
            setInitialRoute('Menu'); // Navigate to the combined Menu screen for both roles
          } else {
            setInitialRoute('Selection'); // If no valid role, go to Selection screen
          }
        } else {
          setInitialRoute('Home'); // If no token, go to Home/Login screen
        }
      } catch (error) {
        console.error('Error checking token or role:', error);
        setInitialRoute('Home'); // Default to Home screen on error
      } finally {
        setLoading(false);
        setTimeout(() => setShowSplash(false), 2000);
      }
    };

    checkAuthAndRole();
  }, []);

  if (showSplash) {
    return <AppSplash/>;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D3463A" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <NotificationProvider>
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRoute}
        {...({} as any)} // Type assertion to bypass id requirement
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Code" component={CodeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Details" component={DetailsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Selection" component={SelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PostRide" component={PostRide} options={{ headerShown: false }} />
        <Stack.Screen name="CheckRides" component={CheckRidesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ShowRides" component={ShowRidesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Menu" component={MenuScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditRide" component={EditRide} options={{ headerShown: false }} />
        <Stack.Screen name="Requests" component={RequestsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
        <Stack.Screen name="Questions" component={Questions} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
    </NotificationProvider>
    </GestureHandlerRootView>
  );
};

export default App;
