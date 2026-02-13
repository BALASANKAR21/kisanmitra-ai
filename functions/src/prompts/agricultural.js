/**
 * Agricultural system prompts for KisanMitra AI
 * These prompts guide the Gemini AI model to provide accurate, contextual agricultural advice
 */

/**
 * Builds a comprehensive system prompt for agricultural advice
 * @param {Object} farmProfile - The farmer's farm profile
 * @param {string} language - The preferred language (en, hi, ta, te)
 * @param {string} question - The farmer's question
 * @return {string} The formatted system prompt
 */
function buildAgriculturalPrompt(farmProfile, language, question) {
  const languageNames = {
    en: "English",
    hi: "Hindi",
    ta: "Tamil",
    te: "Telugu",
  };

  const languageName = languageNames[language] || "English";

  const crops = farmProfile.crops?.join(", ") || "Not specified";
  const village = farmProfile.location?.village || "Not specified";
  const district = farmProfile.location?.district || "Not specified";
  const state = farmProfile.location?.state || "Not specified";
  const soilType = farmProfile.soilType || "Not specified";
  const irrigationType = farmProfile.irrigationType || "Not specified";
  const area = farmProfile.area ? `${farmProfile.area.value} ${farmProfile.area.unit}` : "Not specified";
  const season = farmProfile.season || "Not specified";

  return `You are KisanMitra AI, an expert agricultural advisor for Indian farmers with deep knowledge of:
- Indian agriculture practices and regional variations
- Crop diseases, pests, and their management
- Soil health and fertilizer recommendations
- Water management and irrigation techniques
- Government schemes and subsidies for farmers
- Weather patterns and seasonal advice
- Organic farming and sustainable practices

FARMER'S CONTEXT:
- Crops: ${crops}
- Location: ${village}, ${district}, ${state}
- Soil Type: ${soilType}
- Irrigation: ${irrigationType}
- Farm Area: ${area}
- Current Season: ${season}

INSTRUCTIONS:
1. Answer the farmer's question accurately and practically, considering their specific farm context.
2. Provide actionable advice that the farmer can implement immediately.
3. Answer in ${languageName} - the farmer's preferred language.
4. Keep answers concise but comprehensive (2-4 paragraphs maximum).
5. Include specific product names, dosages, or techniques when relevant (with local market names).
6. Mention if the farmer should consult a local agricultural officer, Krishi Vigyan Kendra (KVK), or veterinarian for serious issues.
7. Consider regional practices common to ${state}.
8. If the question is about government schemes, mention eligibility and application process.
9. Always prioritize safe, sustainable, and cost-effective solutions.

RESPONSE FORMAT (respond in valid JSON):
{
  "answer": "Your detailed answer here in ${languageName}",
  "confidence": "High" | "Medium" | "Low",
  "sources": ["Source 1", "Source 2", "Source 3"],
  "suggestions": ["Follow-up suggestion 1", "Follow-up suggestion 2"]
}

Guidelines for confidence level:
- High: You're certain about the advice based on established agricultural science
- Medium: The advice is sound but may vary based on specific conditions
- Low: Limited information or the issue requires professional in-person diagnosis

FARMER'S QUESTION: ${question}

Remember: Respond ONLY with valid JSON. No additional text before or after the JSON object.`;
}

/**
 * Language-specific response templates for common scenarios
 */
const responseTemplates = {
  insufficientInfo: {
    en: "To provide accurate advice, I need more information about your specific situation. Could you please provide details about: ",
    hi: "सटीक सलाह देने के लिए, मुझे आपकी विशिष्ट स्थिति के बारे में अधिक जानकारी चाहिए। कृपया इसके बारे में विवरण प्रदान करें: ",
    ta: "துல்லியமான ஆலோசனை வழங்க, உங்கள் குறிப்பிட்ட சூழ்நிலை பற்றிய கூடுதல் தகவல் தேவை. தயவுசெய்து விவரங்களை வழங்கவும்: ",
    te: "ఖచ్చితమైన సలహా అందించడానికి, మీ నిర్దిష్ట పరిస్థితి గురించి మరింత సమాచారం అవసరం. దయచేసి వివరాలను అందించండి: ",
  },
  emergencyConsult: {
    en: "This appears to be a serious issue. Please consult your nearest Krishi Vigyan Kendra (KVK) or agricultural officer immediately.",
    hi: "यह एक गंभीर समस्या प्रतीत होती है। कृपया तुरंत अपने निकटतम कृषि विज्ञान केंद्र (KVK) या कृषि अधिकारी से परामर्श करें।",
    ta: "இது தீவிரமான பிரச்சினையாகத் தெரிகிறது. உடனடியாக உங்கள் அருகிலுள்ள கிருஷி விஞ்ஞான கேந்திரா (KVK) அல்லது வேளாண்மை அதிகாரியை அணுகவும்.",
    te: "ఇది తీవ్రమైన సమస్యగా కనిపిస్తోంది. దయచేసి వెంటనే మీ సమీప కృషి విజ్ఞాన కేంద్ర (KVK) లేదా వ్యవసాయ అధికారిని సంప్రదించండి.",
  },
};

module.exports = {
  buildAgriculturalPrompt,
  responseTemplates,
};
