/**
 * Fraud Detection System - Test Examples
 * 
 * This file demonstrates how the fraud detection system identifies
 * fraudulent reviews based on behavior patterns
 */

import { detectFraud, getFraudSummary } from "./fraudDetector.js";

// ============================================================
// TEST SCENARIO 1: Legitimate User - Varied Reviews
// ============================================================
console.log("\n📋 TEST 1: Legitimate User with Varied Reviews\n");

const legitimateUserReviews = [
  { movieId: "tt111", rating: 5, comment: "Amazing film! Wonderful cinematography.", createdAt: new Date(Date.now() - 86400000 * 30) },
  { movieId: "tt222", rating: 3, comment: "Average movie. Started well but lost pace.", createdAt: new Date(Date.now() - 86400000 * 20) },
  { movieId: "tt333", rating: 4, comment: "Good entertainment. Worth watching.", createdAt: new Date(Date.now() - 86400000 * 10) },
];

const newLegitReview = {
  movieId: "tt444",
  userEmail: "john@gmail.com",
  rating: 5,
  comment: "Absolutely brilliant! One of the best movies I've seen.",
};

detectFraud(newLegitReview, legitimateUserReviews)
  .then(result => {
    console.log("Result:", result);
    console.log("✅ User is LEGITIMATE");
    console.log(`   - Fraud Score: ${result.fraudScore}`);
    console.log(`   - Marked as Fraudulent: ${result.isFraudulent}`);
    console.log(`   - Reasons: ${result.reasons.length === 0 ? "None" : result.reasons.join(", ")}`);
  });

// ============================================================
// TEST SCENARIO 2: Spam Account - All 5-Star Reviews
// ============================================================
console.log("\n📋 TEST 2: Spam Account - All 5-Star Reviews (Repetitive Pattern)\n");

const spammerReviews = [
  { movieId: "tt001", rating: 5, comment: "Good", createdAt: new Date(Date.now() - 3600000 * 24) },
  { movieId: "tt002", rating: 5, comment: "Nice", createdAt: new Date(Date.now() - 3600000 * 12) },
  { movieId: "tt003", rating: 5, comment: "Great", createdAt: new Date(Date.now() - 3600000 * 6) },
  { movieId: "tt004", rating: 5, comment: "Good", createdAt: new Date(Date.now() - 3600000 * 2) },
];

const newSpamReview = {
  movieId: "tt005",
  userEmail: "spam@gmail.com",
  rating: 5,
  comment: "Good",
};

detectFraud(newSpamReview, spammerReviews)
  .then(result => {
    console.log("Result:", result);
    console.log("🚨 User is FRAUDULENT");
    console.log(`   - Fraud Score: ${result.fraudScore}`);
    console.log(`   - Marked as Fraudulent: ${result.isFraudulent}`);
    console.log(`   - Reasons: ${result.reasons.join(", ")}`);
  });

// ============================================================
// TEST SCENARIO 3: Rapid Fire Reviews (Spam Timing)
// ============================================================
console.log("\n📋 TEST 3: Rapid Fire Reviews (Too Many in Short Time)\n");

const rapidReviews = [
  { movieId: "tt101", rating: 4, comment: "Good movie overall", createdAt: new Date(Date.now() - 60000) },
  { movieId: "tt102", rating: 4, comment: "Had a good time watching this", createdAt: new Date(Date.now() - 30000) },
];

const newRapidReview = {
  movieId: "tt103",
  userEmail: "rapid@gmail.com",
  rating: 4,
  comment: "Good entertainment",
};

detectFraud(newRapidReview, rapidReviews)
  .then(result => {
    console.log("Result:", result);
    console.log("🚨 Potential SPAM (Timing)");
    console.log(`   - Fraud Score: ${result.fraudScore}`);
    console.log(`   - Marked as Fraudulent: ${result.isFraudulent}`);
    console.log(`   - Reasons: ${result.reasons.join(", ")}`);
  });

// ============================================================
// TEST SCENARIO 4: Duplicate Review
// ============================================================
console.log("\n📋 TEST 4: Duplicate Review (Same Movie, Same User)\n");

const duplicateReviews = [
  { movieId: "tt200", userEmail: "user@gmail.com", rating: 5, comment: "Loved this movie!", createdAt: new Date(Date.now() - 86400000 * 10) },
];

const newDuplicateReview = {
  movieId: "tt200", // Same movie!
  userEmail: "user@gmail.com",
  rating: 4,
  comment: "Actually, let me revise my rating",
};

