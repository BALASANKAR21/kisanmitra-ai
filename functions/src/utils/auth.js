/**
 * Authentication middleware for Cloud Functions
 * Validates Firebase Auth tokens
 */

const admin = require("firebase-admin");

/**
 * Validates that the request has a valid Firebase Auth token
 * @param {Object} context - The Cloud Function context
 * @return {string} The authenticated user ID
 * @throws {Error} If authentication fails
 */
async function validateAuth(context) {
  if (!context.auth) {
    throw new Error("Unauthenticated: No auth token provided");
  }

  if (!context.auth.uid) {
    throw new Error("Unauthenticated: Invalid auth token");
  }

  return context.auth.uid;
}

/**
 * Validates authentication and returns user data
 * @param {Object} context - The Cloud Function context
 * @return {Object} User data with uid and phone number
 * @throws {Error} If authentication fails
 */
async function validateAuthWithUser(context) {
  const uid = await validateAuth(context);

  try {
    const userRecord = await admin.auth().getUser(uid);
    return {
      uid: uid,
      phoneNumber: userRecord.phoneNumber,
      displayName: userRecord.displayName,
    };
  } catch (error) {
    throw new Error(`Failed to fetch user data: ${error.message}`);
  }
}

module.exports = {
  validateAuth,
  validateAuthWithUser,
};
