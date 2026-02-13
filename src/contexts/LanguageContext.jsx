/**
 * Language Context
 * 
 * Manages application language preferences with persistence to localStorage and Firestore.
 * Integrates with i18next for translations and syncs with user preferences in the database.
 * 
 * @module LanguageContext
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.js';

/**
 * Supported languages in the application
 * @constant {string[]}
 */
const SUPPORTED_LANGUAGES = ['en', 'hi', 'ta', 'te'];

/**
 * Default language fallback
 * @constant {string}
 */
const DEFAULT_LANGUAGE = 'en';

/**
 * LocalStorage key for language preference
 * @constant {string}
 */
const LANGUAGE_STORAGE_KEY = 'preferredLanguage';

/**
 * @typedef {Object} LanguageContextValue
 * @property {string} language - Current language code
 * @property {Function} changeLanguage - Function to change language
 * @property {string[]} supportedLanguages - List of supported language codes
 * @property {boolean} isChanging - Loading state during language change
 * @property {string|null} error - Error message from language operations
 * @property {Function} clearError - Clears error state
 */

const LanguageContext = createContext(/** @type {LanguageContextValue} */ ({}));

/**
 * Custom hook to access language context
 * @returns {LanguageContextValue} Language context value
 * @throws {Error} If used outside LanguageProvider
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

/**
 * Gets initial language from localStorage or defaults to English
 * @returns {string} Language code
 */
const getInitialLanguage = () => {
  try {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
      return savedLanguage;
    }
  } catch (err) {
    console.warn('Failed to read language from localStorage:', err);
  }
  return DEFAULT_LANGUAGE;
};

/**
 * Language Provider Component
 * Wraps application to provide language preference state and methods
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component
 */
export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(getInitialLanguage());
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Clears error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Saves language preference to localStorage
   * @param {string} lang - Language code to save
   * @returns {boolean} Success status
   */
  const saveToLocalStorage = useCallback((lang) => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      return true;
    } catch (err) {
      console.error('Failed to save language to localStorage:', err);
      return false;
    }
  }, []);

  /**
   * Saves language preference to Firestore user document
   * @param {string} lang - Language code to save
   * @returns {Promise<boolean>} Success status
   */
  const saveToFirestore = useCallback(async (lang) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        // User not authenticated, skip Firestore update
        return false;
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        language: lang,
        updatedAt: new Date()
      });
      
      return true;
    } catch (err) {
      // Don't throw error if Firestore update fails - localStorage is primary
      if (err.code === 'permission-denied') {
        console.warn('Permission denied when updating language in Firestore');
      } else if (err.code === 'not-found') {
        console.warn('User document not found in Firestore');
      } else {
        console.error('Failed to save language to Firestore:', err);
      }
      return false;
    }
  }, []);

  /**
   * Changes the application language
   * Updates i18next, localStorage, and Firestore (if user is authenticated)
   * 
   * @param {string} newLanguage - Language code to switch to
   * @returns {Promise<void>}
   * @throws {Error} If language is not supported or change fails
   */
  const changeLanguage = useCallback(async (newLanguage) => {
    try {
      setIsChanging(true);
      setError(null);

      // Validate language code
      if (!newLanguage || typeof newLanguage !== 'string') {
        throw new Error('Invalid language code provided.');
      }

      const lang = newLanguage.toLowerCase();

      if (!SUPPORTED_LANGUAGES.includes(lang)) {
        throw new Error(`Language "${lang}" is not supported. Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`);
      }

      // Don't do anything if already on this language
      if (lang === language) {
        return;
      }

      // Change i18next language
      await i18n.changeLanguage(lang);

      // Save to localStorage (critical - blocks on failure)
      const localStorageSaved = saveToLocalStorage(lang);
      if (!localStorageSaved) {
        throw new Error('Failed to save language preference. Please check your browser settings.');
      }

      // Save to Firestore (non-blocking - continues even if it fails)
      saveToFirestore(lang).catch(err => {
        console.warn('Failed to sync language preference to cloud:', err);
      });

      // Update state
      setLanguage(lang);

    } catch (err) {
      console.error('Language change error:', err);
      const errorMessage = err.message || 'Failed to change language. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsChanging(false);
    }
  }, [language, i18n, saveToLocalStorage, saveToFirestore]);

  /**
   * Synchronizes language with i18next on mount
   */
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language).catch(err => {
        console.error('Failed to initialize language:', err);
      });
    }
  }, [i18n, language]);

  /**
   * Monitors auth state to sync language preference from Firestore
   */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Check if user has a language preference in Firestore
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            const userLanguage = userData.language;

            // If user has a different language preference in Firestore, use it
            if (userLanguage && 
                SUPPORTED_LANGUAGES.includes(userLanguage) && 
                userLanguage !== language) {
              await changeLanguage(userLanguage);
            }
          }
        } catch (err) {
          console.warn('Failed to load language preference from Firestore:', err);
          // Continue with current language if Firestore read fails
        }
      }
    });

    return () => unsubscribe();
  }, [language, changeLanguage]);

  const value = {
    language,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isChanging,
    error,
    clearError
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
