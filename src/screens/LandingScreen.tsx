import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';

const LOGO = require('../assets/images/Logo.png');

interface LandingScreenProps {
  onFinish: () => void;
}

export function LandingScreen({ onFinish }: LandingScreenProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hold for 1.6s, then fade out over 0.4s
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 1600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity }]}>
      <Image source={LOGO} style={styles.logo} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  logo: {
    width: 280,
    height: 280,
  },
});
