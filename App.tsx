import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LandingScreen } from './src/screens/LandingScreen';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      {showLanding && (
        <LandingScreen onFinish={() => setShowLanding(false)} />
      )}
    </SafeAreaProvider>
  );
}
