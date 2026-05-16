import express from "express";
import mongoose from "mongoose";
import Favorite from "../models/Favorite.js";

const router = express.Router();
const inMemoryFavorites = [];

// ✅ Ensure DB connection or fallback to in-memory storage
const ensureDatabaseConnected = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.warn("⚠️ Database not connected, using in-memory favorites fallback");
    req.useInMemoryFallback = true;
    return next();
  }
  req.useInMemoryFallback = false;
  next();
};

// ✅ Get user from params or query safely
const getUserFromRequest = (req) => {
  if (req.params.user) {
    return decodeURIComponent(String(req.params.user)).trim();
  }
  if (req.query.user) {
    return String(req.query.user).trim();
  }
  return "";
};

// =========================
// ✅ GET FAVORITES
// =========================

// 👉 Supports BOTH:
// /api/favorites/:user
// /api/favorites?user=email

router.get("/", ensureDatabaseConnected, async (req, res) => {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(200).json({
        message: "Provide user email",
        favorites: [],
      });
    }

    console.log("📥 Fetching favorites for:", user);

    if (req.useInMemoryFallback) {
      const fallbackFavorites = inMemoryFavorites.filter((fav) => fav.likedBy === user);
      console.log("✅ Returning in-memory favorites", fallbackFavorites.length);
      return res.status(200).json(fallbackFavorites);
    }

    const favorites = await Favorite.find({
      likedBy: { $eq: user },
    });

    console.log("✅ Found:", favorites.length);

    return res.status(200).json(favorites);
  } catch (err) {
    console.error("❌ FULL ERROR:", err); // 🔥 IMPORTANT
    return res.status(500).json({
      error: "Failed to fetch favorites",
      details: err.message,
      favorites: [],
    });
  }
});

// 👉 Same logic for param route
router.get("/:user", ensureDatabaseConnected, async (req, res) => {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(400).json({
        error: "User is required",
        favorites: [],
      });
    }

    console.log("📥 Fetching favorites for:", user);

    if (req.useInMemoryFallback) {
      const fallbackFavorites = inMemoryFavorites.filter((fav) => fav.likedBy === user);
      return res.status(200).json(fallbackFavorites);
    }

    const favorites = await Favorite.find({
      likedBy: { $eq: user },
    });

    return res.status(200).json(favorites);
  } catch (err) {
    console.error("❌ FULL ERROR:", err);
    return res.status(500).json({
      error: "Failed to fetch favorites",
      details: err.message,
      favorites: [],
    });
  }
});

// =========================
// ✅ ADD FAVORITE
// =========================

router.post("/", ensureDatabaseConnected, async (req, res) => {
  try {
    let { movieId, title, poster, rating, likedBy } = req.body;

    if (!movieId || !likedBy) {
      return res.status(400).json({
        error: "movieId and likedBy are required",
      });
    }

    likedBy = String(likedBy).trim();
    rating = Number(rating) || 0;

    if (req.useInMemoryFallback) {
      const exists = inMemoryFavorites.some(
        (fav) => fav.movieId === movieId && fav.likedBy === likedBy
      );
      if (exists) {
        return res.status(200).json({ message: "Already in favorites" });
      }
      const newFavorite = { movieId, title, poster, rating, likedBy, createdAt: new Date() };
      inMemoryFavorites.push(newFavorite);
      return res.status(201).json({ message: "Added to favorites", favorite: newFavorite });
    }

    const existing = await Favorite.findOne({ movieId, likedBy });

    if (existing) {
      return res.status(200).json({
        message: "Already in favorites",
      });
    }

    const favorite = new Favorite({
      movieId,
      title,
      poster,
      rating,
      likedBy,
    });

    await favorite.save();

    return res.status(201).json({
      message: "Added to favorites",
      favorite,
    });
  } catch (err) {
    console.error("❌ FULL ERROR:", err);
    return res.status(500).json({
      error: "Failed to add favorite",
      details: err.message,
    });
  }
});

// =========================
// ✅ DELETE FAVORITE
// =========================

// Handler for DELETE - supports both:
// /api/favorites/:movieId/:user
// /api/favorites/:movieId
const deleteHandler = async (req, res) => {
  try {
    const movieId = String(req.params.movieId).trim();
    const user = getUserFromRequest(req);

    if (!movieId || !user) {
      return res.status(400).json({
        error: "movieId and user required",
      });
    }

    if (req.useInMemoryFallback) {
      const index = inMemoryFavorites.findIndex(
        (fav) => fav.movieId === movieId && fav.likedBy === user
      );
      if (index === -1) {
        return res.status(404).json({ message: "Favorite not found" });
      }
      inMemoryFavorites.splice(index, 1);
      return res.status(200).json({ message: "Removed from favorites" });
    }

    const removed = await Favorite.findOneAndDelete({
      movieId,
      likedBy: user,
    });

    if (!removed) {
      return res.status(404).json({
        message: "Favorite not found",
      });
    }

    return res.status(200).json({
      message: "Removed from favorites",
    });
  } catch (err) {
    console.error("❌ FULL ERROR:", err);
    return res.status(500).json({
      error: "Failed to remove favorite",
      details: err.message,
    });
  }
};

router.delete("/:movieId/:user", ensureDatabaseConnected, deleteHandler);
router.delete("/:movieId", ensureDatabaseConnected, deleteHandler);

export default router;