# Fraud Detection System Documentation

## Overview

The fraud detection system identifies fraudulent movie reviews based on **behavior patterns** rather than individual rating values. A single 5-star or 1-star review is normal; fraud is detected through suspicious patterns across multiple reviews.

## Architecture

### Files

1. **`utils/fraudDetector.js`** - Core detection logic
2. **`routes/reviewRoutes.js`** - Integration with POST endpoint
3. **`models/Review.js`** - Schema with fraud detection fields

## Fraud Detection Rules

### Rule 1: Repetitive Rating Pattern
**Trigger**: User gives the same rating (all 5s or all 1s) across 4+ reviews

**Score**: +1 when triggered

**Example**: User submits reviews with ratings [5, 5, 5, 5] or [1, 1, 1, 1]

### Rule 2: Too Many Reviews in Short Time
**Trigger**: Multiple reviews posted within 2 minutes

**Score**: +1 when triggered

**Example**: User submits 3 reviews within a 2-minute window

### Rule 3: Very Short or Repeated Comments
**Trigger**: User posts short comments (<10 chars) like "good", "nice", "ok", "bad" repeatedly

**Score**: +1 when triggered

**Example**: User has 3+ reviews with comments: "good", "nice", "ok"

### Rule 4: Duplicate Reviews
**Trigger**: User reviews the same movie multiple times

**Score**: +1 when triggered

**Example**: User submits a second review for movieId "123"

### Rule 5: Anonymous Abuse
**Trigger**: Anonymous user (email = "guest" or "anonymous") with 2+ reviews

**Score**: +1 when triggered

**Example**: "guest" account submits multiple reviews

## Fraud Scoring

- **Each suspicious behavior**: +1 score
- **Fraud threshold**: Score ≥ 2 → `isFraudulent: true`
- **Non-fraudulent**: Score < 2 → `isFraudulent: false`

## API Response Example

### POST /api/reviews

**Request:**
```json
{
  "movieId": "tt1234567",
  "userEmail": "user@example.com",
  "rating": 5,
  "comment": "Amazing movie! Highly recommended."
}
```

**Response (Legitimate Review):**
```json
{
  "message": "Review added",
  "review": {
    "_id": "507f1f77bcf86cd799439011",
    "movieId": "tt1234567",
    "userEmail": "user@example.com",
    "rating": 5,
    "comment": "Amazing movie! Highly recommended.",
    "isFraudulent": false,
    "fraudScore": 0,
    "fraudReasons": [],
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "fraudAnalysis": {
    "isFraudulent": false,
    "fraudScore": 0,
    "reasons": []
  }
}
```

**Response (Fraudulent Review):**
```json
{
  "message": "Review added",
  "review": {
    "_id": "507f1f77bcf86cd799439012",
    "movieId": "tt1234567",
    "userEmail": "spam@example.com",
    "rating": 5,
    "comment": "good",
    "isFraudulent": true,
    "fraudScore": 2,
    "fraudReasons": [
      "REPETITIVE_RATING: All 5-star reviews",
      "SPAM_COMMENTS: User has 3 short/generic comments"
    ],
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "fraudAnalysis": {
    "isFraudulent": true,
    "fraudScore": 2,
    "reasons": [
      "REPETITIVE_RATING: All 5-star reviews",
      "SPAM_COMMENTS: User has 3 short/generic comments"
    ]
  }
}
```

## Endpoints

### Create Review (with Fraud Detection)
```
POST /api/reviews
```
- Automatically detects fraud
- Stores `isFraudulent` flag
- Returns fraud analysis in response

### Get Reviews (Filtered)
```
GET /api/reviews/:movieId
```
- Returns only legitimate reviews (`isFraudulent: false`)
- Sorted by most recent first

### Fraud Statistics (Admin)
```
GET /api/reviews/admin/fraud-stats
```
- Total reviews count
- Fraudulent reviews count
- Fraud rate percentage

Example response:
```json
{
  "totalReviews": 150,
  "fraudulentReviews": 12,
  "legitimateReviews": 138,
  "fraudRate": "8.00%"
}
```

## MongoDB Schema

```javascript
{
  movieId: String,           // Movie ID being reviewed
  userEmail: String,         // User email
  rating: Number,            // 1-5 stars
  comment: String,           // Review text
  isFraudulent: Boolean,     // Fraud detection result
  fraudScore: Number,        // Score (0-5)
  fraudReasons: [String],    // Array of fraud reasons
  createdAt: Date,           // Creation timestamp
  updatedAt: Date            // Update timestamp
}
```

## Configuration Thresholds

Edit `utils/fraudDetector.js` to adjust sensitivity:

```javascript
const config = {
  MIN_REPETITIVE_RATINGS: 4,        // Change to detect earlier (e.g., 3)
  TIME_WINDOW_MINUTES: 2,           // Adjust time window (e.g., 5)
  MIN_COMMENT_LENGTH: 10,           // Minimum comment length
  MAX_SAME_SHORT_COMMENTS: 3,       // How many short comments = spam
};
```

## Integration Points

### Pre-Save Processing
```javascript
// reviews/fraudDetector.js - called on every new review
const fraudAnalysis = await detectFraud(newReview, userReviews);
```

### Console Logging
- Warnings logged for fraudulent reviews detected
- Format: `⚠️ Fraudulent review detected: {reviewId, userEmail, fraudScore, reasons}`

## Key Features

✅ **Behavior-based**: Not based on rating values alone

✅ **Pattern detection**: Identifies spam across multiple reviews

✅ **Configurable thresholds**: Easy to adjust sensitivity

✅ **Transparent reasons**: Stores why review was flagged

✅ **Async/await**: Clean, modern error handling

✅ **Production-ready**: Proper logging and monitoring

✅ **Scalable**: Query optimization with `.lean()`

## Testing Scenarios

### Scenario 1: Normal User, High Rating
- First review with 5 stars ✅ Legitimate
- Detailed comment
- Score: 0

### Scenario 2: Spam Pattern (All 5 Stars)
- Reviews: [5, 5, 5, 5, 5] ✅ Fraudulent (Score: 1+)
- Generic short comments
- Score: 2+ ✅ Marked as fraud

### Scenario 3: Anonymous Spam
- Email: "guest"
- Multiple short reviews posted quickly ✅ Fraudulent
- Score: 2+ (timing + anonymous)

### Scenario 4: Duplicate Review
- Same user reviews same movie twice ✅ Fraudulent
- Score: 1+ (increases with other factors)

## Monitoring & Alerts

### Check Fraud Rate
```bash
curl http://localhost:5000/api/reviews/admin/fraud-stats
```

### Review Logs
- All fraudulent detections logged to console
- Include: reviewId, userEmail, fraudScore, reasons

### Database Query
```javascript
// Find all fraudulent reviews
db.reviews.find({ isFraudulent: true })

// Find recent fraud by user
db.reviews.find({ userEmail: "spam@example.com", isFraudulent: true })
```

## Future Enhancements

1. **Machine Learning**: Integrate ML model for content analysis
2. **Reputation System**: Track user reputation scores
3. **Whitelist**: Exclude trusted users from fraud checks
4. **Custom Rules**: Admin panel to set custom thresholds
5. **Notifications**: Email admins when fraud detected
6. **Analytics Dashboard**: Visual fraud statistics

## Error Handling

All errors caught and logged:
- Database connection errors
- Validation errors
- Type errors
- Async operation failures

Proper HTTP status codes returned:
- `201`: Review created successfully
- `400`: Validation error
- `500`: Server error

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Production Ready
