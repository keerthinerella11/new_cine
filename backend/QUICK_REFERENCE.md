# 🎬 Fraud Detection System - Quick Reference Guide

## 📦 What You Have Now

Your MERN application now includes a **complete, production-ready fraud detection system** that:

✅ Detects fraudulent reviews based on **5 behavioral patterns**  
✅ Uses a **scoring system** (2+ suspicious behaviors = fraud)  
✅ **NOT based on rating values alone** (5-star or 1-star reviews are normal!)  
✅ Stores **fraud reasons** for transparency  
✅ Automatically **filters out fraudulent reviews** from user view  
✅ Provides **admin statistics** endpoint  

---

## 🗂️ File Structure

```
backend/
├── utils/
│   ├── fraudDetector.js              ✨ NEW - Core fraud logic
│   └── fraudDetector.test.js         ✨ NEW - Test examples
├── routes/
│   └── reviewRoutes.js               ✏️ UPDATED - Integration
├── models/
│   └── Review.js                     ✏️ UPDATED - Schema fields
├── FRAUD_DETECTION.md                ✨ NEW - Full docs
└── IMPLEMENTATION_SUMMARY.md         ✨ NEW - This project summary
```

---

## 🎯 The 5 Fraud Detection Rules

### Rule 1: **Repetitive Ratings**
- Trigger: ≥4 reviews all 5-stars OR all 1-star
- Score: +1
- Example: `[5, 5, 5, 5]` = suspicious

### Rule 2: **Spam Timing**  
- Trigger: 2+ reviews within 2 minutes
- Score: +1
- Example: 3 reviews posted in 90 seconds = suspicious

### Rule 3: **Generic Comments**
- Trigger: 3+ short/generic comments (<10 chars or simple words)
- Score: +1
- Example: "good", "nice", "ok", "bad", "great" = spam patterns

### Rule 4: **Duplicate Reviews**
- Trigger: Same user reviews same movie twice
- Score: +1
- Example: User posts 2 reviews for movieId "tt123" = suspicious

### Rule 5: **Anonymous Abuse**
- Trigger: "guest"/"anonymous" account with 2+ reviews
- Score: +1
- Example: Account "guest" with multiple reviews = suspicious

---

## 🔢 Fraud Scoring

```
Each Rule Triggered: +1 fraud score
Score < 2: ✅ Legitimate review
Score ≥ 2: 🚨 Fraudulent review → Hidden from users
```

---

## 📡 API Integration

### Request Flow
```
POST /api/reviews
    ↓
Validate input
    ↓
Fetch user's previous reviews from DB
    ↓
Run detectFraud() analysis
    ↓
Score each of 5 rules
    ↓
Determine: isFraudulent = (score >= 2)
    ↓
Save review with fraud results
    ↓
Return response with fraudAnalysis object
```

### Response Example

```javascript
{
  message: "Review added",
  review: {
    _id: "...",
    movieId: "tt1234567",
    userEmail: "user@example.com",
    rating: 5,
    comment: "Amazing film!",
    isFraudulent: false,        // ← Fraud flag
    fraudScore: 0,              // ← Score (0-5)
    fraudReasons: [],           // ← Why flagged
    createdAt: "2024-01-15..."
  },
  fraudAnalysis: {
    isFraudulent: false,
    fraudScore: 0,
    reasons: []
  }
}
```

---

## 🛠️ How to Use

### 1. Create a Review (Auto-Detection)
```bash
curl -X POST http://localhost:5000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "movieId": "tt1234567",
    "userEmail": "john@gmail.com",
    "rating": 5,
    "comment": "Absolutely amazing film with great cinematography!"
  }'
```

### 2. Get Reviews (Auto-Filtered)
```bash
# Returns only legitimate reviews (isFraudulent: false)
curl http://localhost:5000/api/reviews/tt1234567
```

### 3. Check Admin Statistics
```bash
# View fraud rate and metrics
curl http://localhost:5000/api/reviews/admin/fraud-stats
```

---

## ⚙️ Configuration

**Location**: `/backend/utils/fraudDetector.js` (lines 19-24)

```javascript
const config = {
  MIN_REPETITIVE_RATINGS: 4,        // ← ≥4 same ratings = fraud
  TIME_WINDOW_MINUTES: 2,           // ← Time window for spam detection
  MIN_COMMENT_LENGTH: 10,           // ← Minimum character count
  MAX_SAME_SHORT_COMMENTS: 3,       // ← How many = pattern
};
```

**To Adjust**:
- More strict? Lower `MIN_REPETITIVE_RATINGS` to 3
- More relaxed? Increase `TIME_WINDOW_MINUTES` to 5
- Detect longer comments? Increase `MIN_COMMENT_LENGTH` to 15

---

## 📊 Key Features

| Feature | Status | Details |
|---------|--------|---------|
| Behavior-based | ✅ | 5 patterns, not rating-based |
| Transparent | ✅ | Stores reasons in `fraudReasons` |
| Configurable | ✅ | Easy threshold adjustments |
| Production | ✅ | Logging, error handling |
| Scalable | ✅ | MongoDB optimized |
| Monitored | ✅ | Admin stats endpoint |

---

## 🧪 Test Scenarios

