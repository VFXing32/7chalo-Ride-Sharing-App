import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, StatusBar, Alert, DrawerLayoutAndroid, Animated, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { User, Clock, HelpCircle, Headphones, LogOut, Bell, Edit2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

type RootStackParamList = {
  PostRide: undefined;
  CheckRides: undefined;
  ShowRides: undefined;
  Home: undefined;
  Menu: undefined;
  Profile: undefined;
  Requests: undefined;
  Questions: undefined;
};

type ProfileData = {
  name: string;
  profileImage: string;
  stats: {
    totalRides: number;
    moneyEarned: number;
    treesPlanted: number;
  };
  badge: string;
  rating: number;
};

type MenuNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

const AnimatedNumber = ({ value, style, decimalPlaces = 0 }: { value: number; style: any; decimalPlaces?: number }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener((state) => {
      const number = state.value;
      setDisplayValue(number.toFixed(decimalPlaces));
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value, decimalPlaces]);

  return <Text style={style}>{displayValue}</Text>;
};

const RoleSplash = ({ isVisible, role }: { isVisible: boolean; role: string }) => {
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnimation.setValue(0);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <View style={styles.splashContainer}>
      <Animated.View style={[styles.splashContent, { opacity: fadeAnimation }]}>
        <Image 
          source={role === 'Captain' 
            ? require('../../assets/images/Passengermode.png')
            : require('../../assets/images/Captainmode.png')
          }
          style={styles.splashImage}
        />
      </Animated.View>
    </View>
  );
};

