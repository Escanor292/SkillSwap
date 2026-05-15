import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { AuthContext } from '../context/AuthContext';

export default function RootNavigator() {
  const { isAuthenticated } = useContext(AuthContext);

  // Since we don't have real Firebase config yet, we'll default to the Auth stack.
  // In a real app, we'd use onAuthStateChanged from Firebase Auth.

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
