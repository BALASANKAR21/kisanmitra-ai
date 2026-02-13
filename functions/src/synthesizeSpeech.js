/**
 * Cloud Function: synthesizeSpeech
 * Converts text to speech using Google Cloud Text-to-Speech API
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const textToSpeech = require("@google-cloud/text-to-speech");
const { validateAuth } = require("./utils/auth");
const { validateRequiredFields, validateLanguage, validateTextLength } = require("./utils/validators");

const ttsClient = new textToSpeech.TextToSpeechClient();

/**
 * Synthesizes speech from text and stores in Firebase Storage
 * @param {Object} data - { text: string, language: string }
 * @param {Object} context - Cloud Function context with auth info
 * @return {Promise<Object>} { audioUrl: string }
 */
exports.synthesizeSpeech = functions.https.onCall(async (data, context) => {
  try {
    // Validate authentication
    const uid = await validateAuth(context);

    // Validate input
    validateRequiredFields(data, ["text", "language"]);
    const text = validateTextLength(data.text, 5000);
    const language = validateLanguage(data.language);

    // Map language codes to Text-to-Speech language and voice codes
    const voiceConfig = {
      en: { languageCode: "en-IN", voiceName: "en-IN-Wavenet-D", ssmlGender: "FEMALE" },
      hi: { languageCode: "hi-IN", voiceName: "hi-IN-Wavenet-D", ssmlGender: "FEMALE" },
      ta: { languageCode: "ta-IN", voiceName: "ta-IN-Wavenet-A", ssmlGender: "FEMALE" },
      te: { languageCode: "te-IN", voiceName: "te-IN-Standard-A", ssmlGender: "FEMALE" },
    };

    const voice = voiceConfig[language] || voiceConfig.en;

    // Configure Text-to-Speech request
    const request = {
      input: { text: text },
      voice: {
        languageCode: voice.languageCode,
        name: voice.voiceName,
        ssmlGender: voice.ssmlGender,
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.95, // Slightly slower for clarity
        pitch: 0,
        volumeGainDb: 0,
      },
    };

    // Perform text-to-speech
    const [response] = await ttsClient.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error("No audio content generated");
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `audio/${uid}/response-${timestamp}.mp3`;

    // Upload to Firebase Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(fileName);

    await file.save(response.audioContent, {
      metadata: {
        contentType: "audio/mpeg",
        metadata: {
          userId: uid,
          language: language,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    // Make file publicly readable (or generate signed URL for private access)
    // For this app, we'll use signed URLs for security
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      audioUrl: url,
      storagePath: fileName,
    };
  } catch (error) {
    console.error("Error synthesizing speech:", error);
    throw new functions.https.HttpsError(
        "internal",
        `Failed to synthesize speech: ${error.message}`,
    );
  }
});
