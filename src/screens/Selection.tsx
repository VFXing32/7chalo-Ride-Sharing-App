import React, { useEffect, useState } from 'react';
import {View,  Text,  TouchableOpacity,  Image, StyleSheet, Alert, ActivityIndicator, StatusBar,} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define the navigation type
type RootStackParamList = {
  Menu: undefined;
};

type SelectionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList,'Menu'>;

const SelectionScreen = () => {
  const navigation = useNavigation<SelectionScreenNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Load the stored role (if any) from AsyncStorage
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const role = await AsyncStorage.getItem('@7chalo:role');
        if (role) {
          setSelectedRole(role);
          if (role === 'Captain') {
            navigation.navigate('Menu'); // Navigate directly to CaptainMenu
          } else if (role === 'Passenger') {
            navigation.navigate('Menu'); // Navigate directly to PassengerMenu
          }
        }
      } catch (error) {
        console.error('Error fetching role from AsyncStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  // Display a loading indicator while fetching the role
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D3463A" />
      </View>
    );
  }

  const updateRole = async (role: string) => {
    try {
      // Save the selected role to AsyncStorage
      await AsyncStorage.setItem('@7chalo:role', role);

      // Navigate to the appropriate menu based on the selected role
      if (role === 'Captain') {
        navigation.navigate('Menu'); // Replace with your Captain menu screen
      } else if (role === 'Passenger') {
        navigation.navigate('Menu'); // Replace with your Passenger menu screen
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save your role. Please try again.');
      console.error('Error saving role:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.title}>I am a ...</Text>

      <View style={styles.selectionContainer}>
        {/* Captain Option */}
        <TouchableOpacity style={styles.roleButton} onPress={() => updateRole('Captain')}>
          <Image source={require('../../assets/images/driver.png')} style={styles.icon} />
        </TouchableOpacity>

        {/* Dashed Line */}
        <View style={styles.dashedLine} />

        {/* Passenger Option */}
        <TouchableOpacity style={styles.roleButton} onPress={() => updateRole('Passenger')}>
          <Image source={require('../../assets/images/passenger.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#D3463A',
    marginBottom: 30,
  },
  selectionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  roleButton: {
    alignItems: 'center',
  },
  icon: {
    width: 215,
    height: 442,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  dashedLine: {
    width: 1,
    height: 300,
    borderWidth: 2,
    borderColor: '#D3463A',
    borderStyle: 'dashed',
  },
});

export default SelectionScreen;
