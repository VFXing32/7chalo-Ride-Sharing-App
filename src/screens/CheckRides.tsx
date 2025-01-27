import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Trash2, Pencil, X } from 'lucide-react-native';

type RootStackParamList = {
  Menu: undefined;
  Login: undefined;
  EditRide: { rideId: number };
};

type CheckRidesNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

interface Ride {
  id: string;
  pickup_point: string;
  dropoff_point: string;
  vehicle_model: string;
  vehicle_plate: string;
  full_name: string;
  time_slot: string;
  price: number;
  ac_enabled: boolean;
  quiet_ride: boolean;
}

const CheckRidesScreen = () => {
  const navigation = useNavigation<CheckRidesNavigationProp>();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<string | null>(null);

  const fetchRides = async () => {
    try {
      const userId = await AsyncStorage.getItem('@7chalo:userId');
      if (!userId) {
        Alert.alert('Error', 'User ID not found. Please log in again.');
        navigation.navigate('Login');
        return;
      }
  
      const response = await axios.get(
        `https://appserver.aexrus.net/rides/check?user_id=${userId}`
      );
  
      if (response.data.success) {
        // Transform the data if needed to ensure ac_enabled and quiet_ride are boolean
        const transformedRides = response.data.rides.map((ride: Ride) => ({
          ...ride,
          ac_enabled: Boolean(ride.ac_enabled),
          quiet_ride: Boolean(ride.quiet_ride)
        }));
        setRides(transformedRides);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to fetch rides.');
      }
    } catch (error) {
      console.error('Error fetching rides:', error);
      Alert.alert('Error', 'Failed to fetch rides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();

    // Add focus listener to refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRides();
      setSelectedRide(null); // Reset modal state
    });

    // Cleanup subscription
    return unsubscribe;
  }, [navigation]);

  const handleEdit = () => {
    if (selectedRide) {
      navigation.navigate('EditRide', { rideId: parseInt(selectedRide) });
      setSelectedRide(null);
    }
  };

  const handleDelete = async () => {
    if (selectedRide) {
      try {
        await axios.post('https://appserver.aexrus.net/rides/deleteRide', { id: selectedRide });
        Alert.alert('Success', 'Ride deleted successfully.');
        setRides(rides.filter(ride => ride.id !== selectedRide));
        setSelectedRide(null);
      } catch (error) {
        console.error('Error deleting ride:', error);
        Alert.alert('Error', 'Failed to delete ride.');
      }
    }
  };

  const renderRide = ({ item }: { item: Ride }) => (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={[styles.card, selectedRide === item.id && styles.cardSelected]}
        onPress={() => setSelectedRide(item.id)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.profileContainer}>
            <Image source={require('../../assets/images/profile.png')} style={styles.profileImage} />
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
            <Text style={styles.value}>{`${item.vehicle_model} ${item.vehicle_plate}`}</Text>
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

        <View style={styles.cardFooter}>
          <Text style={styles.price}>{item.price} RS</Text>
        </View>
      </TouchableOpacity>

      {selectedRide === item.id && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setSelectedRide(null)}
            >
              <X color="white" size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={handleEdit}>
              <Pencil color="white" size={30} style={{ marginBottom: 7 }} />
              <Text style={styles.modalButtonText}>EDIT</Text>
            </TouchableOpacity>
            <View style={styles.modalDivider} />
            <TouchableOpacity style={styles.modalButton} onPress={handleDelete}>
              <Trash2 color="white" size={30} style={{ marginBottom: 7 }} />
              <Text style={styles.modalButtonText}>DELETE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrowContainer}>
          <Image source={require('../../assets/images/backarrow.png')} style={styles.backarrowlogo} />
        </TouchableOpacity>
        <Image source={require('../../assets/images/signuplogo.png')} style={styles.logo} />
      </View>

      <Text style={styles.title}>Active Rides</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#D3463A" />
      ) : rides.length > 0 ? (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRide}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <Text style={styles.noRidesText}>No rides available.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  backArrowContainer: {
    position: 'absolute',
    left: 20,
    zIndex: 1,
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
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D3463A',
    textAlign: 'center',
    marginVertical: 20,
  },
  listContainer: {
    padding: 20,
  },
  cardContainer: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#D3463A',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
  },
  cardSelected: {
    opacity: 0.6,
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
  label: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: '30%',
    textAlign: 'right',
    marginRight: 5,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  price: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
  modalView: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: 237,
    height: 126,
    backgroundColor: '#D3463A',
    borderRadius: 20,
    padding: 10,
  },
  closeButton: {
    position: 'absolute',
    top: -15,
    right: -15,
    backgroundColor: '#D3463A',
    borderRadius: 15,
    padding: 3,
    elevation: 5,
  },
  modalButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'white',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noRidesText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#888',
    marginTop: 20,
  },
});

export default CheckRidesScreen;