import React, { useState } from 'react';
import {View,TextInput,TouchableOpacity,Text,StyleSheet,ActivityIndicator,Image,StatusBar,} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotification } from "../../context/NotificationContext";

type RootStackParamList = {
  Selection: undefined;
  Register: undefined;
  Login: undefined;
  Home: undefined;
  Menu: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { expoPushToken } = useNotification();

  const handleIdentifierChange = (text: string) => {
    // Allow direct input - don't format while typing
    setIdentifier(text);
  };

  const formatBeforeSubmit = (text: string) => {
    if (text.includes('@')) {
      return text.toLowerCase(); // Return email as is, just lowercase it
    } else {
      // Only format if it's a phone number
      let formatted = text;
      // Only remove +92 or 0 from the start
      if (formatted.startsWith('+92')) {
        formatted = formatted.substring(3);
      } else if (formatted.startsWith('0')) {
        formatted = formatted.substring(1);
      }
      return formatted;
    }
  };

  const handleLogin = async () => {
    setError(''); // Clear previous errors

    if (!identifier || !password) {
      setError('Phone number/email and password are required.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('https://appserver.aexrus.net/auth/login', {
        phoneNumber: formatBeforeSubmit(identifier),
        password,
        expoPushToken
      });

      if (response.data.success) {
        const token = response.data.token;
        const userId = response.data.user_id;

        await AsyncStorage.setItem('@7chalo:token', token);
        await AsyncStorage.setItem('@7chalo:userId', String(userId));
        await AsyncStorage.setItem('@7chalo:identifier', identifier);

        const role = await AsyncStorage.getItem('@7chalo:role');

        if (role === 'captain' || role === 'passenger') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Menu' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Selection' }],
          });
        }
      } else {
        setError(response.data.message || 'Invalid credentials.');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.message || 'Invalid credentials.');
      } else if (axios.isAxiosError(error) && error.request) {
        setError('No response from the server. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backArrowContainer}>
          <Image source={require('../../assets/images/backarrow.png')} style={styles.backarrowlogo} />
        </TouchableOpacity>
        <Image source={require('../../assets/images/signuplogo.png')} style={styles.logo} />
      </View>

      <Text style={styles.title}>LOGIN</Text>
      <Text style={styles.subtitle}>Enter your phone number/email and password to login</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Phone Number / Email Address"
          keyboardType="email-address"
          autoCapitalize="none"
          value={identifier}
          onChangeText={handleIdentifierChange}
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

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
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
    marginTop: 100,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 18,
    textAlign: 'center',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  input: {
    fontSize: 16,
    height: 45,
  },
  bottomContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#D3463A',
    borderRadius: 25,
    paddingVertical: 15,
    width: '90%',
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default LoginScreen;