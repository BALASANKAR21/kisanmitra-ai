/**
 * Cloud Functions entry point
 * Exports all Firebase Cloud Functions for KisanMitra AI
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export all Cloud Functions
const { transcribeAudio } = require("./transcribeAudio");
const { askGemini } = require("./askGemini");
const { synthesizeSpeech } = require("./synthesizeSpeech");

exports.transcribeAudio = transcribeAudio;
exports.askGemini = askGemini;
exports.synthesizeSpeech = synthesizeSpeech;

// Optional: Export seed function for administrative use
// Uncomment if you want to trigger seeding via Cloud Function
// const { seedSchemes } = require("./seedSchemes");
// const functions = require("firebase-functions");
// exports.seedSchemes = functions.https.onCall(async (data, context) => {
//   // Add admin authentication check here
//   return await seedSchemes();
// });
