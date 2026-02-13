/**
 * Application Constants
 */

// Supported languages
export const LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
};

// Indian states
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// Soil types common in India
export const SOIL_TYPES = [
  'Alluvial Soil',
  'Black Cotton Soil',
  'Red Soil',
  'Laterite Soil',
  'Mountain Soil',
  'Desert Soil',
  'Clayey Soil',
  'Sandy Soil',
  'Loamy Soil',
  'Peaty Soil',
  'Saline Soil',
];

// Irrigation types
export const IRRIGATION_TYPES = [
  'Drip Irrigation',
  'Sprinkler Irrigation',
  'Surface Irrigation',
  'Flood Irrigation',
  'Rainfed',
  'Canal Irrigation',
  'Well Irrigation',
  'Tube Well',
  'Check Basin',
  'Border Irrigation',
];

// Common crops in India
export const CROPS = [
  'Rice', 'Wheat', 'Maize', 'Bajra', 'Jowar',
  'Cotton', 'Sugarcane', 'Groundnut', 'Soybean', 'Mustard',
  'Pulses', 'Potato', 'Onion', 'Tomato', 'Chili',
  'Tea', 'Coffee', 'Rubber', 'Coconut', 'Areca Nut',
  'Turmeric', 'Ginger', 'Cardamom', 'Black Pepper', 'Banana',
  'Mango', 'Grapes', 'Orange', 'Pomegranate', 'Apple',
];

// Seasons
export const SEASONS = [
  'Kharif (Monsoon)',
  'Rabi (Winter)',
  'Zaid (Summer)',
  'All Year',
];

// Area units
export const AREA_UNITS = [
  'acres',
  'hectares',
  'bigha',
  'square meters',
];

// Scheme categories
export const SCHEME_CATEGORIES = {
  income_support: 'Income Support',
  insurance: 'Insurance',
  credit: 'Credit & Loans',
  soil_health: 'Soil Health',
  irrigation: 'Irrigation',
  organic_farming: 'Organic Farming',
  market_linkage: 'Market Linkage',
  infrastructure: 'Infrastructure',
  advisory: 'Advisory Services',
  sustainability: 'Sustainability',
  mechanization: 'Mechanization',
  horticulture: 'Horticulture',
};

// Confidence levels
export const CONFIDENCE_LEVELS = {
  High: { label: 'High', color: 'green', description: 'Highly confident advice' },
  Medium: { label: 'Medium', color: 'yellow', description: 'General advice, may vary' },
  Low: { label: 'Low', color: 'red', description: 'Limited information available' },
};

// Audio recording settings
export const AUDIO_CONFIG = {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 128000,
  maxDuration: 120000, // 2 minutes in milliseconds
};

// Chat message types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  AUDIO: 'audio',
};

// Navigation routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  FARM_SETUP: '/farm-setup',
  CHAT: '/chat',
  CHAT_HISTORY: '/history',
  SCHEMES: '/schemes',
  PROFILE: '/profile',
};

// API endpoints (Cloud Functions)
export const FUNCTIONS = {
  TRANSCRIBE_AUDIO: 'transcribeAudio',
  ASK_GEMINI: 'askGemini',
  SYNTHESIZE_SPEECH: 'synthesizeSpeech',
};

// Storage paths
export const STORAGE_PATHS = {
  AUDIO: (userId) => `audio/${userId}`,
  PROFILES: (userId) => `profiles/${userId}`,
};

// Error messages
export const ERROR_MESSAGES = {
  AUTH_FAILED: 'Authentication failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  PERMISSION_DENIED: 'Permission denied. Please grant required permissions.',
  INVALID_INPUT: 'Invalid input. Please check your data.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully',
  FARM_ADDED: 'Farm added successfully',
  FARM_UPDATED: 'Farm updated successfully',
  MESSAGE_SENT: 'Message sent successfully',
};
