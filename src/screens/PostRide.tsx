import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert, Image, StatusBar, Modal, Dimensions, Platform, TouchableWithoutFeedback, KeyboardAvoidingView, Keyboard,} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import 'react-native-get-random-values';
import '@azure/core-asynciterator-polyfill';
import { MapPin } from 'lucide-react-native';

// Define the type for the navigation stack
type RootStackParamList = {
  PostRide: undefined;
  CheckRides: undefined;
  Login: undefined;
  Menu: undefined;
};

type PostRideNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PostRide'>;

type Vehicle = {
  vehicle_id: number;
  vehicle_type: string;
  vehicle_model: string;
  vehicle_plate: string;
  whatsapp_number: string;
};

type Ride = {
  ride_id: number;
  pickup_point: string;
  dropoff_point: string;
  passengers: number;
  ride_time: string;
  ride_date: string;
  price: number;
  user_id: string;
};

type Location = {
  latitude: number;
  longitude: number;
} | null;

const PostRide = () => {
  const navigation = useNavigation<PostRideNavigationProp>();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [carOrBike, setCarOrBike] = useState('');
  const [model, setModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [userId, setUserId] = useState('');
  const [pickupPoint, setPickupPoint] = useState('');
  const [dropoffPoint, setDropoffPoint] = useState('');
  const [previousRides, setPreviousRides] = useState<Ride[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showRideForm, setShowRideForm] = useState(false);
  const [passengers, setPassengers] = useState('');
  const [rideTime, setRideTime] = useState('');
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [price, setPrice] = useState('');
  const [isAcOn, setIsAcOn] = useState(false);
  const [isQuietRide, setIsQuietRide] = useState(true); // Default to Quiet Ride
  const [showMap, setShowMap] = useState(false);
  const [isPickupSelection, setIsPickupSelection] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location>(null);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 24.8607,
    longitude: 67.0011,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setInitialRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    })();
  }, []);
  
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('@7chalo:userId');
        if (storedUserId) {
          setUserId(storedUserId);
          const response = await axios.get(
            `https://appserver.aexrus.net/rides/vehicles?user_id=${storedUserId}`
          );
          setVehicles(response.data.vehicles || []);
        } else {
          Alert.alert('Error', 'User ID not found. Please log in again.');
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        Alert.alert('Error', 'Failed to fetch vehicles.');
      }
    };

    fetchVehicles();
  }, [navigation]);

  const fetchPreviousRides = async (vehicle_id: number) => {
    try {
      const response = await axios.get(
        `https://appserver.aexrus.net/rides/ride/prev`,
        {
          params: { user_id: userId, vehicle_id },
        }
      );
      if (response.data.success) {
        setPreviousRides(response.data.rides || []);
      } else {
        Alert.alert('No Rides Found', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching previous rides:', error);
    }
  };

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedLocation({
      latitude,
      longitude
    });
  };

const handleLocationSelect = (data: any, details: any = null) => {
  if (details?.geometry?.location) {
    const { lat, lng } = details.geometry.location;
    setSelectedLocation({
      latitude: lat,
      longitude: lng
    });
    setInitialRegion(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
    const locationName = data.description || details.formatted_address;
      if (isPickupSelection) {
        setPickupPoint(locationName);
      } else {
        setDropoffPoint(locationName);
      }
    }
  };


  const confirmLocation = async () => {
    if (selectedLocation) {
      try {
        const address = await Location.reverseGeocodeAsync(selectedLocation);
        const locationName = address[0]?.name || 'Selected Location';
        
        if (isPickupSelection) {
          setPickupPoint(locationName);
        } else {
          setDropoffPoint(locationName);
        }
        setShowMap(false);
      } catch (error) {
        console.error('Error getting address:', error);
        Alert.alert('Error', 'Failed to get location address');
      }
    }
  };

  const handleTimeChange = (event: any, selected: Date | undefined) => {
    setShowTimePicker(false);
    if (selected) {
      setSelectedTime(selected);
      setRideTime(selected.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  };

  const handleDateChange = (event: any, selected: Date | undefined) => {
    setShowDatePicker(false);
    if (selected) {
      setSelectedDate(selected);
    }
  };

  const handlePostRide = async (ride: Ride) => {
    try {
      if (!ride.ride_id || !userId || !selectedVehicle?.vehicle_id) {
        Alert.alert('Error', 'Missing required information to post the ride.');
        return;
      }

      const payload = {
        ride_id: ride.ride_id,
        user_id: userId,
        vehicle_id: selectedVehicle.vehicle_id,
      };

      const response = await axios.post('https://appserver.aexrus.net/rides/ride/post', payload);

      if (response.data.success) {
        Alert.alert('Success', 'Ride successfully posted!');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Menu' }],
        });
      } else {
        Alert.alert('Error', response.data.message || 'Failed to post the ride.');
      }
    } catch (error) {
      console.error('Error posting the ride:', error);

      if (axios.isAxiosError(error) && error.response) {
        Alert.alert('Error', error.response.data.message || 'Failed to post the ride. Please try again.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleAddVehicle = async () => {
    if (!carOrBike || !model || !plateNumber || !whatsappNumber) {
      Alert.alert('Incomplete Details', 'Please fill out all fields.');
      return;
    }

    if (!['Car', 'Bike'].includes(carOrBike)) {
      Alert.alert('Invalid Vehicle Type', 'Vehicle type must be either "Car" or "Bike".');
      return;
    }

    const plateRegex = /^[A-Za-z0-9-]{1,10}$/;
    if (!plateRegex.test(plateNumber)) {
      Alert.alert('Invalid Plate Number', 'Please enter a valid plate number.');
      return;
    }

    const payload = {
      user_id: userId,
      vehicle_type: carOrBike,
      vehicle_model: model,
      vehicle_plate: plateNumber,
      whatsapp_number: whatsappNumber,
    };

    try {
      const response = await axios.post('https://appserver.aexrus.net/rides/vehicles/add', payload);

      if (response.data.success) {
        Alert.alert('Success', 'Vehicle added successfully.');
        setVehicles((prevVehicles) => [...prevVehicles, response.data.vehicle]);
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);

      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 400 && error.response.data.message.startsWith('Error: Duplicate entry')) {
          Alert.alert('Duplicate Vehicle', 'This vehicle already exists for your account.');
        } else {
          Alert.alert('Duplicate Vehicle', 'This vehicle already exists for someone\'s account.');
        }
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    }
  };

  const handleSelectVehicle = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    await fetchPreviousRides(vehicle.vehicle_id);
  };

  const handleAddRide = async () => {
    if (!pickupPoint || !dropoffPoint || !passengers || !rideTime || !price || !selectedDate) {
      Alert.alert('Incomplete Details', 'Please fill out all fields including date and time.');
      return;
    }
  
    const formattedDate = selectedDate.toISOString().split('T')[0];
    const payload = {
      vehicle_id: selectedVehicle?.vehicle_id,
      user_id: userId,
      pickup_point: pickupPoint,
      dropoff_point: dropoffPoint,
      passengers: parseInt(passengers, 10),
      ride_time: rideTime,
      ride_date: formattedDate,
      price: parseFloat(price),
      ac_enabled: isAcOn,
      quiet_ride: isQuietRide,
    };

    try {
      const response = await axios.post('https://appserver.aexrus.net/rides/ride/add', payload);
      if (response.data.success) {
        Alert.alert('Success', 'Ride added successfully.');
        setPreviousRides((prevRides) => [...prevRides, response.data.ride]);
        setPickupPoint('');
        setDropoffPoint('');
        setPassengers('');
        setRideTime('');
        setPrice('');
        setShowRideForm(false);
      }
    } catch (error) {
      console.error('Error adding ride:', error);
      Alert.alert('Error', 'Failed to add ride. Please try again.');
    }
  };

  const renderLocationPicker = () => (
    <Modal
      visible={showMap}
      animationType="slide"
      onRequestClose={() => setShowMap(false)}
    >
      <View style={styles.mapContainer}>
        <View style={styles.searchBarContainer}>
          <GooglePlacesAutocomplete
            placeholder="Search location"
            onPress={handleLocationSelect}
            query={{
              key: "AIzaSyBrhdYNtDb_wUvMO5OcvQ5VoK-VJVpTxPM", // Replace with your actual API key
              language: "en",
              components: "country:pk",
              types: ['geocode', 'establishment'] // Added types for more comprehensive search
            }}
            fetchDetails={true}
            enablePoweredByContainer={false}
            onFail={error => console.error(error)}
            onNotFound={() => console.log('no results')}
            listViewDisplayed={true}
            styles={{
              container: {
                flex: 0,
                zIndex: 999
              },
              textInput: {
                height: 40,
                borderWidth: 1,
                borderColor: '#D3463A',
                borderRadius: 10,
                backgroundColor: 'white',
                paddingHorizontal: 10,
                fontSize: 16
              },
              listView: {
                backgroundColor: 'white',
                borderRadius: 5,
                elevation: 3,
                maxHeight: 200
              },
              row: {
                padding: 13,
                height: 44,
                backgroundColor: 'white'
              },
              separator: {
                height: 1,
                backgroundColor: '#c8c7cc'
              },
              description: {
                fontSize: 15
              },
              poweredContainer: {
                display: 'none'
              }
            }}
            textInputProps={{
              placeholderTextColor: '#888',
              returnKeyType: "search"
            }}
            nearbyPlacesAPI="GooglePlacesSearch"
            debounce={300}
            minLength={2}
            filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']}
          />
        </View>

        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          region={initialRegion}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              draggable
              onDragEnd={(e) => handleMapPress(e)}
            />
          )}
        </MapView>

        <View style={styles.mapButtonsContainer}>
          <TouchableOpacity
            style={styles.mapButton1}
            onPress={() => setShowMap(false)}
          >
            <Text style={styles.mapButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mapButton1, styles.confirmButton]}
            onPress={confirmLocation}
          >
            <Text style={styles.mapButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderAddVehicleForm = () => (
    <ScrollView 
      contentContainerStyle={styles.formContainer}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled={true}
    >
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Vehicle Details</Text>
        <View style={styles.row}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={carOrBike}
              onValueChange={(itemValue) => setCarOrBike(itemValue)}
              style={styles.picker}
              mode="dropdown"
            >
              <Picker.Item 
                label="Select Type" 
                value="" 
                style={styles.pickerItem}
              />
              <Picker.Item 
                label="Car" 
                value="Car" 
                style={styles.pickerItem}
              />
              <Picker.Item 
                label="Bike" 
                value="Bike" 
                style={styles.pickerItem}
              />
            </Picker>
          </View>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Vehicle Model"
            placeholderTextColor="#999"
            value={model}
            onChangeText={setModel}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>License Plate</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter vehicle number plate"
          placeholderTextColor="#999"
          value={plateNumber}
          onChangeText={setPlateNumber}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contact Information</Text>
        <TextInput
          style={styles.input}
          placeholder="WhatsApp number"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          value={whatsappNumber}
          onChangeText={setWhatsappNumber}
        />
      </View>

      <TouchableOpacity 
        style={styles.addButton} 
        onPress={handleAddVehicle}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>Add Vehicle</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Post Ride Form Section
  const renderPostRideForm = () => (
    <ScrollView 
      contentContainerStyle={styles.rideFormContainer}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled={true}
    >
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input2}
          placeholder="Add a pickup point"
          value={pickupPoint}
          onChangeText={setPickupPoint}
        />
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => {
            setIsPickupSelection(true);
            setShowMap(true);
          }}
        >
          <MapPin size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input2}
          placeholder="Add a drop-off point"
          value={dropoffPoint}
          onChangeText={setDropoffPoint}
        />
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => {
            setIsPickupSelection(false);
            setShowMap(true);
          }}
        >
          <MapPin size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.passengerContainer}>
        <Text style={styles.passengerLabel}>Number of available passengers:</Text>
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

      <View style={styles.datePreferencesContainer}>
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
              value={rideTime}
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

        <View style={styles.preferencesContainer}>
          <View style={styles.preferenceRow}>
            <Image
              source={
                isAcOn
                  ? require("../../assets/images/ACon.png")
                  : require("../../assets/images/ACoff.png")
              }
              style={styles.preferenceIcon}
            />
            <TouchableOpacity
              style={[
                styles.toggleButton,
                isAcOn && styles.toggleButtonActiveAC,
              ]}
              onPress={() => setIsAcOn(!isAcOn)}
            >
              <View
                style={[
                  styles.toggleOption,
                  isAcOn && styles.toggleOptionActiveAC,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    isAcOn && styles.toggleTextActive,
                  ]}
                >
                  {isAcOn ? "A.C\nOn" : "A.C\nOff"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.preferenceRow}>
            <Image
              source={
                isQuietRide
                  ? require("../../assets/images/mute.png")
                  : require("../../assets/images/unmute.png")
              }
              style={[
                styles.preferenceIcon1,
                { tintColor: isQuietRide ? "#C9C9C9" : "#32CD32" },
              ]}
            />
            <TouchableOpacity
              style={[
                styles.toggleButton,
                !isQuietRide && styles.toggleButtonActiveMute,
              ]}
              onPress={() => setIsQuietRide(!isQuietRide)}
            >
              <View
                style={[
                  styles.toggleOption,
                  !isQuietRide && styles.toggleOptionActiveMute,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    !isQuietRide && styles.toggleTextActive,
                  ]}
                >
                  {isQuietRide ? "Quiet\nRide" : "Talkative\nRide"}
                </Text>
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

      <TouchableOpacity style={styles.addButton} onPress={handleAddRide}>
        <Text style={styles.addButtonText}>Next</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StatusBar barStyle="light-content" />

          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backArrowContainer}
            >
              <Image
                source={require("../../assets/images/backarrow.png")}
                style={styles.backarrowlogo}
              />
            </TouchableOpacity>
            <Image
              source={require("../../assets/images/signuplogo.png")}
              style={styles.logo}
            />
          </View>

          <Text style={styles.title}>
            {showForm
              ? "Add Vehicle Details"
              : showRideForm
              ? "Let's Post a ride"
              : selectedVehicle
              ? "Recreate Previous Rides"
              : "Select Your Vehicle"}
          </Text>

          {showRideForm ? renderPostRideForm() : 
           showForm ? renderAddVehicleForm() : 
           selectedVehicle ? (
            <View style={styles.vehicleContainer}>
              {previousRides.length > 0 ? (
                previousRides.map((ride, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.rideContainer}
                    onPress={() => handlePostRide(ride)}
                  >
                    <Text style={styles.rideText}>
                      {ride.pickup_point} to {ride.dropoff_point}
                    </Text>
                    <Text style={styles.rideDetailsText}>
                      {ride.passengers} Persons {ride.ride_time}
                    </Text>
                    <Text style={styles.ridePriceText}>{ride.price}rs</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noVehiclesText}>
                  No rides found for this vehicle.
                </Text>
              )}

              <TouchableOpacity
                style={styles.addVehicleButton}
                onPress={() => setShowRideForm(true)}
              >
                <Text style={styles.addVehicleButtonText}>+ Add a Ride</Text>
              </TouchableOpacity>
            </View>
           ) : (
            <View style={styles.vehicleContainer}>
              {vehicles.length > 0 ? (
                vehicles.map((vehicle, index) => (
                  <TouchableOpacity
                    key={vehicle.vehicle_id || index}
                    style={styles.vehicleButton}
                    onPress={() => handleSelectVehicle(vehicle)}
                  >
                    <Text style={styles.vehicleButtonText}>
                      {vehicle.vehicle_type} - {vehicle.vehicle_model} ({vehicle.vehicle_plate})
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noVehiclesText}>
                  No vehicles found. Add one below.
                </Text>
              )}
              
              <TouchableOpacity
                style={styles.addVehicleButton}
                onPress={() => setShowForm(true)}
              >
                <Text style={styles.addVehicleButtonText}>+ Add a Vehicle</Text>
              </TouchableOpacity>
            </View>
           )}
          
          {renderLocationPicker()}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
    marginTop: 30,
    marginBottom: 10,
    textAlign: 'center',
  },
  vehicleContainer: {
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },
  vehicleButton: {
    borderWidth: 1.5,
    borderColor: '#D3463A',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 8,
    alignItems: 'center',
    width: '90%',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleButtonText: {
    fontSize: 17,
    color: '#D3463A',
    fontWeight: '600',
  },
  noVehiclesText: {
    fontSize: 16,
    color: '#888',
    marginVertical: 15,
  },
  addVehicleButton: {
    marginTop: 24,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#0000',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignItems: 'center',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  addVehicleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  pickerContainer: {
    flex: 1,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#D3463A',
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    color: '#333',
    backgroundColor: 'transparent',
  },
  pickerItem: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  input1: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  input2: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    backgroundColor: '#fff',
  },

  passengerContainer: {
    marginBottom: 10,
  },
  
  passengerLabel: {
    marginBottom: 8,
    fontSize: 16,
    color: '#333',
  },
  
  passengerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  
  passengerButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  passengerButtonActive: {
    backgroundColor: '#D3463A',
    borderColor: '#D3463A',
  },
  
  passengerButtonText: {
    fontSize: 18,
    color: '#333',
  },

  passengerButtonTextActive: {
    color: '#fff',
  },

  halfInput: {
    width: '48%',
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
    color: '#D3463A',
  },
  addButton: {
    backgroundColor: '#D3463A',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#D3463A',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  rideContainer: {
    borderWidth: 1.5,
    borderColor: '#D3463A',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 8,
    width: '90%',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideFormContainer: {
    marginTop: 20,
    padding: 10,
  },
  rideText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 5,
    textAlign: 'center',
  },
  rideDetailsText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  ridePriceText: {
    fontSize: 18,
    color: '#D3463A',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  Timeinput: {
    width: '50%',
    height: 50,
    borderColor: '#D3463A',
    borderWidth: 1.5,
    borderRadius: 15,
    marginBottom: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    alignSelf: 'center',
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
  mapContainer: {
    flex: 1,
    position: 'relative'
  },
  searchBarContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 999,
    elevation: 5,
    backgroundColor: 'transparent'
  },
  map: {
    flex: 1
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#D3463A',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: 'white'
  },
  mapButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#fff',
  },
  mapButton: {
    width: 50,
    height: 50,
    backgroundColor: '#32CD32',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapButton1: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 15,
    backgroundColor: '#32CD32',
  },
  confirmButton: {
    backgroundColor: '#D3463A',
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputText: {
    color: '#000',
    fontSize: 16,
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
  },
});

export default PostRide;