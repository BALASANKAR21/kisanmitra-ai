/**
 * Authentication Context
 * 
 * Provides Firebase authentication state and methods across the application.
 * Handles phone authentication with OTP, user profile management, and Firestore integration.
 * 
 * @module AuthContext
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase.js';

/**
 * @typedef {Object} User
 * @property {string} uid - User unique identifier
 * @property {string} phoneNumber - User phone number
 * @property {string} displayName - User display name
 * @property {string} photoURL - User photo URL
 * @property {string} [language] - User preferred language
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} lastLogin - Last login timestamp
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {User|null} user - Current authenticated user
 * @property {boolean} loading - Loading state for auth operations
 * @property {string|null} error - Error message from auth operations
 * @property {Function} login - Initiates phone authentication
 * @property {Function} verifyOTP - Verifies OTP code
 * @property {Function} logout - Signs out the current user
 * @property {Function} updateProfile - Updates user profile
 * @property {Function} clearError - Clears error state
 */

const AuthContext = createContext(/** @type {AuthContextValue} */ ({}));

/**
 * Custom hook to access auth context
 * @returns {AuthContextValue} Authentication context value
 * @throws {Error} If used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 * Wraps application to provide authentication state and methods
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);

  /**
   * Clears error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Fetches or creates user document in Firestore
   * @param {Object} firebaseUser - Firebase user object
   * @returns {Promise<User>} User document data
   */
  const syncUserWithFirestore = useCallback(async (firebaseUser) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      const userData = {
        uid: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber,
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        lastLogin: serverTimestamp()
      };

      if (!userSnap.exists()) {
        // Create new user document
        await setDoc(userRef, {
          ...userData,
          createdAt: serverTimestamp(),
          language: 'en'
        });
        return { ...userData, language: 'en' };
      } else {
        // Update last login
        await updateDoc(userRef, { lastLogin: serverTimestamp() });
        return { ...userData, ...userSnap.data() };
      }
    } catch (err) {
      console.error('Error syncing user with Firestore:', err);
      // Return basic user data even if Firestore fails
      return {
        uid: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber,
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || ''
      };
    }
  }, []);

  /**
   * Sets up reCAPTCHA verifier for phone authentication
   * @returns {RecaptchaVerifier} Configured reCAPTCHA verifier
   */
  const setupRecaptcha = useCallback(() => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        setError('reCAPTCHA expired. Please try again.');
      }
    });

    return window.recaptchaVerifier;
  }, []);

  /**
   * Initiates phone authentication with OTP
   * @param {string} phoneNumber - Phone number in E.164 format (e.g., +919876543210)
   * @returns {Promise<void>}
   * @throws {Error} If phone number is invalid or authentication fails
   */
  const login = useCallback(async (phoneNumber) => {
    try {
      setLoading(true);
      setError(null);

      // Validate phone number format
      if (!phoneNumber || !phoneNumber.startsWith('+')) {
        throw new Error('Please provide a valid phone number with country code (e.g., +91...)');
      }

      const appVerifier = setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      
      return confirmation;
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (err.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please check and try again.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (err.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setupRecaptcha]);

  /**
   * Verifies OTP code and completes authentication
   * @param {string} otp - 6-digit OTP code
   * @returns {Promise<User>} Authenticated user data
   * @throws {Error} If OTP is invalid or verification fails
   */
  const verifyOTP = useCallback(async (otp) => {
    try {
      setLoading(true);
      setError(null);

      if (!confirmationResult) {
        throw new Error('No confirmation result found. Please request OTP first.');
      }

      if (!otp || otp.length !== 6) {
        throw new Error('Please enter a valid 6-digit OTP code.');
      }

      const result = await confirmationResult.confirm(otp);
      const userData = await syncUserWithFirestore(result.user);
      setUser(userData);
      
      return userData;
    } catch (err) {
      console.error('OTP verification error:', err);
      let errorMessage = 'Failed to verify OTP. Please try again.';
      
      if (err.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP code. Please check and try again.';
      } else if (err.code === 'auth/code-expired') {
        errorMessage = 'OTP code has expired. Please request a new one.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [confirmationResult, syncUserWithFirestore]);

  /**
   * Signs out the current user
   * @returns {Promise<void>}
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await signOut(auth);
      setUser(null);
      setConfirmationResult(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Updates user profile in Firebase Auth and Firestore
   * @param {Object} updates - Profile updates
   * @param {string} [updates.displayName] - New display name
   * @param {string} [updates.photoURL] - New photo URL
   * @param {string} [updates.language] - Preferred language
   * @returns {Promise<User>} Updated user data
   */
  const updateProfile = useCallback(async (updates) => {
    try {
      setLoading(true);
      setError(null);

      if (!auth.currentUser) {
        throw new Error('No authenticated user found.');
      }

      // Update Firebase Auth profile
      const authUpdates = {};
      if (updates.displayName !== undefined) authUpdates.displayName = updates.displayName;
      if (updates.photoURL !== undefined) authUpdates.photoURL = updates.photoURL;

      if (Object.keys(authUpdates).length > 0) {
        await updateFirebaseProfile(auth.currentUser, authUpdates);
      }

      // Update Firestore user document
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Update local state
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);

      return updatedUser;
    } catch (err) {
      console.error('Profile update error:', err);
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (err.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your account permissions.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Monitors authentication state changes
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await syncUserWithFirestore(firebaseUser);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError('Failed to load user data.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [syncUserWithFirestore]);

  const value = {
    user,
    loading,
    error,
    login,
    verifyOTP,
    logout,
    updateProfile,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Hidden container for reCAPTCHA */}
      <div id="recaptcha-container" />
    </AuthContext.Provider>
  );
};

export default AuthContext;
