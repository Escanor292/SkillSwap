import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCy2eoA2CwcnTyuf-OypCDct33GzevuFw4",
  authDomain: "applab7-d4d61.firebaseapp.com",
  projectId: "applab7-d4d61",
  storageBucket: "applab7-d4d61.firebasestorage.app",
  messagingSenderId: "274019733052",
  appId: "1:274019733052:web:6f29297ee6a95ec4a7bd39",
  measurementId: "G-YXWF51NH79"
};

// Initialize Firebase (check if already initialized)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth safely
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (e) {
  auth = getAuth(app);
}

// Initialize Firestore with Force Long Polling and standard SSL settings
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false, // Disable streams to improve compatibility
});

export { auth, db };
