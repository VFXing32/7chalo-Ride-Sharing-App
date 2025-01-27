import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Edit2, Edit } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ProfileData = {
  name: string;
  bio: string;
  profileImage: string;
  email: string;
  phone: string;
};

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    bio: '',
    profileImage: '',
    email: '',
    phone: '',
  });
  const [tempData, setTempData] = useState<ProfileData>({
    name: '',
    bio: '',
    profileImage: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('@7chalo:userId');
      if (!userId) {
        throw new Error('User ID not found');
      }

      const [profileResponse, imageResponse] = await Promise.all([
        fetch(`https://appserver.aexrus.net/auth/users/${userId}`),
        fetch(`https://appserver.aexrus.net/images/user/${userId}/profile-image`)
      ]);

      if (!profileResponse.ok || !imageResponse.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const data = await profileResponse.json();
      const { profileImage } = await imageResponse.json();

      const profileInfo = {
        name: data.name || '',
        bio: data.bio || '',
        profileImage: profileImage || '',
        email: data.email || '',
        phone: data.phone || '',
      };

      setProfileData(profileInfo);
      setTempData(profileInfo);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('@7chalo:userId');
      if (!userId) throw new Error('User ID not found');

      const response = await fetch(
        `https://appserver.aexrus.net/auth/users/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: tempData.name,
            bio: tempData.bio,
            email: tempData.email,
            phone: tempData.phone,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setProfileData(tempData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        const userId = await AsyncStorage.getItem('@7chalo:userId');
        if (!userId) throw new Error('User ID not found');

        const formData = new FormData();
        formData.append('profileImage', {
          uri: result.assets[0].uri,
          name: `profile_${userId}.jpg`,
          type: 'image/jpeg',
        } as any);

        const response = await fetch(
          `https://appserver.aexrus.net/images/upload/${userId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            body: formData,
          }
        );

        if (!response.ok) throw new Error('Failed to upload image');

        const { profileImage } = await response.json();
        setTempData(prev => ({ ...prev, profileImage }));
        if (!isEditing) {
          setProfileData(prev => ({ ...prev, profileImage }));
        }
      }
    } catch (error) {
      console.error('Error updating image:', error);
      Alert.alert('Error', 'Failed to update profile image');
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrowContainer}>
            <Image source={require('../../assets/images/backarrow.png')} style={styles.backarrowlogo} />
          </TouchableOpacity>
          <Image source={require('../../assets/images/signuplogo.png')} style={styles.logo} />
        </View>

        {isEditing && (
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => {
                setTempData(profileData);
                setIsEditing(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleUpdateProfile}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            {!isEditing && (
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={styles.editButtonContainer}
              >

                <Edit size={23} color="#fff" />
              </TouchableOpacity>
            )}
            <Text style={styles.title}>Profile</Text>
          </View>

          <View style={styles.imageSection}>
            <TouchableOpacity onPress={handleImagePick} style={styles.profileImageContainer}>
              <Image
                source={
                  tempData.profileImage
                    ? { uri: `https://appserver.aexrus.net${tempData.profileImage}` }
                    : require('../../assets/images/profilebig.png')
                }
                style={styles.profileImage}
              />
              <View style={styles.editIconContainer}>
                <Edit2 size={15} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldsContainer}>
            <View style={styles.fieldRow}>
              <Text style={styles.label}>Name:</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.readOnlyInput]}
                value={tempData.name}
                editable={isEditing}
                onChangeText={(text) => setTempData(prev => ({ ...prev, name: text }))}
                placeholderTextColor="#fff"
              />
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>Bio:</Text>
              <TextInput
                style={[styles.input, styles.multiline, !isEditing && styles.readOnlyInput]}
                value={tempData.bio}
                editable={isEditing}
                onChangeText={(text) => setTempData(prev => ({ ...prev, bio: text }))}
                multiline
                placeholderTextColor="#fff"
              />
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>Email:</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.readOnlyInput]}
                value={tempData.email}
                editable={isEditing}
                onChangeText={(text) => setTempData(prev => ({ ...prev, email: text }))}
                placeholderTextColor="#fff"
              />
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>Phone:</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.readOnlyInput]}
                value={tempData.phone}
                editable={isEditing}
                onChangeText={(text) => setTempData(prev => ({ ...prev, phone: text }))}
                placeholderTextColor="#fff"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  headerButtons: {
    position: 'absolute',
    right: 20,
    top: 35,
    flexDirection: 'row',
    gap: 15,
    zIndex: 1,
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
    color: '#fff',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#D3463A',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
  },
  cardHeader: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
  },
  imageSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 125,
    height: 125,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  editIconContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#D3463A',
    borderRadius: 15,
    padding: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  fieldsContainer: {
    gap: 15,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: '25%',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
    paddingVertical: 5,
  },
  readOnlyInput: {
    borderBottomWidth: 0,
  },
  multiline: {
    height: 80,
    textAlignVertical: 'center',
  },
  editButtonContainer: {
    alignItems: 'flex-end',
  },
  editButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#D3463A',
    fontWeight: 'bold',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#D3463A',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;