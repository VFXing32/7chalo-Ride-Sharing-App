import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, StatusBar } from 'react-native';

export default function AppSplash() {
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#D3463A" barStyle="light-content" />
      <Animated.View style={[styles.content, { opacity: fadeAnimation }]}>
        <Image 
          source={require('../../assets/images/7chalo.png')}
          style={styles.logo} 
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D3463A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    borderRadius: 20,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});