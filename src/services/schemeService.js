/**
 * Scheme Service
 * Handles government schemes retrieval and search operations
 */

import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore';

/**
 * Get all schemes with optional filters
 * @param {Object} filters - Filter options
 * @param {string} filters.category - Filter by category (e.g., 'subsidy', 'insurance', 'loan')
 * @param {string} filters.state - Filter by state name
 * @param {boolean} filters.active - Filter by active status (default: true)
 * @param {number} filters.limit - Maximum number of schemes to retrieve (default: 50)
 * @returns {Promise<Object>} Object containing success status and array of schemes
 * @throws {Error} If fetching fails
 */
export const getSchemes = async (filters = {}) => {
  try {
    const {
      category = null,
      state = null,
      active = true,
      limit = 50
    } = filters;

    if (typeof limit !== 'number' || limit < 1 || limit > 100) {
      throw new Error('Limit must be a number between 1 and 100');
    }

    const schemesRef = collection(db, 'schemes');
    let q = query(schemesRef);

    // Apply filters
    const constraints = [];

    if (active !== null && active !== undefined) {
      constraints.push(where('active', '==', active));
    }

    if (category) {
      constraints.push(where('category', '==', category));
    }

    if (state) {
      // Check if scheme applies to all states or specific state
      constraints.push(where('state', 'in', [state, 'all']));
    }

    // Add ordering and limit
    constraints.push(firestoreLimit(limit));

    if (constraints.length > 0) {
      q = query(schemesRef, ...constraints);
    }

    const querySnapshot = await getDocs(q);

    const schemes = [];
    querySnapshot.forEach((doc) => {
      schemes.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      });
    });

    return {
      success: true,
      schemes,
      count: schemes.length,
      filters: {
        category,
        state,
        active
      }
    };
  } catch (error) {
    console.error('Error getting schemes:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to access schemes');
    } else if (error.code === 'failed-precondition') {
      throw new Error('Database index required for this query. Please contact support.');
    }
    
    throw new Error(error.message || 'Failed to retrieve schemes');
  }
};

/**
 * Get a specific scheme by ID
 * @param {string} schemeId - Scheme document ID
 * @returns {Promise<Object>} Object containing success status and scheme data
 * @throws {Error} If fetching fails or scheme not found
 */
export const getSchemeById = async (schemeId) => {
  try {
    if (!schemeId) {
      throw new Error('Scheme ID is required');
    }

    const schemeRef = doc(db, 'schemes', schemeId);
    const schemeSnap = await getDoc(schemeRef);

    if (!schemeSnap.exists()) {
      throw new Error('Scheme not found');
    }

    const schemeData = schemeSnap.data();

    return {
      success: true,
      scheme: {
        id: schemeSnap.id,
        ...schemeData,
        createdAt: schemeData.createdAt?.toDate(),
        updatedAt: schemeData.updatedAt?.toDate()
      }
    };
  } catch (error) {
    console.error('Error getting scheme by ID:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to access this scheme');
    }
    
    throw new Error(error.message || 'Failed to retrieve scheme');
  }
};

/**
 * Search schemes by name or description
 * @param {string} query - Search query string
 * @param {Object} options - Search options
 * @param {number} options.limit - Maximum number of results (default: 20)
 * @param {string} options.state - Optional state filter
 * @param {boolean} options.activeOnly - Only return active schemes (default: true)
 * @returns {Promise<Object>} Object containing success status and matching schemes
 * @throws {Error} If search fails
 */
export const searchSchemes = async (searchQuery, options = {}) => {
  try {
    if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim().length === 0) {
      throw new Error('Search query is required and must be a non-empty string');
    }

    const {
      limit = 20,
      state = null,
      activeOnly = true
    } = options;

    if (typeof limit !== 'number' || limit < 1 || limit > 50) {
      throw new Error('Limit must be a number between 1 and 50');
    }

    const schemesRef = collection(db, 'schemes');
    let q = query(schemesRef);

    // Apply filters
    const constraints = [];

    if (activeOnly) {
      constraints.push(where('active', '==', true));
    }

    if (state) {
      // Check if scheme applies to all states or specific state
      constraints.push(where('state', 'in', [state, 'all']));
    }

    constraints.push(firestoreLimit(limit * 2)); // Fetch more for client-side filtering

    if (constraints.length > 0) {
      q = query(schemesRef, ...constraints);
    }

    const querySnapshot = await getDocs(q);

    // Client-side text search
    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
    const schemes = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const searchableText = `${data.name || ''} ${data.description || ''} ${data.benefits || ''} ${data.eligibility || ''}`.toLowerCase();

      // Check if all search terms are present
      const matches = searchTerms.every(term => searchableText.includes(term));

      if (matches) {
        schemes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      }
    });

    // Limit results after filtering
    const limitedSchemes = schemes.slice(0, limit);

    return {
      success: true,
      schemes: limitedSchemes,
      count: limitedSchemes.length,
      query: searchQuery,
      totalMatches: schemes.length
    };
  } catch (error) {
    console.error('Error searching schemes:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to search schemes');
    } else if (error.code === 'failed-precondition') {
      throw new Error('Database index required for this search. Please contact support.');
    }
    
    throw new Error(error.message || 'Failed to search schemes');
  }
};

export default {
  getSchemes,
  getSchemeById,
  searchSchemes
};
