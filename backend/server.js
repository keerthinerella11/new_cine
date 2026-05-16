import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

console.log("📌 server.js is loading");

import userRoutes from "./routes/userRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

console.log("reviewRoutes in server:", reviewRoutes);

dotenv.config(); // ✅ Load .env first

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Routes
app.use("/api/users", userRoutes);
console.log("✅ User routes registered");
app.use("/api/favorites", favoriteRoutes);
console.log("✅ Favorite routes registered");
app.use("/api/reviews", reviewRoutes);
console.log("✅ Review routes registered"); 

// ✅ Check MongoDB URI
console.log("MONGO_URI configured:", !!process.env.MONGO_URI);
if (!process.env.MONGO_URI) {
  console.warn("⚠️ MONGO_URI is not set in environment variables. Running with in-memory fallback for favorites.");
}

// ✅ MongoDB Connection with Retry Logic
const connectDB = async (retries = 3) => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.warn("⚠️ No MongoDB URI found. The backend will run without persistent favorites/reviews storage.");
      return null;
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    if (retries > 0) {
      console.log(`Retrying in 5 seconds... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    }
    console.warn("⚠️ Could not connect to MongoDB after retries. The backend will keep running using in-memory fallback.");
    return null;
  }
};

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ Mongoose disconnected from MongoDB");
});

// ✅ Default route
app.get("/", (req, res) => res.send("CineZone Backend Running ✅"));

// ✅ Health check endpoint
app.get("/api/health", (req, res) => {
  const status = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  res.json({ status: "Server is running", database: status });
});

// ✅ Start server immediately, connect DB in background
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Connect to DB asynchronously
connectDB().catch(err => console.error("❌ DB connection failed:", err));
