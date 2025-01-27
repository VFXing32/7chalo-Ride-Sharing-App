import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Image, Platform, ActivityIndicator } from 'react-native';
import * as Font from 'expo-font';
import { useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Code : undefined;
  Details: undefined;
  Selection: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const navigation = useNavigation<HomeScreenNavigationProp>();

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Raleway-VariableFont_wght': require('../../assets/fonts/Raleway-VariableFont_wght.ttf'), // Adjust the path if necessary
        'Lato-Bold': require('../../assets/fonts/Lato-Bold.ttf'), // Adjust the path if necessary
      });
      setFontsLoaded(true);
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#D3463A" />
      <SafeAreaView style={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/images/7chalo1.png')} style={styles.logo} />
          <Text style={styles.tagline}>a ride sharing platform.</Text>
        </View>
        <View style={styles.whiteBackgroundContainer}>
          <Text style={styles.subtitle}>Your pick of rides at low prices</Text>
          <TouchableOpacity style={styles.signupButton} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signupButtonText}>Sign up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginButtonText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D3463A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Adjust padding for Android
  },
  logo: {
    width: 217,
    height: 100,
    resizeMode: 'contain',
  },
  logoContainer: {
    flex: 2,
    marginTop: 75,
    alignItems: 'center',
  },
  tagline: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Raleway-VariableFont_wght', // Use the loaded font
  },
  whiteBackgroundContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  subtitle: {
    color: '#D3463A',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 50,
    fontFamily: 'Raleway-VariableFont_wght',
  },
  signupButton: {
    backgroundColor: '#D3463A',
    borderRadius: 30,
    width: '80%',
    paddingVertical: 15,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Lato-Bold', // Use the loaded font
  },
  loginButton: {
    backgroundColor: 'white',
    borderRadius: 30,
    width: '80%',
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D3463A',
  },
  loginButtonText: {
    color: '#D3463A',
    fontSize: 16,
    fontFamily: 'Lato-Bold', // Use the loaded font
  },
});

export default HomeScreen;