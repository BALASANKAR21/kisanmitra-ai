/**
 * Farm Service
 * Handles CRUD operations for farm profiles
 */

import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Get all farms for a user
 * @param {string} userId - User's ID
 * @returns {Promise<Object>} Object containing success status and array of farms
 * @throws {Error} If fetching fails
 */
export const getFarms = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const farmsRef = collection(db, 'users', userId, 'farms');
    const querySnapshot = await getDocs(farmsRef);

    const farms = [];
    querySnapshot.forEach((doc) => {
      farms.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      });
    });

    return {
      success: true,
      farms,
      count: farms.length
    };
  } catch (error) {
    console.error('Error getting farms:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to access farms');
    }
    
    throw new Error(error.message || 'Failed to retrieve farms');
  }
};

/**
 * Get a specific farm by ID
 * @param {string} userId - User's ID
 * @param {string} farmId - Farm document ID
 * @returns {Promise<Object>} Object containing success status and farm data
 * @throws {Error} If fetching fails or farm not found
 */
export const getFarmById = async (userId, farmId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!farmId) {
      throw new Error('Farm ID is required');
    }

    const farmRef = doc(db, 'users', userId, 'farms', farmId);
    const farmSnap = await getDoc(farmRef);

    if (!farmSnap.exists()) {
      throw new Error('Farm not found');
    }

    const farmData = farmSnap.data();

    // Verify the farm belongs to the user
    if (farmData.userId !== userId) {
      throw new Error('You do not have permission to access this farm');
    }

    return {
      success: true,
      farm: {
        id: farmSnap.id,
        ...farmData,
        createdAt: farmData.createdAt?.toDate(),
        updatedAt: farmData.updatedAt?.toDate()
      }
    };
  } catch (error) {
    console.error('Error getting farm by ID:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to access this farm');
    }
    
    throw new Error(error.message || 'Failed to retrieve farm');
  }
};

/**
 * Create a new farm
 * @param {string} userId - User's ID
 * @param {Object} farmData - Farm data object
 * @param {string} farmData.name - Farm name
 * @param {number} farmData.size - Farm size in acres/hectares
 * @param {string} farmData.location - Farm location
 * @param {string} farmData.state - State name
 * @param {Array<string>} farmData.crops - Array of crop names
 * @param {string} farmData.soilType - Type of soil
 * @returns {Promise<Object>} Object containing success status and new farm ID
 * @throws {Error} If creation fails
 */
export const createFarm = async (userId, farmData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!farmData || typeof farmData !== 'object') {
      throw new Error('Farm data is required');
    }

    // Validate required fields
    const requiredFields = ['name', 'size', 'location', 'state'];
    const missingFields = requiredFields.filter(field => !farmData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate data types
    if (typeof farmData.name !== 'string' || farmData.name.trim().length === 0) {
      throw new Error('Farm name must be a non-empty string');
    }

    if (typeof farmData.size !== 'number' || farmData.size <= 0) {
      throw new Error('Farm size must be a positive number');
    }

    const farmsRef = collection(db, 'users', userId, 'farms');
    const newFarm = {
      userId,
      name: farmData.name.trim(),
      size: farmData.size,
      location: farmData.location.trim(),
      state: farmData.state.trim(),
      crops: farmData.crops || [],
      soilType: farmData.soilType || '',
      irrigationType: farmData.irrigationType || '',
      additionalInfo: farmData.additionalInfo || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(farmsRef, newFarm);

    return {
      success: true,
      farmId: docRef.id,
      message: 'Farm created successfully'
    };
  } catch (error) {
    console.error('Error creating farm:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to create farms');
    }
    
    throw new Error(error.message || 'Failed to create farm');
  }
};

/**
 * Update an existing farm
 * @param {string} userId - User's ID
 * @param {string} farmId - Farm document ID
 * @param {Object} farmData - Updated farm data
 * @returns {Promise<Object>} Object containing success status
 * @throws {Error} If update fails
 */
export const updateFarm = async (userId, farmId, farmData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!farmId) {
      throw new Error('Farm ID is required');
    }

    if (!farmData || typeof farmData !== 'object') {
      throw new Error('Farm data is required');
    }

    // First, verify the farm exists and belongs to the user
    const farmRef = doc(db, 'users', userId, 'farms', farmId);
    const farmSnap = await getDoc(farmRef);

    if (!farmSnap.exists()) {
      throw new Error('Farm not found');
    }

    if (farmSnap.data().userId !== userId) {
      throw new Error('You do not have permission to update this farm');
    }

    // Prepare update data (exclude userId and createdAt)
    const updateData = {
      ...farmData,
      updatedAt: serverTimestamp()
    };

    // Remove fields that shouldn't be updated
    delete updateData.userId;
    delete updateData.createdAt;
    delete updateData.id;

    await updateDoc(farmRef, updateData);

    return {
      success: true,
      message: 'Farm updated successfully'
    };
  } catch (error) {
    console.error('Error updating farm:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to update this farm');
    } else if (error.code === 'not-found') {
      throw new Error('Farm not found');
    }
    
    throw new Error(error.message || 'Failed to update farm');
  }
};

/**
 * Delete a farm
 * @param {string} userId - User's ID
 * @param {string} farmId - Farm document ID
 * @returns {Promise<Object>} Object containing success status
 * @throws {Error} If deletion fails
 */
export const deleteFarm = async (userId, farmId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!farmId) {
      throw new Error('Farm ID is required');
    }

    // First, verify the farm exists and belongs to the user
    const farmRef = doc(db, 'users', userId, 'farms', farmId);
    const farmSnap = await getDoc(farmRef);

    if (!farmSnap.exists()) {
      throw new Error('Farm not found');
    }

    if (farmSnap.data().userId !== userId) {
      throw new Error('You do not have permission to delete this farm');
    }

    await deleteDoc(farmRef);

    return {
      success: true,
      message: 'Farm deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting farm:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to delete this farm');
    } else if (error.code === 'not-found') {
      throw new Error('Farm not found');
    }
    
    throw new Error(error.message || 'Failed to delete farm');
  }
};

export default {
  getFarms,
  getFarmById,
  createFarm,
  updateFarm,
  deleteFarm
};
