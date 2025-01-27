import React, { useState, useEffect } from 'react';
import {  View,  Text,  TextInput,  TouchableOpacity,  StyleSheet,  Image,  StatusBar,  Alert,} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define the navigation type
type RootStackParamList = {
  Selection: undefined;
  Login: undefined;
};

type DetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Selection'>;

const DetailsScreen = () => {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigation = useNavigation<DetailsScreenNavigationProp>();

  useEffect(() => {
    // Fetch the phone number from AsyncStorage
    const fetchPhoneNumber = async () => {
      const storedPhoneNumber = await AsyncStorage.getItem('@7chalo:phoneNumber');
      if (storedPhoneNumber) {
        setPhoneNumber(storedPhoneNumber);
      } else {
        Alert.alert('Error', 'Phone number not found. Please try again.');
        navigation.goBack();
      }
    };

    fetchPhoneNumber();
  }, []);

  const handleNext = async () => {
    if (!fullName || !password || !confirmPassword) {
      Alert.alert('Incomplete Details', 'Please fill out all the fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    try {
      // Call the API to save user details
      const response = await axios.post('https://appserver.aexrus.net/auth/saveDetails', {
        phoneNumber,
        fullName,
        password,
      });

      if (response.data.success) {
        const token = response.data.token;
        const userId = response.data.user_id;

        // Save token and userId to AsyncStorage
        await AsyncStorage.setItem('@7chalo:token', token);
        await AsyncStorage.setItem('@7chalo:userId', String(userId));
        await AsyncStorage.setItem('@7chalo:phoneNumber', phoneNumber);

        Alert.alert('Success', 'Registration completed successfully.');
        // Navigate to the Selection screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        Alert.alert('Error', error.response.data.message || 'Failed to save details.');
      } else {
        console.error('Error saving details:', error);
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header with back button and logo */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrowContainer}>
          <Image source={require('../../assets/images/backarrow.png')} style={styles.backarrowlogo} />
        </TouchableOpacity>
        <Image source={require('../../assets/images/signuplogo.png')} style={styles.logo} />
      </View>

      {/* Title and Subtitle */}
      <Text style={styles.title}>Complete Registration</Text>
      <Text style={styles.subtitle}>
        Use your real name so drivers can identify you faster and easier. This helps make your rides safer.
      </Text>

      {/* Inputs for Full Name and Password */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>

      {/* Next Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
          <Text style={styles.continueButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 11,
  },
  backArrowContainer: {
    position: 'absolute',
    left: 5,
  },
  backarrowlogo: {
    width: 18,
    height: 16,
    resizeMode: 'contain',
  },
  logo: {
    width: 121,
    height: 84,
    resizeMode: 'contain',
    marginLeft: 123,
    marginRight: 'auto',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 70,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 50,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
  },
  bottomContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 30,
  },
  continueButton: {
    backgroundColor: '#D3463A',
    borderRadius: 25,
    paddingVertical: 15,
    width: '90%',
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DetailsScreen;
