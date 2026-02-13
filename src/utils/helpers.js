/**
 * Utility Helper Functions
 */

/**
 * Format timestamp to readable date string
 * @param {Object|number} timestamp - Firebase timestamp or number
 * @param {string} locale - Locale for formatting (default: 'en-IN')
 * @return {string} Formatted date string
 */
export function formatDate(timestamp, locale = 'en-IN') {
  if (!timestamp) return '';
  
  let date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 * @param {Object|number} timestamp - Firebase timestamp or number
 * @return {string} Relative time string
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  
  let date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date);
  }
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @return {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Generate unique ID
 * @return {string} Unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if user is online
 * @return {boolean} True if online
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @return {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format phone number for display
 * @param {string} phoneNumber - Phone number
 * @return {string} Formatted phone number
 */
export function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format as +91-XXXXX-XXXXX for Indian numbers
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91-${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `+91-${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  
  return phoneNumber;
}

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @return {boolean} True if valid
 */
export function isValidPhoneNumber(phoneNumber) {
  if (!phoneNumber) return false;
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid Indian phone number (10 digits)
  return cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91'));
}

/**
 * Get file extension from filename
 * @param {string} filename - Filename
 * @return {string} File extension
 */
export function getFileExtension(filename) {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @return {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @return {Promise<boolean>} True if successful
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Parse error message from various error types
 * @param {Error|string|Object} error - Error object
 * @return {string} User-friendly error message
 */
export function parseError(error) {
  if (typeof error === 'string') return error;
  
  if (error?.message) {
    // Firebase errors
    if (error.code) {
      switch (error.code) {
        case 'auth/invalid-phone-number':
          return 'Invalid phone number format';
        case 'auth/invalid-verification-code':
          return 'Invalid verification code';
        case 'auth/quota-exceeded':
          return 'Too many attempts. Please try again later';
        case 'permission-denied':
          return 'Permission denied';
        case 'unavailable':
          return 'Service temporarily unavailable';
        case 'unauthenticated':
          return 'Please log in to continue';
        default:
          return error.message;
      }
    }
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Check if device supports audio recording
 * @return {boolean} True if supported
 */
export function supportsAudioRecording() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Convert area between units
 * @param {number} value - Area value
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @return {number} Converted value
 */
export function convertArea(value, fromUnit, toUnit) {
  // Conversion factors to square meters
  const toSquareMeters = {
    'acres': 4046.86,
    'hectares': 10000,
    'bigha': 2529.29, // 1 bigha (average) ≈ 2529.29 sq meters
    'square meters': 1,
  };

  const squareMeters = value * toSquareMeters[fromUnit];
  return squareMeters / toSquareMeters[toUnit];
}

/**
 * Get language name from code
 * @param {string} code - Language code
 * @param {boolean} native - Return native name
 * @return {string} Language name
 */
export function getLanguageName(code, native = false) {
  const languages = {
    en: { name: 'English', native: 'English' },
    hi: { name: 'Hindi', native: 'हिंदी' },
    ta: { name: 'Tamil', native: 'தமிழ்' },
    te: { name: 'Telugu', native: 'తెలుగు' },
  };
  
  return native ? languages[code]?.native : languages[code]?.name || code;
}
