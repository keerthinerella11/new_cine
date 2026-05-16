import express from "express";
import Review from "../models/Review.js";
import { detectFraud } from "../utils/fraudDetector.js";

console.log("✅ reviewRoutes file is being loaded");
console.log("✅ Review model imported:", !!Review);
console.log("✅ Fraud detector imported");

const router = express.Router();
console.log("✅ Express router created");

// ✅ Test route (MUST come before /:movieId)
router.get("/test", (req, res) => {
  console.log("✅ Test route called for /test");
  res.json({ message: "Reviews API is working! ✅" });
});

console.log("✅ Test route /test registered");

// ✅ Add a review
router.post("/", async (req, res) => {
  try {
    const { movieId, userEmail, rating, comment } = req.body;

    if (!movieId || !userEmail || !rating || !comment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Fetch all previous reviews by this user
    const userReviews = await Review.find({ userEmail }).lean();

    // Perform fraud detection based on behavior patterns
    const fraudAnalysis = await detectFraud({ movieId, userEmail, rating, comment }, userReviews);

    // Create new review with fraud detection results
    const review = new Review({
      movieId,
      userEmail,
      rating,
      comment,
      isFraudulent: fraudAnalysis.isFraudulent,
      fraudScore: fraudAnalysis.fraudScore,
      fraudReasons: fraudAnalysis.reasons,
    });

    await review.save();

    // Log fraud detection results for monitoring
    if (fraudAnalysis.isFraudulent) {
      console.warn(`⚠️  Fraudulent review detected:`, {
        reviewId: review._id,
        userEmail,
        fraudScore: fraudAnalysis.fraudScore,
        reasons: fraudAnalysis.reasons,
      });
    }

    res.status(201).json({
      message: "Review added",
      review,
      fraudAnalysis: {
        isFraudulent: fraudAnalysis.isFraudulent,
        fraudScore: fraudAnalysis.fraudScore,
        reasons: fraudAnalysis.reasons,
      },
    });
  } catch (err) {
    console.error("❌ Error adding review:", err);
    res.status(500).json({ message: "Failed to add review", error: err.message });
  }
});

// ✅ Delete a review by ID
router.delete("/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;
    console.log(`Deleting review with ID: ${reviewId}`);
    
    const deletedReview = await Review.findByIdAndDelete(reviewId);
    
    if (!deletedReview) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    res.json({ message: "Review deleted successfully", review: deletedReview });
  } catch (err) {
    console.error("❌ Error deleting review:", err);
    res.status(500).json({ message: "Failed to delete review", error: err.message });
  }
});

// ✅ Update a review by ID
router.put("/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    
    if (!rating || !comment) {
      return res.status(400).json({ message: "Rating and comment are required" });
    }
    
    console.log(`Updating review with ID: ${reviewId}`);
    
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { rating, comment, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updatedReview) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    res.json({ message: "Review updated successfully", review: updatedReview });
  } catch (err) {
    console.error("❌ Error updating review:", err);
    res.status(500).json({ message: "Failed to update review", error: err.message });
  }
});

// ✅ Get reviews for a movie (filters out fraudulent reviews)
router.get("/:movieId", async (req, res) => {
  try {
    const { movieId } = req.params;
    console.log(`Fetching reviews for movieId: ${movieId}`);
    const reviews = await Review.find({ movieId, isFraudulent: false }).sort({ createdAt: -1 });
    console.log(`Found ${reviews.length} reviews for movieId: ${movieId}`);
    res.json(reviews);
  } catch (err) {
    console.error("❌ Error fetching reviews:", err);
    res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
  }
});

// ✅ Get fraud statistics (admin endpoint - optional)
router.get("/admin/fraud-stats", async (req, res) => {
  try {
    const totalReviews = await Review.countDocuments();
    const fraudulentReviews = await Review.countDocuments({ isFraudulent: true });
    const legitReviews = totalReviews - fraudulentReviews;

    res.json({
      totalReviews,
      fraudulentReviews,
      legitimateReviews: legitReviews,
      fraudRate: totalReviews > 0 ? ((fraudulentReviews / totalReviews) * 100).toFixed(2) + "%" : "0%",
    });
  } catch (err) {
    console.error("❌ Error fetching fraud statistics:", err);
    res.status(500).json({ message: "Failed to fetch fraud statistics", error: err.message });
  }
});

console.log("✅ reviewRoutes router is being exported");
export default router;