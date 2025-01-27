import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, Linking, ActivityIndicator, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform, Dimensions, Keyboard, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNotification } from '../../context/NotificationContext';
import axios from 'axios';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

type RootStackParamList = {
  ShowRides: undefined;
  Login: undefined;
  EditRide: { rideId: number };
  Requests: undefined;
}

type ShowRidesNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShowRides'>;

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
  ac_enabled: boolean;  // Add this field
  quiet_ride: boolean;  // Add this field
  profile_image?: string;
};

const KARACHI_BOUNDS = {
  north: 25.0700,  // Northern latitude
  south: 24.7700,  // Southern latitude
  east: 67.3650,   // Eastern longitude
  west: 66.6650    // Western longitude
};

const isLocationInKarachi = (latitude: number, longitude: number) => {
  return (
    latitude >= KARACHI_BOUNDS.south &&
    latitude <= KARACHI_BOUNDS.north &&
    longitude >= KARACHI_BOUNDS.west &&
    longitude <= KARACHI_BOUNDS.east
  );
};

const ShowRides = () => {
  const navigation = useNavigation<ShowRidesNavigationProp>();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const { expoPushToken } = useNotification();
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locationCoordinates, setLocationCoordinates] = useState({
    latitude: 24.8607,  // Default to Karachi coordinates
    longitude: 67.0011,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    const initialize = async () => {
      await fetchLoggedInUserId();
      await fetchRides();
      // Reset modal state when re-initializing
      setModalVisible(false);
      setSelectedRide(null);
    };

    initialize();

    // Add focus listener for screen refresh
    const unsubscribe = navigation.addListener('focus', () => {
      initialize(); // This will also reset the modal
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);

  const searchLocation = async (location: string) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to search locations.');
        return;
      }
  
      // Append "Karachi" to the search query if it's not already included
      const searchQuery = location.toLowerCase().includes('karachi') ? 
        location : 
        `${location}, Karachi, Pakistan`;

      const result = await Location.geocodeAsync(searchQuery);
      
      if (result.length > 0) {
        const { latitude, longitude } = result[0];

        // Check if the location is within Karachi boundaries
        if (!isLocationInKarachi(latitude, longitude)) {
          Alert.alert(
            'Location Outside Karachi', 
            'This location appears to be outside Karachi. Please select a location within Karachi city limits.'
          );
          return;
        }

        // Update the map coordinates with a closer zoom level
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.02,  // Zoomed in for better detail
          longitudeDelta: 0.02,
        };

        setLocationCoordinates(newRegion);
        
        // Animate map to new location
        mapRef.current?.animateToRegion(newRegion, 1000);
      } else {
        Alert.alert('Location Not Found', 'Could not find the specified location in Karachi.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      Alert.alert('Error', 'Failed to search location. Please try again.');
    }
  };

    const fetchLoggedInUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem('@7chalo:userId');
        if (userId) {
          const parsedId = parseInt(userId, 10);
          setLoggedInUserId(parsedId);
        }
      } catch (error) {
        console.error('Error fetching logged in user ID:', error);
      }
    };

  const fetchRides = async () => {
    try {
      const token = await AsyncStorage.getItem('@7chalo:token');
      if (!token) {
        Alert.alert('Error', 'You are not logged in. Please log in first.');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
  
      // Fetch rides data
      const ridesResponse = await axios.get('https://appserver.aexrus.net/rides/getRides');
  
      if (ridesResponse.data && ridesResponse.data.success && Array.isArray(ridesResponse.data.rides)) {
        const currentTime = new Date().getTime();
        const rides = ridesResponse.data.rides;
  
        // Fetch profile images for all users
        const ridesWithImages = await Promise.all(
          rides.map(async (ride: any) => {
            try {
              const imageResponse = await axios.get(
                `https://appserver.aexrus.net/images/user/${ride.user_id}/profile-image`
              );
              return {
                ...ride,
                user_id: parseInt(ride.user_id, 10),
                ac_enabled: Boolean(ride.ac_enabled),
                quiet_ride: Boolean(ride.quiet_ride),
                profile_image: imageResponse.data.profileImage || ''
              };
            } catch (error) {
              console.error('Error fetching profile image:', error);
              return {
                ...ride,
                user_id: parseInt(ride.user_id, 10),
                ac_enabled: Boolean(ride.ac_enabled),
                quiet_ride: Boolean(ride.quiet_ride),
                profile_image: ''
              };
            }
          })
        );
  
        const filteredRides = ridesWithImages
          .filter((ride: Ride) => {
            const rideTime = convertTo24HourFormat(ride.time_slot);
            return rideTime >= currentTime || (currentTime - rideTime <= 30 * 60 * 1000);
          })
          .sort((a: Ride, b: Ride) => {
            const timeA = convertTo24HourFormat(a.time_slot);
            const timeB = convertTo24HourFormat(b.time_slot);
            return timeA - timeB;
          });
  
        setRides(filteredRides);
      } else {
        Alert.alert('Error', 'No rides found.');
      }
    } catch (error) {
      console.error('Error fetching rides:', error);
      Alert.alert('Error', 'Failed to fetch rides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

    const convertTo24HourFormat = (time: string): number => {
      const [timeString, modifier] = time.split(' ');
      let [hours, minutes] = timeString.split(':').map(Number);

    if (modifier === 'PM' && hours !== 12) {
      hours += 12;
    } else if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.getTime();
  };

  const openDetails = (item: Ride) => {
    setSelectedRide(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedRide(null);
  };

  const handleSendRequest = async () => {
    if (!selectedRide || !requestMessage.trim()) {
      Alert.alert('Error', 'Please enter a message for your request');
      return;
    }
  
    try {
      const userId = await AsyncStorage.getItem('@7chalo:userId');
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to send requests');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
  
      const response = await axios.post(
        'https://appserver.aexrus.net/rides/sendRequest',
        {
          rideId: selectedRide.ride_id,
          requesterId: userId,
          message: requestMessage,
          rideOwnerId: selectedRide.user_id,
          pickup_point: selectedRide.pickup_point,
          dropoff_point: selectedRide.dropoff_point,
          time_slot: selectedRide.time_slot
        }
      );
  
      if (response.data.success) {
        await axios.post('https://appserver.aexrus.net/notifications/send', {
          requestId: response.data.requestId,
          riderMessage: `You have received a new ride request from a passenger`,
          requesterMessage: `Your ride request has been sent to ${selectedRide.full_name}`,
          type: 'new_request'
        });
  
        Alert.alert(
          'Success',
          'Your request has been sent! You can view its status in the Requests screen.',
          [
            {
              text: 'View Requests',
              onPress: () => {
                setRequestModalVisible(false);
                setRequestMessage('');
                closeModal();
                navigation.navigate('Requests');
              }
            },
            {
              text: 'OK',
              onPress: () => {
                setRequestModalVisible(false);
                setRequestMessage('');
                closeModal();
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to send request');
    }
  };

  const checkExistingRequest = async (rideId: number) => {
    try {
      const userId = await AsyncStorage.getItem('@7chalo:userId');
      
      if (!userId) return false;
  
      const response = await axios.get(
        `https://appserver.aexrus.net/rides/checkRequest/${rideId}/${userId}`
      );
  
      return response.data.exists;
    } catch (error) {
      console.error('Error checking existing request:', error);
      return false;
    }
  };

  const handleEditRide = () => {
    if (selectedRide) {
      navigation.navigate('EditRide', { rideId: selectedRide.ride_id });
    }
  };

  const handleRequestPress = async (item: Ride) => {
    const hasExistingRequest = await checkExistingRequest(item.ride_id);
    
    if (hasExistingRequest) {
      Alert.alert('Request Exists', 'You have already sent a request for this ride.');
      return;
    }
  
    setSelectedRide(item);
    setRequestModalVisible(true);
  };

  
  // Add Map Modal Component
  const MapModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={mapModalVisible}
      onRequestClose={() => setMapModalVisible(false)}
    >
      <View style={styles.mapModalContainer}>
        <View style={styles.mapModalHeader}>
          <Text style={styles.mapModalTitle}>{selectedLocation}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setMapModalVisible(false)}
          >
            <Image
              source={require('../../assets/images/close.png')}
              style={styles.closeIcon}
            />
          </TouchableOpacity>
        </View>
        
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: 24.8607,  // Karachi center
            longitude: 67.0011,
            latitudeDelta: 0.2,  // Show more of Karachi initially
            longitudeDelta: 0.2,
          }}
          region={locationCoordinates}
          minZoomLevel={12}  // Restrict minimum zoom level
          maxZoomLevel={20}  // Restrict maximum zoom level
        >
          <Marker
            coordinate={{
              latitude: locationCoordinates.latitude,
              longitude: locationCoordinates.longitude,
            }}
            title={selectedLocation}
          />
        </MapView>
      </View>
    </Modal>
  );

  const renderRide = ({ item }: { item: Ride }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.profileContainer}>
          <Image
            source={
              item.profile_image
                ? { uri: `https://appserver.aexrus.net${item.profile_image}` }
                : require('../../assets/images/profile.png')
            }
            style={styles.profileImage}
          />
          <Text style={styles.name}>{item.full_name}</Text>
        </View>
        <Text style={styles.time}>{item.time_slot}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.rowContainer}>
          <Text style={styles.label}>Pickup:</Text>
          <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
            {item.pickup_point.length > 19 ? `${item.pickup_point.substring(0, 19)}...` : item.pickup_point}
          </Text>
        </View>

        <View style={styles.rowContainer}>
          <Text style={styles.label}>Drop off:</Text>
          <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
            {item.dropoff_point.length > 19 ? `${item.dropoff_point.substring(0, 19)}...` : item.dropoff_point}
          </Text>
        </View>

        <View style={styles.rowContainer}>
          <Text style={styles.label}>Vehicle:</Text>
          <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
            {/* Vehicle Model */}
            {item.vehicle_model.length > 19 ? 
              `${item.vehicle_model.substring(0, 19)}...` : 
              item.vehicle_model}
            {" "}
            {/* Vehicle Plate */}
            {item.vehicle_plate.length > 19 ? 
              `${item.vehicle_plate.substring(0, 19)}...` : 
              item.vehicle_plate}
          </Text>
        </View>

        <View style={styles.iconsContainer}>
          <Image
            source={item.ac_enabled ?
              require('../../assets/images/ACon.png') :
              require('../../assets/images/ACoff.png')}
            style={[
              styles.featureIcon,
              { tintColor: item.ac_enabled ? '#60E1FF' : '#D3D3D3' }
            ]}
          />
          <Image
            source={item.quiet_ride ?
              require('../../assets/images/mute.png') :
              require('../../assets/images/unmute.png')}
            style={[
              styles.featureIcon1,
              { tintColor: item.quiet_ride ? '#FFFFFF' : '#30BA00' }
            ]}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.detailsButton, { flex: 1 }]}
          onPress={() => openDetails(item)}
        >
          <Text style={styles.detailsButtonText}>Details</Text>
        </TouchableOpacity>

        {item.user_id !== loggedInUserId && (
          <TouchableOpacity
            style={[styles.requestButton, { flex: 1 }]}
            onPress={() => handleRequestPress(item)}
          >
            <Text style={styles.requestButtonText}>Send Request</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const RequestModal = () => {
    const predefinedMessages = [
      "Hi! I'm looking for a ride and your schedule matches mine perfectly.",
      "Hello! I'm interested in sharing the ride. I'm a regular commuter on this route.",
      "Hey there! I'd like to join your ride. I'm a student and this timing works great for me.",
      "Hi! I'm a working professional and would love to share the ride with you.",
    ];
  
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={requestModalVisible}
        onRequestClose={() => setRequestModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalOverlay]}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Send Ride Request</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setRequestModalVisible(false)}
                >
                  <Image
                    source={require('../../assets/images/close.png')}
                    style={styles.closeIcon}
                  />
                </TouchableOpacity>
              </View>
  
              <ScrollView style={styles.modalBody}>
                <Text style={styles.messageLabel}>Select a message:</Text>
                {predefinedMessages.map((message, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.messageOption,
                      requestMessage === message && styles.selectedMessage
                    ]}
                    onPress={() => setRequestMessage(message)}
                  >
                    <Text style={[
                      styles.messageOptionText,
                      requestMessage === message && styles.selectedMessageText
                    ]}>
                      {message}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  style={[
                    styles.sendRequestButton,
                    !requestMessage && styles.sendRequestButtonDisabled
                  ]}
                  onPress={handleSendRequest}
                  disabled={!requestMessage}
                >
                  <Text style={styles.sendRequestButtonText}>Send Request</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const RideDetailsModal = () => {
    const handleLocationCheck = (locationType: 'pickup' | 'dropoff') => {
      if (selectedRide) {
        const location = locationType === 'pickup' ? 
          selectedRide.pickup_point : 
          selectedRide.dropoff_point;
        
        setSelectedLocation(location);
        setMapModalVisible(true);
        searchLocation(location);
      }
    };

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ride Details</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Image
                  source={require('../../assets/images/close.png')}
                  style={styles.closeIcon}
                />
              </TouchableOpacity>
            </View>

            {selectedRide && (
              <ScrollView
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <View style={styles.modalBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name:</Text>
                    <View style={styles.nameContainer}>
                      <Text style={styles.detailValue}>{selectedRide.full_name}</Text>
                      <Image
                        source={require('../../assets/images/verified.png')}
                        style={styles.verifiedIcon}
                      />
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fare:</Text>
                    <Text style={styles.detailValue}>{selectedRide.price} Rupees</Text>
                  </View>

                  <View style={styles.featureSection}>
                    <Text style={styles.featureHeader}>Ride Features</Text>
                    <View style={styles.featureRow}>
                      <View style={styles.featureItem}>
                        <Image
                          source={selectedRide.ac_enabled ?
                            require('../../assets/images/ACon.png') :
                            require('../../assets/images/ACoff.png')}
                          style={[
                            styles.modalFeatureIcon,
                            { tintColor: selectedRide.ac_enabled ? '#60E1FF' : '#D3D3D3' }
                          ]}
                        />
                        <Text style={styles.featureText}>
                          {selectedRide.ac_enabled ? 'AC Enabled' : 'AC Disabled'}
                        </Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Image
                          source={selectedRide.quiet_ride ?
                            require('../../assets/images/mute.png') :
                            require('../../assets/images/unmute.png')}
                          style={[
                            styles.modalFeatureIcon1,
                            { tintColor: selectedRide.quiet_ride ? '#FFFFFF' : '#30BA00' }
                          ]}
                        />
                        <Text style={styles.featureText}>
                          {selectedRide.quiet_ride ? 'Quiet Ride' : 'Regular Ride'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.bioSection}>
                    <Text style={styles.bioHeader}>Bio</Text>
                    <Text style={styles.bioText}>
                      "Hey, I am a final year student at MAJU! I am also working part time as freelance"
                    </Text>
                  </View>

                  <View style={styles.locationSection}>
                    <Text style={styles.locationHeader}>Location Details</Text>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Pickup:</Text>
                      <Text style={styles.detailValue}>{selectedRide.pickup_point}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Drop-off:</Text>
                      <Text style={styles.detailValue}>{selectedRide.dropoff_point}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Time:</Text>
                      <Text style={styles.detailValue}>{selectedRide.time_slot}</Text>
                    </View>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.checkButton}
                      onPress={() => handleLocationCheck('pickup')}
                    >
                      <Text style={styles.checkButtonText}>Check Pickup</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.checkButton}
                      onPress={() => handleLocationCheck('dropoff')}
                    >
                      <Text style={styles.checkButtonText}>Check Drop-off</Text>
                    </TouchableOpacity>
                  </View>

                  {Number(selectedRide.user_id) === loggedInUserId ? (
                    <TouchableOpacity
                      style={[styles.whatsappButton, { backgroundColor: '#D3463A' }]}
                      onPress={() => {
                        closeModal(); // Close modal before navigation
                        navigation.navigate('EditRide', { rideId: selectedRide.ride_id });
                      }}
                    >
                      <Text style={styles.whatsappButtonText}>Edit Information</Text>
                      <Image
                        source={require('../../assets/images/edit.png')}
                        style={[styles.whatsappIcon, { tintColor: '#fff' }]}
                      />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.whatsappButton}
                      onPress={() => {
                        const message = `Hi, I'm interested in your ride from ${selectedRide.pickup_point} to ${selectedRide.dropoff_point} at ${selectedRide.time_slot}`;
                        const encodedMessage = encodeURIComponent(message);
                        const whatsappUrl = `whatsapp://send?phone=${selectedRide.whatsapp_number}&text=${encodedMessage}`;
                        Linking.canOpenURL(whatsappUrl)
                          .then(supported => {
                            if (supported) {
                              return Linking.openURL(whatsappUrl);
                            } else {
                              Alert.alert('Error', 'WhatsApp is not installed on your device');
                            }
                          })
                          .catch(err => Alert.alert('Error', 'Failed to open WhatsApp'));
                      }}
                    >
                      <Text style={styles.whatsappButtonText}>Contact on WhatsApp</Text>
                      <Image
                        source={require('../../assets/images/whatsapp.png')}
                        style={styles.whatsappIcon}
                      />
                    </TouchableOpacity>
                  )}
                  <View style={styles.modalBottomPadding} />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Image
            source={require('../../assets/images/backarrow.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Active Rides</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D3463A" />
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.ride_id.toString()}
          renderItem={renderRide}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <RideDetailsModal />
      <RequestModal />
      <MapModal />
    </View>
  );
};

// Styles remain the same as before
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#D3463A',
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
  },
  backButton: {
    padding: 10,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
  },
  logo: {
    width: 121,
    height: 84,
    resizeMode: 'contain',
  },
  listContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#D3463A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    top: 2
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  time: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardBody: {
    width: '100%',
  },
  rowContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 7,
    paddingHorizontal: 20,
  },
  messageOption: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  selectedMessage: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  messageOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedMessageText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  sendRequestButtonDisabled: {
    backgroundColor: '#ccc',
  },
  label: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: '30%',
    textAlign: 'right',
    marginRight: 5,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#D3463A',
    padding: 15,
    zIndex: 1,
  },
  mapModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 60,
  },
  value: {
    color: '#fff',
    fontSize: 18,
    minWidth: '35%',
    textAlign: 'left',
  },
  iconsContainer: {
    flexDirection: 'row',
    marginTop: 5,
    justifyContent: 'center',
    gap: 30,
  },
  featureIcon: {
    width: 26,
    height: 30,
  },
  featureIcon1: {
    width: 31,
    height: 28,
  },
  detailsButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 7,
    alignItems: 'center',
    marginTop: 20,
  },
  
  detailsButtonText: {
    color: '#D3463A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%', // Limit modal height
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#D3463A',
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 1, // Ensure header stays on top
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalBody: {
    padding: 20,
  },
  modalBottomPadding: {
    height: 20, // Add padding at the bottom for better scrolling
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    width: 100,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featureSection: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
  },
  featureHeader: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  featureItem: {
    alignItems: 'center',
  },
  modalFeatureIcon: {
    width: 28,
    height: 30,
    marginBottom: 5,
  },
  modalFeatureIcon1: {
    width: 34,
    height: 30,
    marginBottom: 5,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 18,
    color: '#000',
  },
  verifiedIcon: {
    width: 20,
    height: 20,
    marginLeft: 5,
  },
  bioSection: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginVertical: 15,
  },
  bioHeader: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  bioText: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  locationSection: {
    marginVertical: 15,
  },
  locationHeader: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
    gap: 10,
  },
  checkButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    padding: 15,
    flex: 1,
    alignItems: 'center',
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 25,
    padding: 12,
    marginTop: 10,
  },
  whatsappButtonText: {
    color: '#fff',
    fontSize: 16,
    marginRight: 8,
    fontWeight: 'bold',
  },
  whatsappIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'column',
    marginTop: 10,
  },
  requestButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    padding: 7,
    marginTop: 10,
    alignItems: 'center',
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 15,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: 20,
    color: '#000',
  },
  sendRequestButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
  },
  sendRequestButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ShowRides;