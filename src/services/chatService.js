/**
 * Chat Service
 * Handles chat/AI interactions with Gemini Cloud Function and chat history management
 */

import { db, functions } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit, 
  getDocs, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// Initialize callable function once at module level
const askGeminiFunction = httpsCallable(functions, 'askGemini');

/**
 * Ask a question to the Gemini AI assistant
 * @param {string} question - The question to ask
 * @param {Object} farmProfile - User's farm profile data
 * @param {string} language - Language code (e.g., 'en', 'hi', 'mr')
 * @returns {Promise<Object>} Response from AI with answer and metadata
 * @throws {Error} If the API call fails
 */
export const askQuestion = async (question, farmProfile = null, language = 'en') => {
  try {
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      throw new Error('Question is required and must be a non-empty string');
    }

    const response = await askGeminiFunction({
      question: question.trim(),
      farmProfile,
      language
    });

    if (!response.data) {
      throw new Error('No data received from AI service');
    }

    return {
      success: true,
      answer: response.data.answer,
      chatId: response.data.chatId,
      timestamp: response.data.timestamp,
      language: response.data.language
    };
  } catch (error) {
    console.error('Error asking question:', error);
    
    // Handle specific Firebase Function errors
    if (error.code === 'functions/unauthenticated') {
      throw new Error('You must be logged in to ask questions');
    } else if (error.code === 'functions/permission-denied') {
      throw new Error('You do not have permission to access this service');
    } else if (error.code === 'functions/unavailable') {
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    } else if (error.code === 'functions/deadline-exceeded') {
      throw new Error('Request timed out. Please try again.');
    }
    
    throw new Error(error.message || 'Failed to get answer from AI assistant');
  }
};

/**
 * Get chat history for a user
 * @param {string} userId - User's ID
 * @param {number} limit - Maximum number of chats to retrieve (default: 50)
 * @returns {Promise<Array>} Array of chat objects
 * @throws {Error} If fetching fails
 */
export const getChatHistory = async (userId, limit = 50) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (typeof limit !== 'number' || limit < 1 || limit > 100) {
      throw new Error('Limit must be a number between 1 and 100');
    }

    const chatsRef = collection(db, 'users', userId, 'chats');
    const q = query(
      chatsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limit)
    );

    const querySnapshot = await getDocs(q);
    
    const chats = [];
    querySnapshot.forEach((doc) => {
      chats.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      });
    });

    return {
      success: true,
      chats,
      count: chats.length
    };
  } catch (error) {
    console.error('Error getting chat history:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to access chat history');
    } else if (error.code === 'failed-precondition') {
      throw new Error('Database index required. Please contact support.');
    }
    
    throw new Error(error.message || 'Failed to retrieve chat history');
  }
};

/**
 * Get a specific chat by ID
 * @param {string} userId - User's ID
 * @param {string} chatId - Chat document ID
 * @returns {Promise<Object>} Chat object
 * @throws {Error} If fetching fails or chat not found
 */
export const getChatById = async (userId, chatId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!chatId) {
      throw new Error('Chat ID is required');
    }

    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      throw new Error('Chat not found');
    }

    const chatData = chatSnap.data();

    // Verify the chat belongs to the user
    if (chatData.userId !== userId) {
      throw new Error('You do not have permission to access this chat');
    }

    return {
      success: true,
      chat: {
        id: chatSnap.id,
        ...chatData,
        timestamp: chatData.timestamp?.toDate()
      }
    };
  } catch (error) {
    console.error('Error getting chat by ID:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to access this chat');
    }
    
    throw new Error(error.message || 'Failed to retrieve chat');
  }
};

export default {
  askQuestion,
  getChatHistory,
  getChatById
};