const Menu = () => {
  const navigation = useNavigation<MenuNavigationProp>();
  const [isCaptain, setIsCaptain] = useState(false);
  const drawerRef = useRef<DrawerLayoutAndroid>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [drawerKey, setDrawerKey] = useState(0);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'Loading...',
    profileImage: '',
    stats: {
      totalRides: 0,
      moneyEarned: 0,
      treesPlanted: 0,
    },
    badge: 'Bronze',
    rating: 0,
  });

  const fetchProfileData = async () => {
    try {
      const userId = await AsyncStorage.getItem('@7chalo:userId');
      if (!userId) {
        console.log('User ID not found in AsyncStorage');
        setProfileData({
          name: 'User',
          profileImage: '',
          stats: {
            totalRides: 0,
            moneyEarned: 0,
            treesPlanted: 0,
          },
          badge: 'Bronze',
          rating: 0.0,
        });
        return;
      }

      // Try to get cached profile data first
      const cachedProfile = await AsyncStorage.getItem('@7chalo:profileData');
      if (cachedProfile) {
        setProfileData(JSON.parse(cachedProfile));
      }

      // Fetch profile data in background
      const [profileResponse, imageResponse] = await Promise.all([
        fetch(`https://appserver.aexrus.net/auth/users/${userId}`),
        fetch(`https://appserver.aexrus.net/images/user/${userId}/profile-image`)
      ]);

      if (!profileResponse.ok) {
        throw new Error(`Profile fetch failed with status: ${profileResponse.status}`);
      }

      const profileData = await profileResponse.json();
      let profileImage = '';
      
      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        profileImage = imageData.profileImage || '';
      }

      const newProfileData = {
        name: profileData.name || 'User',
        profileImage: profileImage,
        stats: {
          totalRides: profileData.stats?.totalRides || 0,
          moneyEarned: profileData.stats?.moneyEarned || 0,
          treesPlanted: profileData.stats?.treesPlanted || 0,
        },
        badge: profileData.badge || 'Bronze',
        rating: profileData.rating || 0.0,
      };

      // Cache the profile data
      await AsyncStorage.setItem('@7chalo:profileData', JSON.stringify(newProfileData));
      setProfileData(newProfileData);

    } catch (error) {
      console.error('Error fetching profile data:', error);
      // Fall back to cached data if available
      const cachedProfile = await AsyncStorage.getItem('@7chalo:profileData');
      if (cachedProfile) {
        setProfileData(JSON.parse(cachedProfile));
      } else {
        setProfileData({
          name: 'User',
          profileImage: '',
          stats: {
            totalRides: 0,
            moneyEarned: 0,
            treesPlanted: 0,
          },
          badge: 'Bronze',
          rating: 0.0,
        });
      }
    }
  };

  const handleProfileImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
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
              Accept: 'application/json',
              'Content-Type': 'multipart/form-data',
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to upload profile image');
        }

        const { profileImage } = await response.json();
        
        // Update cached profile data
        const cachedProfile = await AsyncStorage.getItem('@7chalo:profileData');
        if (cachedProfile) {
          const updatedProfile = {
            ...JSON.parse(cachedProfile),
            profileImage
          };
          await AsyncStorage.setItem('@7chalo:profileData', JSON.stringify(updatedProfile));
        }

        setProfileData(prev => ({
          ...prev,
          profileImage,
        }));
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      Alert.alert('Error', 'Failed to update profile image');
    }
  };

  const ProfileImageSection = ({
    image,
    onPress,
  }: {
    image: string;
    onPress: () => void;
  }) => {
    const fullImagePath = image ? `https://appserver.aexrus.net${image}` : '';

    return (
      <View  style={styles.profileImageContainer}>
        <Image
          source={
            fullImagePath
              ? { uri: fullImagePath }
              : require('../../assets/images/profilebig.png')
          }
          style={styles.profileImage}
        />
      </View>
    );
  };

  const getBadgeColor = (badge: string) => {
    switch (badge.toLowerCase()) {
      case 'platinum':
        return '#E5E4E2';
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      default:
        return '#CD7F32';
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        try {
          const storedRole = await AsyncStorage.getItem('@7chalo:role');
          setIsCaptain(storedRole === 'Captain');
          await fetchProfileData();
        } catch (error) {
          console.error('Error loading data:', error);
        }
      };
      loadData();
    }, [])
  );


  useEffect(() => {
    setDrawerKey(prevKey => prevKey + 1);
  }, [profileData]);

  const handleRoleSwitch = async () => {
    const newRole = isCaptain ? 'Passenger' : 'Captain';
    setShowSplash(true);
    
    try {
      await AsyncStorage.setItem('@7chalo:role', newRole);
      setIsCaptain(!isCaptain);

      setTimeout(() => {
        setShowSplash(false);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Menu' }],
        });
      }, 2000);
    } catch (error) {
      console.error('Error saving role:', error);
      Alert.alert('Error', 'Failed to switch roles. Please try again.');
      setShowSplash(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const handleSupportClick = async () => {
    try {
      const url = 'mailto:admin@7chalo.com';
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Error',
          'Unable to open email client. Please email admin@7chalo.com directly.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening email client:', error);
      Alert.alert(
        'Error',
        'Unable to open email client. Please email admin@7chalo.com directly.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderNavigationView = () => {
    const menuItems = [
      { icon: User, text: 'My Profile', onPress: () => navigation.navigate('Profile') },
      { icon: Bell, text: 'Ride Requests', onPress: () => navigation.navigate('Requests') },
      // { icon: Clock, text: 'Ride history' },
      { icon: HelpCircle, text: 'Faq and Q/A', onPress: () => navigation.navigate('Questions') },
      { icon: Headphones, text: 'Support', onPress: handleSupportClick }
    ];

    return (
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Image source={require('../../assets/images/signuplogo.png')} style={styles.sidebarlogo} />
        </View>

        <View style={styles.sidebarProfile}>
          <ProfileImageSection
            image={profileData.profileImage}
            onPress={handleProfileImage}
          />
          <Text style={styles.sidebarProfileName}>{profileData.name}</Text>
          <View style={styles.sidebarRating}>
            <Text style={styles.sidebarRatingIcon}>⭐</Text>
            <Text style={styles.sidebarRatingText}>
                {Number(profileData.rating || 0).toFixed(1)}
            </Text>
          </View>
        </View>

        <View style={styles.sidebarMenu}>
          {menuItems.map((Item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.sidebarMenuItem}
              onPress={Item.onPress}
            >
              <View style={styles.sidebarMenuIconContainer}>
                <Item.icon size={24} color="#4B5563" />
              </View>
              <Text style={styles.sidebarMenuText}>{Item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sidebarFooter}>
          <TouchableOpacity style={styles.sidebarLogoutButton} onPress={handleLogout}>
            <Text style={styles.sidebarLogoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      <RoleSplash isVisible={showSplash} role={isCaptain ? 'Passenger' : 'Captain'} />
      <DrawerLayoutAndroid
        key={drawerKey}
        ref={drawerRef}
        drawerWidth={300}
        drawerPosition="left"
        renderNavigationView={renderNavigationView}
      >
        <View style={styles.container}>
          <StatusBar backgroundColor="#D3463A" barStyle="light-content" />
          
          <View style={styles.cardContainer}>
            {/* Menu and Badge Section */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => drawerRef.current?.openDrawer()}
              >
                <View style={styles.menuIconContainer}>
                  <View style={styles.menuIconLine} />
                  <View style={styles.menuIconLine} />
                  <View style={styles.menuIconLine} />
                </View>
              </TouchableOpacity>

              <View style={styles.badgeSection}>
                <View style={[
                  styles.badgeContainer,
                  { backgroundColor: getBadgeColor(profileData.badge) }
                ]}>
                  <Text style={styles.badgeText}>{profileData.badge}</Text>
                </View>
                <View style={styles.starContainer}>
                  <Text style={styles.starIcon}>⭐</Text>
                </View>
              </View>
            </View>

            {/* Rest of your existing components... */}
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <ProfileImageSection
                image={profileData.profileImage}
                onPress={handleProfileImage}
              />
              <Text style={styles.profileName}>{profileData.name}</Text>
            </View>

            {/* Stats Section */}
            <View style={styles.statsSection}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Rides</Text>
                <AnimatedNumber value={profileData.stats.totalRides} style={styles.statValue} />
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Money Saved</Text>
                <AnimatedNumber value={profileData.stats.moneyEarned} style={styles.statValue} />
                <Text style={styles.currency}>PKR</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Trees Planted</Text>
                <AnimatedNumber
                  value={profileData.stats.treesPlanted}
                  style={styles.statValue}
                  decimalPlaces={2}
                />
              </View>
            </View>
          </View>

          {/* Success Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>You are doing great so far! Keep up</Text>
          </View>

          {/* Role Toggle */}
          <View style={styles.switchContainer}>
            <View style={styles.switchButton}>
              <TouchableOpacity
                style={[styles.switchInactive, isCaptain && styles.switchActive]}
                onPress={handleRoleSwitch}
              >
                <Text style={[styles.switchText, { color: isCaptain ? '#fff' : '#D3463A' }]}>
                  Captain
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.switchInactive, !isCaptain && styles.switchActive]}
                onPress={handleRoleSwitch}
              >
                <Text style={[styles.switchText, { color: !isCaptain ? '#fff' : '#D3463A' }]}>
                  Passenger
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            {isCaptain ? (
              <>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('PostRide')}
                >
                  {/* <Text style={styles.actionIcon}>✏️</Text> */}
                  <Text style={styles.actionText}>Create a ride</Text>
                </TouchableOpacity>
                {/* <Text style={styles.orText}>OR</Text> */}
                <TouchableOpacity 
                  style={styles.actionButton1}
                  onPress={() => navigation.navigate('CheckRides')}
                >
                  {/* <Text style={styles.actionIcon}>✓</Text> */}
                  <Text style={styles.actionText1}>Check my rides</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={styles.actionButton1}
                onPress={() => navigation.navigate('ShowRides')}
              >
                <Text style={styles.actionText1}>Look for a ride</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </DrawerLayoutAndroid>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  editIconContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#D3463A',
    borderRadius: 15,
    padding: 8,
  },
  editIcon: {
    width: 15,
    height: 15,
    tintColor: '#FFFFFF',
  },
  splashImage: {
    width: 270,
    height: 164,
    resizeMode: 'contain',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardContainer: {
    backgroundColor: '#D3463A',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    padding:20,
    elevation: 4,      // Changed from 5 to 4
    marginBottom: -10, // Added this line
    zIndex: 1,        // Added this line
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
  },
  menuIconContainer: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  menuIconLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#FFF',
    borderRadius: 1,
  },
  badgeSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: '#CD7F32',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10,
  },
  badgeText: {
    color: '#FFF',
    fontWeight: '600',
  },
  starContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  starIcon: {
    fontSize: 16,
    color: '#FFD700',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF',
    elevation: 5,
    marginBottom: 15,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  ratingIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    height: 80,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 32, // Add lineHeight to maintain consistent spacing
  },
  statLabel: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 8, // Use margin instead of padding for consistent spacing
    height: 20, // Fixed height for labels
  },
  currency: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 2, // Small gap between value and currency
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#FFF',
    opacity: 0.3,
  },
  messageContainer: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 30,
    marginTop: -20,        // Changed from -15 to -20
    paddingVertical: 5,   // Changed from padding: 15
    paddingHorizontal: 20, // Added separate horizontal padding
    borderRadius: 25,      // Changed from 10 to 25
    alignItems: 'center',
    justifyContent: 'flex-end',
    elevation: 2,          // Changed from 3 to 2
    shadowColor: '#000',   // Added shadow properties
    height: 55,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  messageText: {
    color: '#FFF',
    fontWeight: '500',
    fontSize: 12,
    marginTop: 'auto',  // This will push the text to the bottom
  },
  switchContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  switchButton: {
    borderWidth: 2,
    borderColor: '#D3463A',
    borderRadius: 28,
    flexDirection: 'row',
    overflow: 'hidden',
    width: 194,
    height: 57,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  switchActive: {
    flex: 1,
    borderRadius: 50,
    backgroundColor: '#D3463A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchInactive: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  toggleText: {
    color: '#D3463A',
    fontWeight: '600',
  },
  activeToggle: {
    backgroundColor: '#D3463A',
  },
  activeToggleText: {
    color: '#FFF',
  },
  actionContainer: {
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#D3463A',
    borderWidth: 1,
    borderColor: '#D3463A',
    borderRadius: 32,
    padding: 20,  // Reduced from 15
    width: '65%', // Reduced from 100%
    marginBottom:30,
    elevation: 2,
    shadowColor: '#000',
    maxWidth: 300, // Added max-width for better control
    alignSelf: 'center', // Center the button horizontally
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2.84,
},
  actionIcon: {
    marginRight: 10,
    fontSize: 18,
    
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '400',
  },
  actionButton1: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D3463A',
    borderRadius: 32,
    padding: 20,  // Reduced from 15
    width: '65%', // Reduced from 100%
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    maxWidth: 300, // Added max-width for better control
    alignSelf: 'center', // Center the button horizontally
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2.84,
},
actionText1: {
  color: '#D3463A',
  fontSize: 24,
  fontWeight: '400',
},
  orText: {
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 10,
  },
  sidebar: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sidebarHeader: {
    padding: 24,
  },
  sidebarlogo: {
    width: 121,
    height: 84,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  sidebarTitle: {
    color: '#D3463A',
    fontSize: 24,
    fontWeight: 'bold',
  },
  sidebarProfile: {
    paddingHorizontal: 24,

    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  sidebarProfileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  sidebarProfileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sidebarRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  sidebarRatingIcon: {
    color: '#FBBF24',
    fontSize: 16,
  },
  sidebarRatingText: {
    marginLeft: 4,
    fontSize: 16,
  },
  sidebarMenu: {
    flex: 1,
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sidebarMenuIconContainer: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarMenuIcon: {
    width: 24,
    height: 24,
    tintColor: '#4B5563',
  },
  sidebarMenuText: {
    fontSize: 16,
    color: '#1F2937',
  },
  sidebarFooter: {
    padding: 24,
  },
  sidebarLogoutButton: {
    backgroundColor: '#D3463A',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  sidebarLogoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutContainer: {
    marginTop: 'auto',
  },
});

export default Menu;