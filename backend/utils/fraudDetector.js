/**
 * Fraud Detection Utility for Review System
 * Behavior-based fraud detection using multiple signals
 * Not based on rating value alone
 */

/**
 * Detect fraudulent reviews based on user behavior patterns
 * @param {Object} newReview - The review being submitted {movieId, userEmail, rating, comment}
 * @param {Array} userReviews - All previous reviews by this user
 * @returns {Object} {isFraudulent: boolean, fraudScore: number, reasons: Array<string>}
 */
export async function detectFraud(newReview, userReviews = []) {
  let fraudScore = 0;
  const reasons = [];

  // Config thresholds
  const config = {
    MIN_REPETITIVE_RATINGS: 4, // >= 4 same ratings = suspicious
    TIME_WINDOW_MINUTES: 2, // Reviews within 2 minutes = suspicious
    MIN_COMMENT_LENGTH: 10, // Too short comments are suspicious
    MAX_SAME_SHORT_COMMENTS: 3, // Same short comment repeated = spam
  };

  // Rule 1: Repetitive rating pattern (all 5s or all 1s)
  if (userReviews.length >= config.MIN_REPETITIVE_RATINGS - 1) {
    const ratings = userReviews.map((r) => r.rating);
    ratings.push(newReview.rating);

    const allFives = ratings.every((r) => r === 5);
    const allOnes = ratings.every((r) => r === 1);

    if (allFives || allOnes) {
      fraudScore++;
      reasons.push(
        `REPETITIVE_RATING: All ${allFives ? "5-star" : "1-star"} reviews`
      );
    }
  }

  // Rule 2: Too many reviews in short time window
  const now = new Date();
  const recentCount = userReviews.filter((review) => {
    const timeDiff = (now - new Date(review.createdAt)) / (1000 * 60); // Minutes
    return timeDiff <= config.TIME_WINDOW_MINUTES;
  }).length;

  if (recentCount >= 2) {
    fraudScore++;
    reasons.push(`SPAM_TIMING: ${recentCount + 1} reviews within ${config.TIME_WINDOW_MINUTES} minutes`);
  }

  // Rule 3: Very short or repeated comments
  const commentLength = newReview.comment.trim().length;
  const shortComments = ["good", "nice", "ok", "bad", "poor", "great", "awful"];
  const isShortComment =
    commentLength < config.MIN_COMMENT_LENGTH ||
    shortComments.includes(newReview.comment.toLowerCase());

  if (isShortComment) {
    // Check if user repeatedly uses short/generic comments
    const userShortComments = userReviews.filter((r) => {
      const rLen = r.comment.trim().length;
      return rLen < config.MIN_COMMENT_LENGTH ||
        shortComments.includes(r.comment.toLowerCase());
    }).length;

    if (userShortComments >= config.MAX_SAME_SHORT_COMMENTS) {
      fraudScore++;
      reasons.push(
        `SPAM_COMMENTS: User has ${userShortComments} short/generic comments`
      );
    }
  }

  // Rule 4: Duplicate reviews (same movie, same user)
  const duplicateReview = userReviews.find(
    (r) =>
      r.movieId === newReview.movieId &&
      r.userEmail === newReview.userEmail
  );

  if (duplicateReview) {
    fraudScore++;
    reasons.push(`DUPLICATE_REVIEW: User already reviewed this movie`);
  }

  // Rule 5: Anonymous abuse (guest email with multiple reviews)
  if (
    (newReview.userEmail === "guest" ||
      newReview.userEmail.toLowerCase() === "anonymous") &&
    userReviews.length >= 2
  ) {
    fraudScore++;
    reasons.push(
      `ANONYMOUS_ABUSE: Anonymous user with ${userReviews.length} reviews`
    );
  }

  // Determine if fraudulent (score >= 2)
  const isFraudulent = fraudScore >= 2;

  return {
    isFraudulent,
    fraudScore,
    reasons,
  };
}

/**
 * Get fraud detection summary for admin dashboard
 * @param {Array} reviews - All reviews to analyze
 * @returns {Object} Summary statistics
 */
export function getFraudSummary(reviews = []) {
  const fraudulent = reviews.filter((r) => r.isFraudulent).length;
  const total = reviews.length;
  const fraudRate = total > 0 ? ((fraudulent / total) * 100).toFixed(2) : 0;

  return {
    total,
    fraudulent,
    legitimate: total - fraudulent,
    fraudRate: `${fraudRate}%`,
  };
}

export default detectFraud;
