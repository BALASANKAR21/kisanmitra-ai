/**
 * CORS configuration for Cloud Functions
 */

const cors = require("cors");

/**
 * CORS middleware with configured options
 * Allows requests from Firebase hosting and local development
 */
const corsMiddleware = cors({
  origin: [
    /^https:\/\/.*\.web\.app$/,
    /^https:\/\/.*\.firebaseapp\.com$/,
    "http://localhost:3000",
    "http://localhost:5173",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
});

module.exports = corsMiddleware;
