/**
 * Cloud Function: transcribeAudio
 * Converts audio files to text using Google Cloud Speech-to-Text API
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const speech = require("@google-cloud/speech");
const { validateAuth } = require("./utils/auth");
const { validateRequiredFields, validateAudioPath, validateLanguage } = require("./utils/validators");

const speechClient = new speech.SpeechClient();

/**
 * Transcribes audio file from Firebase Storage
 * @param {Object} data - { audioPath: string, language: string }
 * @param {Object} context - Cloud Function context with auth info
 * @return {Promise<Object>} { transcript: string, confidence: number }
 */
exports.transcribeAudio = functions.https.onCall(async (data, context) => {
  try {
    // Validate authentication
    const uid = await validateAuth(context);

    // Validate input
    validateRequiredFields(data, ["audioPath", "language"]);
    const audioPath = validateAudioPath(data.audioPath);
    const language = validateLanguage(data.language);

    // Verify user owns this audio file
    if (!audioPath.includes(`audio/${uid}/`)) {
      throw new Error("Unauthorized: Cannot access audio file");
    }

    // Get audio file from Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(audioPath);

    const [exists] = await file.exists();
    if (!exists) {
      throw new Error("Audio file not found");
    }

    // Get signed URL for the audio file (valid for 5 minutes)
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 5 * 60 * 1000,
    });

    // Map language codes to Speech-to-Text language codes
    const languageCodeMap = {
      en: "en-IN",
      hi: "hi-IN",
      ta: "ta-IN",
      te: "te-IN",
    };

    const languageCode = languageCodeMap[language] || "en-IN";

    // Configure Speech-to-Text request
    const request = {
      audio: {
        uri: `gs://${bucket.name}/${audioPath}`,
      },
      config: {
        encoding: "WEBM_OPUS", // Common format for web audio recording
        sampleRateHertz: 48000,
        languageCode: languageCode,
        enableAutomaticPunctuation: true,
        model: "default",
        useEnhanced: true,
      },
    };

    // Perform transcription
    const [response] = await speechClient.recognize(request);

    if (!response.results || response.results.length === 0) {
      return {
        transcript: "",
        confidence: 0,
        message: "No speech detected in audio",
      };
    }

    // Get the best transcription result
    const transcription = response.results
        .map((result) => result.alternatives[0])
        .filter((alternative) => alternative && alternative.transcript)
        .map((alternative) => alternative.transcript)
        .join(" ");

    // Calculate average confidence
    const confidenceScores = response.results
        .map((result) => result.alternatives[0]?.confidence || 0)
        .filter((score) => score > 0);

    const avgConfidence = confidenceScores.length > 0 ?
      confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length :
      0;

    return {
      transcript: transcription.trim(),
      confidence: Math.round(avgConfidence * 100) / 100,
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new functions.https.HttpsError(
        "internal",
        `Failed to transcribe audio: ${error.message}`,
    );
  }
});
