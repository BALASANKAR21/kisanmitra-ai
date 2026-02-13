/**
 * Input validation helpers for Cloud Functions
 */

/**
 * Validates that required fields are present in the data object
 * @param {Object} data - The data object to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @throws {Error} If any required field is missing
 */
function validateRequiredFields(data, requiredFields) {
  const missingFields = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }
}

/**
 * Validates that a language code is supported
 * @param {string} language - The language code to validate
 * @return {string} The validated language code
 * @throws {Error} If language is not supported
 */
function validateLanguage(language) {
  const supportedLanguages = ["en", "hi", "ta", "te"];

  if (!language || !supportedLanguages.includes(language)) {
    throw new Error(`Unsupported language: ${language}. Supported: ${supportedLanguages.join(", ")}`);
  }

  return language;
}

/**
 * Validates audio file path format
 * @param {string} audioPath - The audio file path to validate
 * @return {string} The validated audio path
 * @throws {Error} If audio path is invalid
 */
function validateAudioPath(audioPath) {
  if (!audioPath || typeof audioPath !== "string") {
    throw new Error("Invalid audio path");
  }

  // Check if it's a valid storage path (audio/{userId}/...)
  if (!audioPath.startsWith("audio/")) {
    throw new Error("Invalid audio path format. Must start with 'audio/'");
  }

  return audioPath;
}

/**
 * Validates text input length
 * @param {string} text - The text to validate
 * @param {number} maxLength - Maximum allowed length
 * @return {string} The validated text
 * @throws {Error} If text is invalid or too long
 */
function validateTextLength(text, maxLength = 5000) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text input");
  }

  if (text.length > maxLength) {
    throw new Error(`Text too long. Maximum length: ${maxLength} characters`);
  }

  return text.trim();
}

/**
 * Sanitizes user input to prevent injection attacks
 * @param {string} input - The input to sanitize
 * @return {string} The sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== "string") {
    return input;
  }

  // Remove potentially dangerous characters
  return input
      .replace(/[<>]/g, "") // Remove HTML tags
      .trim();
}

module.exports = {
  validateRequiredFields,
  validateLanguage,
  validateAudioPath,
  validateTextLength,
  sanitizeInput,
};
