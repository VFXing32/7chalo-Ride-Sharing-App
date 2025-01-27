import React, { useState } from 'react';
import { View ,TextInput ,TouchableOpacity, Text, StyleSheet, Image, StatusBar, Alert,} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Mail } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Code: undefined;
  Login: undefined;
  Register: undefined;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const validateEmail = (email: string) => {
    const allowedDomains = ['@maju.edu.pk', '@jinnah.edu'];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // First check if it's a valid email format
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }
    
    // Then check if it's from an allowed domain
    const hasAllowedDomain = allowedDomains.some(domain => email.toLowerCase().endsWith(domain));
    if (!hasAllowedDomain) {
      Alert.alert('Invalid Email Domain', 'Please use an email address from @maju.edu.pk or @jinnah.edu');
      return false;
    }
    
    return true;
  };

  const handleContinue = async () => {
    if (!phoneNumber || !email) {
      Alert.alert('Missing Information', 'Please enter both phone number and email');
      return;
    }

    // Validate that the phone number is exactly 10 digits and contains only numbers
    if (phoneNumber.length !== 10 || !/^\d+$/.test(phoneNumber)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid Phone Number.');
      return;
    }

    if (!validateEmail(email)) {
      return;
    }
  
    try {
      // Send both phone number and email to the server
      const response = await axios.post('https://appserver.aexrus.net/auth/savePhoneNumber', {
        phoneNumber,
        email
      });

      // Log response data for debugging
      console.log('Server response:', response.data);

      // Save phone number, email and userId in AsyncStorage
      await Promise.all([
        AsyncStorage.setItem('@7chalo:phoneNumber', phoneNumber),
        AsyncStorage.setItem('@7chalo:email', email),
        AsyncStorage.setItem('@7chalo:userId', response.data.userId.toString())
      ]);

      console.log('Saved userId:', response.data.userId);
      console.log('Phone number and email saved, code sent.');

      Alert.alert('Success', 'A code has been sent to your phone number.');

      // Navigate to the Code screen
      navigation.navigate('Code');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response && error.response.status === 400) {
        Alert.alert('Error', error.response.data.message);
      } else {
        console.error('Error saving information:', error);
        Alert.alert('Error', 'Failed to save information. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle='light-content' />

      {/* Header with back button and logo */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrowContainer}>
          <Image
            source={require('../../assets/images/backarrow.png')}
            style={styles.backarrowlogo}
          />
        </TouchableOpacity>
        <Image source={require('../../assets/images/signuplogo.png')} style={styles.logo} />
      </View>

      {/* Title and Subtitle */}
      <Text style={styles.title}>ENTER YOUR PHONE NUMBER</Text>
      <Text style={styles.subtitle}>We will send a confirmation code to it</Text>

      {/* Phone Input */}
      <View style={styles.phoneContainer}>
        {/* Flag Logo */}
        <View style={styles.flagContainer}>
          <Image source={require('../../assets/images/pakflag.png')} style={styles.flagIcon} />
        </View>

        {/* Default Country Code */}
        <Text style={styles.countryCode}>+92</Text>

        {/* Phone Number Input */}
        <TextInput
          style={styles.phoneInput}
          placeholder="00 00000000"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />

        {/* Clear Button */}
        {phoneNumber.length > 0 && (
          <TouchableOpacity onPress={() => setPhoneNumber('')}>
            <Text style={styles.clearButton}>X</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <View style={styles.iconContainer}>
          <Mail size={24} color="#666" />
        </View>
        <TextInput
          style={styles.emailInput}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        {email.length > 0 && (
          <TouchableOpacity onPress={() => setEmail('')}>
            <Text style={styles.clearButton}>X</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Continue Button positioned at the bottom */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
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
    marginBottom: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    marginBottom: 20,
    height: 50,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  emailInput: {
    flex: 1,
    fontSize: 16,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    marginBottom: 20,
    height: 50,
  },
  flagContainer: {
    width: 45,
    height: 45,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  flagIcon: {
    width: 24,
    height: 16,
    resizeMode: 'contain',
  },
  countryCode: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
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
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;