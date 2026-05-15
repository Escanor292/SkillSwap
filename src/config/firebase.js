import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage for persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
