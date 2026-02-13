/**
 * Storage Service
 * Handles Firebase Storage operations for audio files and other media
 */

import { storage } from '../firebase';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadBytesResumable 
} from 'firebase/storage';

/**
 * Upload an audio file to Firebase Storage
 * @param {string} userId - User's ID
 * @param {Blob|File} audioBlob - Audio file or blob to upload
 * @param {Object} options - Upload options
 * @param {string} options.filename - Custom filename (optional)
 * @param {Function} options.onProgress - Progress callback (optional)
 * @returns {Promise<Object>} Object containing success status, file path, and download URL
 * @throws {Error} If upload fails
 */
export const uploadAudio = async (userId, audioBlob, options = {}) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!audioBlob) {
      throw new Error('Audio blob is required');
    }

    if (!(audioBlob instanceof Blob)) {
      throw new Error('Audio must be a Blob or File object');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (audioBlob.size > maxSize) {
      throw new Error('Audio file size exceeds 10MB limit');
    }

    const { filename = null, onProgress = null } = options;

    // Generate filename if not provided
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = audioBlob.type ? audioBlob.type.split('/')[1] || 'webm' : 'webm';
    const audioFilename = filename || `audio_${timestamp}_${randomString}.${extension}`;

    // Create storage reference
    const audioPath = `audio/${userId}/${audioFilename}`;
    const storageRef = ref(storage, audioPath);

    // Upload with progress tracking if callback provided
    let downloadURL;
    
    if (onProgress && typeof onProgress === 'function') {
      const uploadTask = uploadBytesResumable(storageRef, audioBlob);

      downloadURL = await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            reject(error);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });
    } else {
      // Simple upload without progress
      const snapshot = await uploadBytes(storageRef, audioBlob);
      downloadURL = await getDownloadURL(snapshot.ref);
    }

    return {
      success: true,
      path: audioPath,
      url: downloadURL,
      filename: audioFilename,
      size: audioBlob.size,
      type: audioBlob.type
    };
  } catch (error) {
    console.error('Error uploading audio:', error);
    
    if (error.code === 'storage/unauthorized') {
      throw new Error('You do not have permission to upload files');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled');
    } else if (error.code === 'storage/quota-exceeded') {
      throw new Error('Storage quota exceeded. Please contact support.');
    }
    
    throw new Error(error.message || 'Failed to upload audio file');
  }
};

/**
 * Get download URL for a file in storage
 * @param {string} path - Full storage path to the file
 * @returns {Promise<Object>} Object containing success status and download URL
 * @throws {Error} If fetching URL fails
 */
export const getAudioUrl = async (path) => {
  try {
    if (!path || typeof path !== 'string' || path.trim().length === 0) {
      throw new Error('Storage path is required');
    }

    const storageRef = ref(storage, path);
    const downloadURL = await getDownloadURL(storageRef);

    return {
      success: true,
      url: downloadURL,
      path
    };
  } catch (error) {
    console.error('Error getting audio URL:', error);
    
    if (error.code === 'storage/object-not-found') {
      throw new Error('Audio file not found');
    } else if (error.code === 'storage/unauthorized') {
      throw new Error('You do not have permission to access this file');
    }
    
    throw new Error(error.message || 'Failed to get audio URL');
  }
};

/**
 * Delete an audio file from storage
 * @param {string} path - Full storage path to the file
 * @returns {Promise<Object>} Object containing success status
 * @throws {Error} If deletion fails
 */
export const deleteAudio = async (path) => {
  try {
    if (!path || typeof path !== 'string' || path.trim().length === 0) {
      throw new Error('Storage path is required');
    }

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);

    return {
      success: true,
      message: 'Audio file deleted successfully',
      path
    };
  } catch (error) {
    console.error('Error deleting audio:', error);
    
    if (error.code === 'storage/object-not-found') {
      throw new Error('Audio file not found');
    } else if (error.code === 'storage/unauthorized') {
      throw new Error('You do not have permission to delete this file');
    }
    
    throw new Error(error.message || 'Failed to delete audio file');
  }
};

/**
 * Upload a generic file to Firebase Storage
 * @param {string} userId - User's ID
 * @param {Blob|File} file - File or blob to upload
 * @param {string} folder - Folder name in storage (e.g., 'images', 'documents')
 * @param {Object} options - Upload options
 * @param {string} options.filename - Custom filename (optional)
 * @param {Function} options.onProgress - Progress callback (optional)
 * @returns {Promise<Object>} Object containing success status, file path, and download URL
 * @throws {Error} If upload fails
 */
export const uploadFile = async (userId, file, folder = 'files', options = {}) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!file) {
      throw new Error('File is required');
    }

    if (!(file instanceof Blob)) {
      throw new Error('File must be a Blob or File object');
    }

    // Validate file size (max 25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size exceeds 25MB limit');
    }

    const { filename = null, onProgress = null } = options;

    // Generate filename if not provided
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const originalName = file.name || `file_${timestamp}`;
    const uploadFilename = filename || `${timestamp}_${randomString}_${originalName}`;

    // Create storage reference
    const filePath = `${folder}/${userId}/${uploadFilename}`;
    const storageRef = ref(storage, filePath);

    // Upload with progress tracking if callback provided
    let downloadURL;
    
    if (onProgress && typeof onProgress === 'function') {
      const uploadTask = uploadBytesResumable(storageRef, file);

      downloadURL = await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            reject(error);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });
    } else {
      const snapshot = await uploadBytes(storageRef, file);
      downloadURL = await getDownloadURL(snapshot.ref);
    }

    return {
      success: true,
      path: filePath,
      url: downloadURL,
      filename: uploadFilename,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    
    if (error.code === 'storage/unauthorized') {
      throw new Error('You do not have permission to upload files');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled');
    } else if (error.code === 'storage/quota-exceeded') {
      throw new Error('Storage quota exceeded. Please contact support.');
    }
    
    throw new Error(error.message || 'Failed to upload file');
  }
};

export default {
  uploadAudio,
  getAudioUrl,
  deleteAudio,
  uploadFile
};