detectFraud(newDuplicateReview, duplicateReviews)
  .then(result => {
    console.log("Result:", result);
    console.log("🚨 User is FRAUDULENT");
    console.log(`   - Fraud Score: ${result.fraudScore}`);
    console.log(`   - Marked as Fraudulent: ${result.isFraudulent}`);
    console.log(`   - Reasons: ${result.reasons.join(", ")}`);
  });

// ============================================================
// TEST SCENARIO 5: Anonymous Abuse (Guest Account with Multiple Reviews)
// ============================================================
console.log("\n📋 TEST 5: Anonymous Abuse (Guest Account)\n");

const anonReviews = [
  { movieId: "tt301", userEmail: "guest", rating: 5, comment: "Amazing!", createdAt: new Date(Date.now() - 3600000 * 48) },
  { movieId: "tt302", userEmail: "guest", rating: 1, comment: "Terrible!", createdAt: new Date(Date.now() - 3600000 * 24) },
];

const newAnonReview = {
  movieId: "tt303",
  userEmail: "guest",
  rating: 1,
  comment: "Worst movie ever",
};

detectFraud(newAnonReview, anonReviews)
  .then(result => {
    console.log("Result:", result);
    console.log("🚨 User is FRAUDULENT");
    console.log(`   - Fraud Score: ${result.fraudScore}`);
    console.log(`   - Marked as Fraudulent: ${result.isFraudulent}`);
    console.log(`   - Reasons: ${result.reasons.join(", ")}`);
  });

// ============================================================
// TEST SCENARIO 6: Multiple Red Flags
// ============================================================
console.log("\n📋 TEST 6: Multiple Red Flags (Ultimate Spammer)\n");

const ultimateSpammer = [
  { movieId: "tt401", rating: 5, comment: "ok", createdAt: new Date(Date.now() - 120000) },
  { movieId: "tt402", rating: 5, comment: "ok", createdAt: new Date(Date.now() - 90000) },
  { movieId: "tt403", rating: 5, comment: "ok", createdAt: new Date(Date.now() - 60000) },
  { movieId: "tt404", rating: 5, comment: "ok", createdAt: new Date(Date.now() - 30000) },
];

const newUltimateSpam = {
  movieId: "tt405",
  userEmail: "botspammer@gmail.com",
  rating: 5,
  comment: "ok",
};

detectFraud(newUltimateSpam, ultimateSpammer)
  .then(result => {
    console.log("Result:", result);
    console.log("🚨🚨 User is HIGHLY FRAUDULENT");
    console.log(`   - Fraud Score: ${result.fraudScore}`);
    console.log(`   - Marked as Fraudulent: ${result.isFraudulent}`);
    console.log(`   - Reasons: ${result.reasons.join(", ")}`);
  });

// ============================================================
// FRAUD SUMMARY EXAMPLE
// ============================================================
console.log("\n📊 FRAUD SUMMARY EXAMPLE\n");

const allReviews = [
  { movieId: "tt001", isFraudulent: false },
  { movieId: "tt002", isFraudulent: false },
  { movieId: "tt003", isFraudulent: true },
  { movieId: "tt004", isFraudulent: true },
  { movieId: "tt005", isFraudulent: false },
  { movieId: "tt006", isFraudulent: false },
];

const summary = getFraudSummary(allReviews);
console.log("Fraud Summary Report:");
console.log(`   - Total Reviews: ${summary.total}`);
console.log(`   - Legitimate Reviews: ${summary.legitimate}`);
console.log(`   - Fraudulent Reviews: ${summary.fraudulent}`);
console.log(`   - Fraud Rate: ${summary.fraudRate}`);

// ============================================================
// KEY INSIGHTS
// ============================================================
console.log("\n========================================");
console.log("KEY INSIGHTS FROM FRAUD DETECTION");
console.log("========================================\n");

console.log("✅ LEGITIMATE BEHAVIOR:");
console.log("   • User gives varied ratings (1-5 stars)");
console.log("   • Reviews spread over time (days/weeks)");
console.log("   • Detailed, meaningful comments");
console.log("   • One review per movie");
console.log("   • Registered email account");

console.log("\n🚨 FRAUDULENT BEHAVIOR:");
console.log("   • All same rating (all 5s or all 1s)");
console.log("   • Multiple reviews within minutes");
console.log("   • Short, generic comments (\"good\", \"ok\", etc.)");
console.log("   • Duplicate reviews of same movie");
console.log("   • Anonymous/guest accounts with many reviews");

console.log("\n📊 FRAUD SCORING:");
console.log("   • Score < 2: Legitimate ✅");
console.log("   • Score ≥ 2: Fraudulent 🚨");
console.log("   • Each suspicious pattern: +1 score");

console.log("\n========================================\n");

export { detectFraud, getFraudSummary };
