/**
 * Cloud Function: askGemini
 * Processes farmer questions using Gemini AI with agricultural expertise
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { validateAuth } = require("./utils/auth");
const { validateRequiredFields, validateLanguage, validateTextLength } = require("./utils/validators");
const { buildAgriculturalPrompt } = require("./prompts/agricultural");

// Initialize Gemini AI
// TODO: Set GEMINI_API_KEY in functions/.env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Asks Gemini AI for agricultural advice
 * @param {Object} data - { question: string, farmProfile: object, language: string, chatHistory?: array }
 * @param {Object} context - Cloud Function context with auth info
 * @return {Promise<Object>} { answer: string, confidence: string, sources: array, suggestions: array }
 */
exports.askGemini = functions.https.onCall(async (data, context) => {
  try {
    // Validate authentication
    const uid = await validateAuth(context);

    // Validate input
    validateRequiredFields(data, ["question", "farmProfile", "language"]);
    const question = validateTextLength(data.question, 1000);
    const language = validateLanguage(data.language);
    const farmProfile = data.farmProfile;

    if (!farmProfile || typeof farmProfile !== "object") {
      throw new Error("Invalid farm profile");
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
      throw new Error("Gemini API key not configured. Please set GEMINI_API_KEY in functions/.env");
    }

    // Build the agricultural prompt
    const systemPrompt = buildAgriculturalPrompt(farmProfile, language, question);

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate response
    const result = await model.generateContent(systemPrompt);
    const response = result.response;
    const responseText = response.text();

    // Parse JSON response
    let aiResponse;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      aiResponse = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", responseText);
      // Fallback response
      aiResponse = {
        answer: responseText,
        confidence: "Medium",
        sources: ["Gemini AI"],
        suggestions: [],
      };
    }

    // Validate response structure
    if (!aiResponse.answer) {
      throw new Error("Invalid AI response: missing answer field");
    }

    // Ensure confidence is valid
    const validConfidenceLevels = ["High", "Medium", "Low"];
    if (!validConfidenceLevels.includes(aiResponse.confidence)) {
      aiResponse.confidence = "Medium";
    }

    // Ensure arrays exist
    if (!Array.isArray(aiResponse.sources)) {
      aiResponse.sources = ["Gemini AI"];
    }
    if (!Array.isArray(aiResponse.suggestions)) {
      aiResponse.suggestions = [];
    }

    // Save to Firestore
    const db = admin.firestore();
    const chatRef = db.collection("users").doc(uid).collection("chats").doc();

    await chatRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      question: question,
      answer: aiResponse.answer,
      confidence: aiResponse.confidence,
      sources: aiResponse.sources,
      suggestions: aiResponse.suggestions,
      language: language,
      farmProfile: {
        crops: farmProfile.crops || [],
        location: farmProfile.location || {},
        soilType: farmProfile.soilType || "",
      },
    });

    return {
      answer: aiResponse.answer,
      confidence: aiResponse.confidence,
      sources: aiResponse.sources,
      suggestions: aiResponse.suggestions,
      chatId: chatRef.id,
    };
  } catch (error) {
    console.error("Error asking Gemini:", error);

    // Provide more specific error messages
    if (error.message.includes("API key")) {
      throw new functions.https.HttpsError(
          "failed-precondition",
          "Gemini API key not configured. Please contact support.",
      );
    }

    throw new functions.https.HttpsError(
        "internal",
        `Failed to get AI response: ${error.message}`,
    );
  }
});
