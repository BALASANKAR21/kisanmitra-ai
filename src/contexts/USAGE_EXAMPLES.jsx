/**
 * Context Usage Example
 * 
 * This file demonstrates how to use the AuthContext and LanguageContext
 * in your React application.
 */

import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext.jsx';
import { useTranslation } from 'react-i18next';

/**
 * Example: App Setup with Providers
 * Wrap your application with both providers
 */
function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </AuthProvider>
  );
}

/**
 * Example: Using Authentication Context
 */
function LoginComponent() {
  const { login, verifyOTP, error, loading, clearError } = useAuth();
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [showOtpInput, setShowOtpInput] = React.useState(false);

  const handleSendOTP = async () => {
    try {
      clearError();
      await login(phoneNumber);
      setShowOtpInput(true);
    } catch (err) {
      console.error('Failed to send OTP:', err);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      clearError();
      await verifyOTP(otp);
      // User is now logged in
    } catch (err) {
      console.error('Failed to verify OTP:', err);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      
      {!showOtpInput ? (
        <div>
          <input
            type="tel"
            placeholder="+91XXXXXXXXXX"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <button onClick={handleSendOTP} disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
          />
          <button onClick={handleVerifyOTP} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Using User Profile
 */
function UserProfile() {
  const { user, updateProfile, logout } = useAuth();
  const [displayName, setDisplayName] = React.useState(user?.displayName || '');

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({ displayName });
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  if (!user) return <div>Not logged in</div>;

  return (
    <div>
      <h2>Profile</h2>
      <p>Phone: {user.phoneNumber}</p>
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Display Name"
      />
      <button onClick={handleUpdateProfile}>Update Profile</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

/**
 * Example: Using Language Context
 */
function LanguageSelector() {
  const { language, changeLanguage, supportedLanguages, isChanging } = useLanguage();
  const { t } = useTranslation();

  const handleLanguageChange = async (newLang) => {
    try {
      await changeLanguage(newLang);
    } catch (err) {
      console.error('Failed to change language:', err);
    }
  };

  return (
    <div>
      <h3>{t('selectLanguage')}</h3>
      <select
        value={language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        disabled={isChanging}
      >
        {supportedLanguages.map((lang) => (
          <option key={lang} value={lang}>
            {lang.toUpperCase()}
          </option>
        ))}
      </select>
      {isChanging && <span>Changing...</span>}
    </div>
  );
}

/**
 * Example: Protected Route
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <LoginComponent />;
  }

  return children;
}

/**
 * Example: Main App Component
 */
function MainApp() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();

  return (
    <div>
      <header>
        <h1>{t('appTitle')}</h1>
        <LanguageSelector />
        {user && <UserProfile />}
      </header>
      
      <main>
        <ProtectedRoute>
          <div>
            <h2>{t('welcome')}, {user?.displayName || user?.phoneNumber}!</h2>
            <p>{t('currentLanguage')}: {language}</p>
          </div>
        </ProtectedRoute>
      </main>
    </div>
  );
}

export default App;
