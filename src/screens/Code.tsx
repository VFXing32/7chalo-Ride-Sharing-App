import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Image, StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Code: undefined;
  Details: undefined;
  Login: undefined;
};

type CodeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Code'>;

const CodeScreen = () => {
  const [code, setCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const navigation = useNavigation<CodeScreenNavigationProp>();

  useEffect(() => {
    // Fetch both phone number and email from AsyncStorage
    const fetchUserData = async () => {
      try {
        const [storedPhoneNumber, storedEmail] = await Promise.all([
          AsyncStorage.getItem('@7chalo:phoneNumber'),
          AsyncStorage.getItem('@7chalo:email')
        ]);

        if (!storedPhoneNumber || !storedEmail) {
          Alert.alert('Error', 'User information not found. Please try again.');
          navigation.goBack();
          return;
        }

        setPhoneNumber(storedPhoneNumber);
        setEmail(storedEmail);
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load user information. Please try again.');
        navigation.goBack();
      }
    };

    fetchUserData();
  }, []);

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit code.');
      return;
    }

    try {
      const response = await axios.post('https://appserver.aexrus.net/auth/verifycode', {
        phoneNumber,
        email,
        code
      });

      if (response.data.success) {
        Alert.alert('Success', 'Verification successful.');
        navigation.navigate('Details');
      } else {
        Alert.alert('Error', response.data.message || 'Invalid code. Please try again.');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        Alert.alert('Error', error.response.data.message || 'Verification failed. Please try again.');
      } else {
        console.error('Error verifying code:', error);
        Alert.alert('Error', 'Failed to verify the code. Please try again.');
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

      {/* Title and Instructions */}
      <Text style={styles.title}>ENTER THE 6-DIGIT CODE</Text>
      <Text style={styles.subtitle}>We sent it to:</Text>
      <Text style={styles.contactInfo}>+92 {phoneNumber}</Text>
      <Text style={styles.contactInfo}>{email}</Text>

      {/* Code Input */}
      <View style={styles.phoneContainer}>
        <TextInput
          style={styles.phoneInput}
          placeholder="_ _ _ _ _ _"
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
          maxLength={6}
        />

        {/* Clear Button */}
        {code.length > 0 && (
          <TouchableOpacity onPress={() => setCode('')}>
            <Text style={styles.clearButton}>X</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.continueButton, code.length !== 6 && styles.continueButtonDisabled]} 
          onPress={handleVerify}
          disabled={code.length !== 6}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    fontWeight: '500',
  },
  phoneContainer: {
    width: 340,
    height: 73,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    marginBottom: 20,
    marginTop: 20,
    paddingHorizontal: 0.5,
  },
  phoneInput: {
    flex: 1,
    fontSize: 26,
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  clearButton: {
    fontSize: 16,
    color: '#888',
    paddingHorizontal: 10,
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
  continueButtonDisabled: {
    backgroundColor: '#D3463A80',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CodeScreen;