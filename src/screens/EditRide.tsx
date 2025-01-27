import React, { useState, useEffect } from 'react';
import {View,Text,TouchableOpacity,TextInput,StyleSheet,ScrollView,Alert,Image,StatusBar,ActivityIndicator,} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MapPin } from 'lucide-react-native';

type RootStackParamList = {
  ShowRides: undefined;
  Login: undefined;
  EditRide: { rideId: number };
};

type EditRideNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditRide'>;

type Ride = {
  ride_id: number;
  user_id: number;
  vehicle_id: number;
  pickup_point: string;
  dropoff_point: string;
  passengers: number;
  time_slot: string;
  price: number;
  status: string;
  created_at: string;
  full_name: string;
  whatsapp_number: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_type: string;
  ac_enabled: boolean;
  quiet_ride: boolean;
};

const EditRide = () => {
  const navigation = useNavigation<EditRideNavigationProp>();
  const route = useRoute();
  const { rideId } = route.params as { rideId: number };

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [pickupPoint, setPickupPoint] = useState('');
  const [dropoffPoint, setDropoffPoint] = useState('');
  const [passengers, setPassengers] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [price, setPrice] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [isAcOn, setIsAcOn] = useState(false);
  const [isQuietRide, setIsQuietRide] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await fetchUserId();
      await fetchRideDetails();
    };
    initialize();
  }, [rideId]);

  const fetchUserId = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('@7chalo:userId');
      if (storedUserId) {
        setUserId(storedUserId);
      } else {
        Alert.alert('Error', 'User ID not found. Please log in again.');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    } catch (error) {
      console.error('Error fetching user ID:', error);
      Alert.alert('Error', 'Failed to fetch user data.');
    }
  };

  const handleDateChange = (event: any, selected: Date | undefined) => {
    setShowDatePicker(false);
    if (selected) {
      setSelectedDate(selected);
    }
  };

  const fetchRideDetails = async () => {
    try {
      const response = await axios.get(`https://appserver.aexrus.net/rides/ride/${rideId}`);
      if (response.data && response.data.success) {
        const ride = response.data.ride;
        setPickupPoint(ride.pickup_point);
        setDropoffPoint(ride.dropoff_point);
        setPassengers(ride.passengers.toString());
        setTimeSlot(ride.time_slot);
        setPrice(ride.price.toString());
        setVehicleId(ride.vehicle_id);
        setIsAcOn(Boolean(ride.ac_enabled));
        setIsQuietRide(Boolean(ride.quiet_ride));

        // Parse the time from time_slot
        const [time, modifier] = ride.time_slot.split(' ');
        const [hours, minutes] = time.split(':');
        let hr = parseInt(hours);
        if (modifier === 'PM' && hr < 12) hr += 12;
        if (modifier === 'AM' && hr === 12) hr = 0;

        const newTime = new Date();
        newTime.setHours(hr);
        newTime.setMinutes(parseInt(minutes));
        setSelectedTime(newTime);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ride details:', error);
      Alert.alert('Error', 'Failed to fetch ride details.');
      setLoading(false);
    }
  };

  const handleTimeChange = (event: any, selectedDate: Date | undefined) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setSelectedTime(selectedDate);
      const formattedTime = selectedDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      setTimeSlot(formattedTime);
    }
  };

// In EditRide.tsx, modify the handleUpdateRide function

