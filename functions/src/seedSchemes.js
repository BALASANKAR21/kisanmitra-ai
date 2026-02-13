/**
 * Seed script for government schemes collection
 * Populates Firestore with real Indian agricultural schemes
 */

const admin = require("firebase-admin");

/**
 * Government schemes data for Indian farmers
 */
const schemes = [
  {
    name: "PM-KISAN",
    description: "Pradhan Mantri Kisan Samman Nidhi - Direct income support of ₹6,000 per year to all farmer families with cultivable land holdings",
    eligibility_criteria: "All land-holding farmer families irrespective of the size of their land holdings",
    benefits: "₹6,000 per year in three equal installments of ₹2,000 each every four months",
    applicationUrl: "https://pmkisan.gov.in",
    category: "income_support",
    state: "all",
    active: true,
  },
  {
    name: "PM Fasal Bima Yojana",
    description: "Pradhan Mantri Fasal Bima Yojana - Crop insurance scheme providing financial support to farmers suffering crop loss/damage",
    eligibility_criteria: "All farmers growing notified crops in notified areas who have insurable interest in the crop",
    benefits: "Insurance coverage for pre-sowing to post-harvest losses. Premium: 2% for Kharif, 1.5% for Rabi, 5% for commercial/horticultural crops",
    applicationUrl: "https://pmfby.gov.in",
    category: "insurance",
    state: "all",
    active: true,
  },
  {
    name: "Kisan Credit Card (KCC)",
    description: "Credit facility for farmers to meet short-term credit requirements for cultivation and other needs",
    eligibility_criteria: "All farmers - individual/joint borrowers, tenant farmers, oral lessees, and sharecroppers",
    benefits: "Timely access to adequate credit at concessional rate of interest. 2% interest subvention, additional 3% for prompt repayment",
    applicationUrl: "https://www.india.gov.in/spotlight/kisan-credit-card-kcc",
    category: "credit",
    state: "all",
    active: true,
  },
  {
    name: "Soil Health Card Scheme",
    description: "Promotes soil test based nutrient management for improving soil health and crop productivity",
    eligibility_criteria: "All farmers across the country",
    benefits: "Free soil testing and issuance of soil health cards with recommendations for appropriate dosage of nutrients",
    applicationUrl: "https://soilhealth.dac.gov.in",
    category: "soil_health",
    state: "all",
    active: true,
  },
  {
    name: "Pradhan Mantri Krishi Sinchai Yojana (PMKSY)",
    description: "Per Drop More Crop - Aims to improve water use efficiency through micro-irrigation",
    eligibility_criteria: "Individual farmers, Self Help Groups, Farmer Producer Organizations, societies, trusts",
    benefits: "Subsidy for drip and sprinkler irrigation systems. 55% for small/marginal farmers, 45% for others",
    applicationUrl: "https://pmksy.gov.in",
    category: "irrigation",
    state: "all",
    active: true,
  },
  {
    name: "Paramparagat Krishi Vikas Yojana (PKVY)",
    description: "Promotes organic farming through cluster approach and certification",
    eligibility_criteria: "Groups of farmers organized in clusters of 50 acres (20 hectares)",
    benefits: "₹50,000 per hectare over 3 years for organic inputs, certification, and marketing support",
    applicationUrl: "https://pgsindia-ncof.gov.in",
    category: "organic_farming",
    state: "all",
    active: true,
  },
  {
    name: "National Agriculture Market (e-NAM)",
    description: "Pan-India electronic trading portal for agricultural commodities",
    eligibility_criteria: "Farmers and traders registered on the e-NAM platform",
    benefits: "Better price discovery, transparent auction process, online payment, and access to nationwide markets",
    applicationUrl: "https://www.enam.gov.in",
    category: "market_linkage",
    state: "all",
    active: true,
  },
  {
    name: "Rashtriya Krishi Vikas Yojana (RKVY)",
    description: "State Plan Scheme for incentivizing states to increase public investment in agriculture",
    eligibility_criteria: "Varies by state and component",
    benefits: "Support for agriculture infrastructure, mechanization, seed production, extension services",
    applicationUrl: "https://rkvy.nic.in",
    category: "infrastructure",
    state: "all",
    active: true,
  },
  {
    name: "Kisan Call Centre (KCC)",
    description: "Toll-free helpline providing immediate agricultural information to farmers",
    eligibility_criteria: "All farmers across India",
    benefits: "Free expert advice on agriculture, horticulture, animal husbandry, fisheries in 22 local languages. Dial 1800-180-1551",
    applicationUrl: "https://mkisan.gov.in/Home/KCCDashboard",
    category: "advisory",
    state: "all",
    active: true,
  },
  {
    name: "National Mission on Sustainable Agriculture (NMSA)",
    description: "Promotes sustainable agriculture practices through location specific interventions",
    eligibility_criteria: "Farmers in mission mode districts",
    benefits: "Support for water conservation, soil health, resource management, and climate adaptation",
    applicationUrl: "https://agricoop.nic.in/en/nmsa",
    category: "sustainability",
    state: "all",
    active: true,
  },
  {
    name: "Sub-Mission on Agricultural Mechanization (SMAM)",
    description: "Increases reach of farm mechanization to small and marginal farmers",
    eligibility_criteria: "Individual farmers, Custom Hiring Centers, Farm Machinery Banks",
    benefits: "40-50% subsidy on agricultural equipment and machinery",
    applicationUrl: "https://agrimachinery.nic.in",
    category: "mechanization",
    state: "all",
    active: true,
  },
  {
    name: "National Horticulture Mission",
    description: "Holistic growth of horticulture sector through area expansion and productivity enhancement",
    eligibility_criteria: "Individual farmers, groups, Self Help Groups, FPOs",
    benefits: "Subsidies for planting material, protected cultivation, post-harvest management, organic farming",
    applicationUrl: "https://midh.gov.in",
    category: "horticulture",
    state: "all",
    active: true,
  },
];

/**
 * Seeds the schemes collection in Firestore
 * Can be called as a Cloud Function or run locally
 */
async function seedSchemes() {
  try {
    console.log("Starting to seed schemes collection...");

    const db = admin.firestore();
    const schemesCollection = db.collection("schemes");

    let successCount = 0;
    let errorCount = 0;

    for (const scheme of schemes) {
      try {
        // Use scheme name as document ID (sanitized)
        const docId = scheme.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");

        await schemesCollection.doc(docId).set({
          ...scheme,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        successCount++;
        console.log(`✓ Added scheme: ${scheme.name}`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to add scheme ${scheme.name}:`, error.message);
      }
    }

    console.log(`\n✓ Seeding complete!`);
    console.log(`  - Successfully added: ${successCount} schemes`);
    console.log(`  - Errors: ${errorCount}`);

    return {
      success: true,
      added: successCount,
      errors: errorCount,
    };
  } catch (error) {
    console.error("Error seeding schemes:", error);
    throw error;
  }
}

// Export for use in Cloud Functions
module.exports = { seedSchemes };

// If run directly (not as a module), execute the seed
if (require.main === module) {
  // Initialize Firebase Admin (for local testing)
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  seedSchemes()
      .then(() => {
        console.log("Seed script completed successfully");
        process.exit(0);
      })
      .catch((error) => {
        console.error("Seed script failed:", error);
        process.exit(1);
      });
}