### ✅ LEGITIMATE
```
Ratings: [5, 3, 4, 2, 5]  ← Varied, not repetitive
Comments: Detailed (50-200 chars each)
Timeline: Spread over weeks
Result: fraudScore = 0 ✅
```

### 🚨 FRAUDULENT
```
Ratings: [5, 5, 5, 5]     ← Repetitive
Comments: "good", "nice", "ok" ← Generic
Timeline: All within 5 minutes ← Spam timing
Result: fraudScore = 2+ 🚨
```

---

## 🔍 Debugging

### Check if Review was Marked Fraudulent
```javascript
// In your frontend or API client
const response = await fetch('/api/reviews', { 
  method: 'POST', 
  body: JSON.stringify(newReview) 
});
const data = await response.json();

console.log(data.fraudAnalysis);
// {
//   isFraudulent: true,
//   fraudScore: 2,
//   reasons: ["REPETITIVE_RATING: All 5-star reviews"]
// }
```

### View Fraudulent Reviews in Database
```javascript
// MongoDB
db.reviews.find({ isFraudulent: true }).pretty()

// See fraud reasons
db.reviews.findOne({ isFraudulent: true })
// Returns:
// {
//   _id: ObjectId("..."),
//   fraudReasons: ["REPETITIVE_RATING: All 5-star reviews", "SPAM_TIMING: 3 reviews within 2 minutes"]
// }
```

### Check Server Logs
```
Terminal output will show:
⚠️ Fraudulent review detected: {
  reviewId: "507f1f77bcf86cd799439012",
  userEmail: "spam@example.com",
  fraudScore: 2,
  reasons: ["REPETITIVE_RATING", "SPAM_TIMING"]
}
```

---

## 🚀 Starting the Application

```bash
# Terminal 1: Start Backend
cd backend
npm start
# Backend runs on http://127.0.0.1:5000

# Terminal 2: Start Frontend
cd frontend
npm run dev
# Frontend runs on http://localhost:5173 (or similar)
```

---

## 📈 Monitoring Dashboard (Optional)

Create a frontend dashboard using the admin endpoint:

```javascript
// Get fraud statistics
const stats = await fetch('/api/reviews/admin/fraud-stats').then(r => r.json());

console.log(`Total Reviews: ${stats.totalReviews}`);
console.log(`Fraudulent: ${stats.fraudulentReviews}`);
console.log(`Legitimate: ${stats.legitimateReviews}`);
console.log(`Fraud Rate: ${stats.fraudRate}`);
```

---

## 🎓 Understanding the Logic

### Algorithm Flow

```
1. User submits review: { movieId, userEmail, rating, comment }
   ↓
2. Fetch all reviews by this user from MongoDB
   ↓
3. FOR EACH RULE (1-5):
   - Check if rule triggers for this user's pattern
   - If triggered: fraudScore += 1, add reason to list
   ↓
4. Calculate: isFraudulent = (fraudScore >= 2)
   ↓
5. Save review with:
   - isFraudulent flag
   - fraudScore number
   - fraudReasons array
   ↓
6. Return response with fraudAnalysis object
   ↓
7. GET /reviews endpoint filters out fraudulent ones
   ↓
8. Users see only legitimate reviews
```

### Database Storage
```
review = {
  movieId: "tt123",
  userEmail: "user@gmail.com",
  rating: 5,
  comment: "Good movie",
  isFraudulent: false,          ← Boolean
  fraudScore: 0,                ← Number
  fraudReasons: [],             ← Array of strings
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔒 Security Considerations

✅ **No bypass paths** - All reviews go through fraud detection  
✅ **Transparent** - Reasons logged for audit trail  
✅ **Non-destructive** - Fraudulent reviews stored, not deleted  
✅ **Reversible** - Admin can manually update `isFraudulent` flag if needed  
✅ **Privacy-friendly** - No personal data exposed in fraud reasons  

---

## 💡 Future Enhancements

1. **ML Model** - Add machine learning for content analysis
2. **Whitelist** - Exclude trusted users from checks
3. **Custom Rules** - Admin panel to create custom thresholds
4. **Notifications** - Email alerts when fraud detected
5. **Analytics** - Dashboard showing fraud trends
6. **Appeals** - Allow users to dispute fraud flags

---

## 📚 Documentation Files

| File | Contains |
|------|----------|
| `FRAUD_DETECTION.md` | Complete technical docs |
| `IMPLEMENTATION_SUMMARY.md` | Full implementation details |
| `fraudDetector.test.js` | 6 test scenarios with examples |
| `fraudDetector.js` | Source code with inline comments |

---

## ✨ You're All Set!

Your fraud detection system is:
- ✅ Fully implemented
- ✅ Production-ready
- ✅ Well-documented
- ✅ Easy to configure
- ✅ Ready to use

**Start your backend and test it out!**

```bash
cd backend && npm start
```

Then post some test reviews and check:
1. Normal reviews → ✅ Accepted
2. Repetitive pattern reviews → 🚨 Flagged as fraud
3. Spam reviews → 🚨 Flagged as fraud

---

**Questions?** Check the detailed docs in `FRAUD_DETECTION.md`  
**Need to adjust?** Edit thresholds in `fraudDetector.js`  
**Want examples?** Run `fraudDetector.test.js` file  

Enjoy your fraud-free review system! 🎉
