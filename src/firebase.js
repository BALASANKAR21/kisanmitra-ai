/**
 * Firebase Configuration and Initialization
 * Initializes Firebase services with offline persistence enabled
 */

import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// TODO: Replace with your Firebase config from Firebase Console
// Get these values from: Project Settings > General > Your apps > SDK setup and configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_FIREBASE_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

// Initialize Firestore with offline persistence
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
enableIndexedDbPersistence(db)
  .then(() => {
    console.log('Firestore offline persistence enabled');
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not available in this browser');
    } else {
      console.error('Firestore persistence error:', err);
    }
  });

// Initialize Storage
export const storage = getStorage(app);

// Initialize Cloud Functions
export const functions = getFunctions(app);

// For development with emulators, uncomment:
// import { connectAuthEmulator } from 'firebase/auth';
// import { connectFirestoreEmulator } from 'firebase/firestore';
// import { connectStorageEmulator } from 'firebase/storage';
// import { connectFunctionsEmulator } from 'firebase/functions';
//
// if (import.meta.env.DEV) {
//   connectAuthEmulator(auth, 'http://localhost:9099');
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectStorageEmulator(storage, 'localhost', 9199);
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

export default app;
