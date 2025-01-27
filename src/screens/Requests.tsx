import React, { useEffect, useState } from 'react';
import {View,Text,StyleSheet,FlatList,TouchableOpacity,Image,Alert,ActivityIndicator,} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useNotification } from '../../context/NotificationContext';

const RequestsScreen = () => {
  const navigation = useNavigation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null);

  const { expoPushToken } = useNotification();
  
  const fetchRequests = async () => {
    try {
      const userId = await AsyncStorage.getItem('@7chalo:userId');
      if (!userId) {
        Alert.alert('Error', 'User not found');
        return;
      }
      setLoggedInUserId(parseInt(userId));

      const response = await axios.get(
        `https://appserver.aexrus.net/rides/getRequests/${userId}`
      );

      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchRequests();
    });

    return unsubscribe;
  }, []);

  const handleRequestAction = async (requestId: number, action: string, userId: string) => {
    try {
      // Send notifications with different messages
      await axios.post('https://appserver.aexrus.net/notifications/send', {
        requestId,
        riderMessage: `You have ${action === 'accept' ? 'accepted' : 'rejected'} a ride request`,
        requesterMessage: `Your ride request has been ${action === 'accept' ? 'accepted' : 'rejected'}`,
        type: action
      });
  
      const response = await axios.post(
        'https://appserver.aexrus.net/rides/updateRequest',
        {
          requestId,
          status: action === 'accept' ? 'accepted' : 'rejected',
        }
      );
  
      if (response.data.success) {
        Alert.alert('Success', `Request ${action === 'accept' ? 'accepted' : 'rejected'} successfully`);
        fetchRequests();
      }
    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Operation failed');
    }
  };
  
  const handleCancelRequest = async (requestId: number, ownerId: string) => {
    try {
      await axios.post('https://appserver.aexrus.net/notifications/send', {
        requestId,
        riderMessage: 'A rider has cancelled their request',
        requesterMessage: 'You have cancelled your ride request',
        type: 'cancel'
      });
  
      const response = await axios.post(
        'https://appserver.aexrus.net/rides/cancelRequest', 
        { requestId }
      );
  
      if (response.data.success) {
        Alert.alert('Success', 'Request canceled successfully');
        fetchRequests();
      }
    } catch (error:any) {
      console.error('Error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to cancel request');
    }
  };

  const renderRequest = ({ item }: { item: any }) => {
    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.userInfo}>
            <Image
              source={require("../../assets/images/profile.png")}
              style={styles.profileImage}
            />
            <Text style={styles.userName}>{item.requester_name}</Text>
          </View>
          <Text style={styles.timeSlot}>{item.time_slot}</Text>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.locationDetail}>
            <Text style={styles.label}>Pickup:</Text>
            <Text style={styles.value}>{item.pickup_point}</Text>
          </View>
          <View style={styles.locationDetail}>
            <Text style={styles.label}>Drop-off:</Text>
            <Text style={styles.value}>{item.dropoff_point}</Text>
          </View>
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Message:</Text>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        </View>

        {item.status === "pending" && (
          <View style={styles.actionButtons}>
            {/* Show Accept/Reject buttons for ride owner */}
            {loggedInUserId === parseInt(item.ride_owner_id) && (
 <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={() =>
                    handleRequestAction(
                      item.request_id,
                      "accept",
                      item.requester_id
                    )
                  }
                >
                  <Text style={styles.actionButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() =>
                    handleRequestAction(
                      item.request_id,
                      "reject",
                      item.requester_id
                    )
                  }
                >
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </>
            )}

            {loggedInUserId === parseInt(item.requester_id) && (
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() =>
                  handleCancelRequest(item.request_id, item.ride_owner_id)
                }
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.statusContainer}>
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status === "accepted"
                    ? "#4CAF50"
                    : item.status === "rejected"
                    ? "#D3463A"
                    : "#FFA500",
              },
            ]}
          >
            Status: {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
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
        <Text style={styles.title}>Ride Requests</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D3463A" />
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No requests found</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.request_id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
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
  listContainer: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eee',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  timeSlot: {
    fontSize: 16,
    color: '#666',
  },
  requestDetails: {
    marginBottom: 12,
  },
  locationDetail: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    width: 80,
  },
  value: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  messageContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#D3463A',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
});

export default RequestsScreen;