const handleUpdateRide = async () => {
  if (!pickupPoint || !dropoffPoint || !passengers || !timeSlot || !price || !vehicleId) {
    Alert.alert('Incomplete Details', 'Please fill out all fields.');
    return;
  }

  try {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    const payload = {
      ride_id: rideId,
      vehicle_id: vehicleId,
      user_id: parseInt(userId),
      pickup_point: pickupPoint,
      dropoff_point: dropoffPoint,
      passengers: parseInt(passengers),
      time_slot: timeSlot,
      ride_date: formattedDate,
      price: parseFloat(price),
      ac_enabled: isAcOn,
      quiet_ride: isQuietRide,
    };

    const response = await axios.put(
      `https://appserver.aexrus.net/rides/ride/update`,
      payload
    );

    if (response.data.success) {
      Alert.alert('Success', 'Ride updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } else {
      Alert.alert('Error', response.data.message || 'Failed to update the ride.');
    }
  } catch (error) {
    console.error('Error updating ride:', error);
    if (axios.isAxiosError(error) && error.response) {
      Alert.alert('Error', error.response.data.message || 'Failed to update the ride.');
    } else {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  }
};

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D3463A" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="light-content" />
  
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrowContainer}>
          <Image source={require('../../assets/images/backarrow.png')} style={styles.backarrowlogo} />
        </TouchableOpacity>
        <Image source={require('../../assets/images/signuplogo.png')} style={styles.logo} />
      </View>
  
      <Text style={styles.title}>Edit Ride Details</Text>
  
      {/* Edit Form */}
      <View style={styles.formContainer}>
        {/* Pickup Input with Map Button */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a pickup point"
            value={pickupPoint}
            onChangeText={setPickupPoint}
          />
          {/* <TouchableOpacity
            style={styles.mapButton}
            onPress={() => {
              setIsPickupSelection(true);
              setShowMap(true);
            }}
          >
            <MapPin size={24} color="#D3463A" />
          </TouchableOpacity> */}
        </View>

        {/* Dropoff Input with Map Button */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a drop-off point"
            value={dropoffPoint}
            onChangeText={setDropoffPoint}
          />
          {/* <TouchableOpacity
            style={styles.mapButton}
            onPress={() => {
              setIsPickupSelection(false);
              setShowMap(true);
            }}
          >
            <MapPin size={24} color="#D3463A" />
          </TouchableOpacity> */}
        </View>

        {/* Passenger Selection */}
        <View style={styles.passengerContainer}>
          <Text style={styles.passengerLabel}>Number of passengers:</Text>
          <View style={styles.passengerButtonsContainer}>
            {[1, 2, 3].map((number) => (
              <TouchableOpacity
                key={number}
                style={[
                  styles.passengerButton,
                  passengers === number.toString() && styles.passengerButtonActive
                ]}
                onPress={() => setPassengers(number.toString())}
              >
                <Text style={[
                  styles.passengerButtonText,
                  passengers === number.toString() && styles.passengerButtonTextActive
                ]}>
                  {number}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date/Time and Preferences Row */}
        <View style={styles.datePreferencesContainer}>
          {/* Left side - Date and Time */}
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <TextInput
                style={styles.dateTimeInput}
                placeholder="Select Date"
                value={selectedDate.toLocaleDateString()}
                editable={false}
              />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
            <TouchableOpacity onPress={() => setShowTimePicker(true)}>
              <TextInput
                style={styles.dateTimeInput}
                placeholder="Select Time"
                value={timeSlot}
                editable={false}
              />
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>

          {/* Right side - Preferences */}
          <View style={styles.preferencesContainer}>
            {/* AC Toggle */}
            <View style={styles.preferenceRow}>
              <Image
                source={isAcOn ? 
                  require('../../assets/images/ACon.png') : 
                  require('../../assets/images/ACoff.png')}
                style={styles.preferenceIcon}
              />
              <TouchableOpacity
                style={[styles.toggleButton, isAcOn && styles.toggleButtonActiveAC]}
                onPress={() => setIsAcOn(!isAcOn)}
              >
                <View style={[
                  styles.toggleOption,
                  isAcOn && styles.toggleOptionActiveAC
                ]}>
                  <Text style={[
                    styles.toggleText,
                    isAcOn && styles.toggleTextActive
                  ]}>{isAcOn ? 'A.C\nOn' : 'A.C\nOff'}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Ride Type Toggle */}
            <View style={styles.preferenceRow}>
              <Image
                source={isQuietRide ? 
                  require('../../assets/images/mute.png') : 
                  require('../../assets/images/unmute.png')}
                style={[
                  styles.preferenceIcon1,
                  { tintColor: isQuietRide ? '#C9C9C9' : '#32CD32' }
                ]}
              />
              <TouchableOpacity
                style={[styles.toggleButton, !isQuietRide && styles.toggleButtonActiveMute]}
                onPress={() => setIsQuietRide(!isQuietRide)}
              >
                <View style={[
                  styles.toggleOption,
                  !isQuietRide && styles.toggleOptionActiveMute
                ]}>
                  <Text style={[
                    styles.toggleText,
                    !isQuietRide && styles.toggleTextActive
                  ]}>{isQuietRide ? 'Quiet\nRide' : 'Talkative\nRide'}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Price"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        <TouchableOpacity style={styles.updateButton} onPress={handleUpdateRide}>
          <Text style={styles.updateButtonText}>Update Ride</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  logo: {
    width: 121,
    height: 84,
    resizeMode: 'contain',
    marginLeft: 122,
    marginRight: 'auto',
  },
  backarrowlogo: {
    width: 18,
    height: 16,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D3463A',
    textAlign: 'center',
    marginTop: 15,
  },
  formContainer: {
    marginTop: 20,
    padding: 10,
  },
  // input: {
  //   borderWidth: 1.5,
  //   borderColor: '#D3463A',
  //   borderRadius: 15,
  //   paddingHorizontal: 15,
  //   paddingVertical: 10,
  //   fontSize: 16,
  //   marginBottom: 20,
  // },
  timeInput: {
    width: '50%',
    height: 50,
    borderColor: '#D3463A',
    borderWidth: 2,
    borderRadius: 25,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    alignSelf: 'center',
  },
  updateButton: {
    backgroundColor: '#D3463A',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePreferencesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  dateTimeContainer: {
    flex: 1,
    marginRight: 20,
  },
  dateTimeInput: {
    height: 50,
    borderColor: '#D3463A',
    borderWidth: 1.5,
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  preferencesContainer: {
    flex: 1,
  },
  preferencesTitle: {
    fontSize: 18,
    color: '#D3463A',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  preferenceIcon: {
    width: 24,
    height: 28,
    marginRight: 10,
  },
  preferenceIcon1: {
    width: 26,
    height: 22,
    marginRight: 10,
  },
  toggleButton: {
    flex: 1,
    height: 55,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ccc',
    padding: 3,
  },
  toggleButtonActiveAC: {
    borderColor: '#60E1FF',
  },
  toggleButtonActiveMute: {
    borderColor: '#30BA00',
  },
  toggleOption: {
    flex: 1,
    backgroundColor: '#ccc',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    width: '52%',
    height: '100%',
    left: 3,
    top: 3,
  },
  toggleOptionActiveAC: {
    backgroundColor: '#60E1FF',
    left: '50%',
  },
  toggleOptionActiveMute: {
    backgroundColor: '#30BA00',
    left: '50%',
  },
  toggleText: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  toggleTextActive: {
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1.5,
    borderColor: '#D3463A',
    borderRadius: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
  },
  mapButton: {
    width: 50,
    height: 50,
    borderWidth: 1.5,
    borderColor: '#D3463A',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerContainer: {
    marginBottom: 20,
  },
  passengerLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  passengerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  passengerButton: {
    flex: 1,
    height: 50,
    borderWidth: 1.5,
    borderColor: '#D3463A',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  passengerButtonActive: {
    backgroundColor: '#D3463A',
  },
  passengerButtonText: {
    fontSize: 18,
    color: '#D3463A',
  },
  passengerButtonTextActive: {
    color: '#fff',
  },
});

export default EditRide;