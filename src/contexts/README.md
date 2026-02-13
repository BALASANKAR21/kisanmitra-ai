# React Context Documentation

This directory contains production-ready React context implementations for the KisanMitra AI application.

## Contexts

### 1. AuthContext.jsx
Firebase authentication context with phone OTP authentication.

#### Features
- ✅ Phone authentication with OTP (Firebase Phone Auth)
- ✅ User state management
- ✅ Firestore integration for user data
- ✅ Profile management (display name, photo URL)
- ✅ Automatic session persistence
- ✅ reCAPTCHA verification
- ✅ Comprehensive error handling
- ✅ TypeScript-style JSDoc comments

#### Usage

```jsx
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

// Wrap your app with AuthProvider
function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}

// Use in components
function LoginComponent() {
  const { login, verifyOTP, user, loading, error } = useAuth();
  
  // Send OTP
  const sendOTP = async () => {
    await login('+919876543210'); // Phone number with country code
  };
  
  // Verify OTP
  const verify = async () => {
    await verifyOTP('123456'); // 6-digit OTP
  };
  
  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

#### API Reference

**State:**
- `user` (Object|null) - Current authenticated user
- `loading` (boolean) - Loading state for auth operations
- `error` (string|null) - Error message from last operation

**Methods:**
- `login(phoneNumber)` - Send OTP to phone number (E.164 format)
- `verifyOTP(otp)` - Verify 6-digit OTP code
- `logout()` - Sign out current user
- `updateProfile(updates)` - Update user profile (displayName, photoURL, language)
- `clearError()` - Clear error state

**User Object:**
```javascript
{
  uid: string,
  phoneNumber: string,
  displayName: string,
  photoURL: string,
  language: string,
  createdAt: Date,
  lastLogin: Date
}
```

#### Important Notes

1. **reCAPTCHA Container**: The AuthProvider automatically creates a hidden `<div id="recaptcha-container">` for Firebase Phone Auth. Don't create this manually.

2. **Phone Number Format**: Must be in E.164 format (e.g., `+919876543210`)

3. **Firestore Structure**: User data is stored in `users/{uid}` collection

4. **Error Codes**:
   - `auth/invalid-phone-number` - Invalid phone format
   - `auth/too-many-requests` - Too many SMS requests
   - `auth/invalid-verification-code` - Wrong OTP
   - `auth/code-expired` - OTP expired

---

### 2. LanguageContext.jsx
Language preference management with i18next integration.

#### Features
- ✅ Multi-language support (English, Hindi, Tamil, Telugu)
- ✅ localStorage persistence
- ✅ Firestore sync for authenticated users
- ✅ i18next integration
- ✅ Automatic sync with user preferences
- ✅ Fallback to browser language
- ✅ Comprehensive error handling
- ✅ TypeScript-style JSDoc comments

#### Usage

```jsx
import { LanguageProvider, useLanguage } from './contexts/LanguageContext.jsx';
import { useTranslation } from 'react-i18next';

// Wrap your app with LanguageProvider (inside AuthProvider)
function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <YourApp />
      </LanguageProvider>
    </AuthProvider>
  );
}

// Use in components
function LanguageSelector() {
  const { language, changeLanguage, supportedLanguages } = useLanguage();
  const { t } = useTranslation();
  
  return (
    <select 
      value={language} 
      onChange={(e) => changeLanguage(e.target.value)}
    >
      {supportedLanguages.map(lang => (
        <option key={lang} value={lang}>
          {lang.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
```

#### API Reference

**State:**
- `language` (string) - Current language code ('en', 'hi', 'ta', 'te')
- `isChanging` (boolean) - Loading state during language change
- `error` (string|null) - Error message from last operation
- `supportedLanguages` (string[]) - Array of supported language codes

**Methods:**
- `changeLanguage(languageCode)` - Change application language
- `clearError()` - Clear error state

**Supported Languages:**
- `en` - English
- `hi` - Hindi (हिन्दी)
- `ta` - Tamil (தமிழ்)
- `te` - Telugu (తెలుగు)

#### Important Notes

1. **Persistence**: Language preference is saved to:
   - localStorage (always)
   - Firestore (only for authenticated users)

2. **Sync**: When a user logs in, their Firestore language preference overrides localStorage

3. **Fallback**: If no preference is found, defaults to English ('en')

4. **i18next Integration**: Automatically updates i18next when language changes

---

## Complete Setup Example

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';
import './i18n'; // Initialize i18next
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AuthProvider>
  </React.StrictMode>
);
```

## Combined Usage Example

```jsx
import { useAuth } from './contexts/AuthContext.jsx';
import { useLanguage } from './contexts/LanguageContext.jsx';
import { useTranslation } from 'react-i18next';

function Dashboard() {
  const { user, logout, updateProfile } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const { t } = useTranslation();

  const handleLanguageChange = async (newLang) => {
    await changeLanguage(newLang);
    // Also update user profile in Firestore
    await updateProfile({ language: newLang });
  };

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('currentUser')}: {user.displayName || user.phoneNumber}</p>
      <p>{t('language')}: {language}</p>
      <button onClick={() => handleLanguageChange('hi')}>
        {t('switchToHindi')}
      </button>
      <button onClick={logout}>{t('logout')}</button>
    </div>
  );
}
```

## Firestore Security Rules

Ensure your Firestore has these security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can read and write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Testing

To test the contexts locally:

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Error Handling

Both contexts provide comprehensive error handling:

```jsx
const { error, clearError } = useAuth();
// or
const { error, clearError } = useLanguage();

if (error) {
  return (
    <div className="error">
      {error}
      <button onClick={clearError}>Dismiss</button>
    </div>
  );
}
```

## Best Practices

1. **Always wrap AuthProvider outside LanguageProvider** (LanguageProvider depends on auth state)
2. **Clear errors before new operations** using `clearError()`
3. **Handle loading states** to prevent double submissions
4. **Use try-catch blocks** when calling context methods
5. **Validate phone numbers** before calling `login()`
6. **Show loading indicators** during OTP verification
7. **Test reCAPTCHA** in production environment

## Troubleshooting

### "reCAPTCHA container not found"
- Make sure AuthProvider is rendered and mounted
- Check if the container div is in the DOM

### "Permission denied" errors
- Check Firestore security rules
- Ensure user is authenticated

### "Invalid phone number"
- Use E.164 format: `+[country code][number]`
- Example: `+919876543210` for India

### Language not persisting
- Check localStorage permissions
- Verify user is authenticated for Firestore sync
- Check browser console for errors

## Dependencies

- React 18+
- Firebase 10+
- i18next 23+
- react-i18next 13+

## License

Part of KisanMitra AI project.
