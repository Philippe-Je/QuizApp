// routes/scores.js
const express = require("express");
const jwt = require("jsonwebtoken");
const Score = require("../models/score");
const User = require("../models/user");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key_change";

// Simple auth middleware
function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    console.error("JWT error:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// POST /api/scores
// Body: { category, score, totalQuestions, accuracy }
router.post("/", auth, async (req, res) => {
  try {
    const { category = "random", score, totalQuestions, accuracy } = req.body;

    if (
      typeof score !== "number" ||
      typeof totalQuestions !== "number" ||
      typeof accuracy !== "number"
    ) {
      return res
        .status(400)
        .json({ error: "score, totalQuestions, and accuracy must be numbers." });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const newScore = await Score.create({
      user: user._id,
      category,
      score,
      totalQuestions,
      accuracy,
    });

    // Update bestScore if this score is better
    if (score > (user.bestScore || 0)) {
      user.bestScore = score;
      await user.save();
    }

    res.status(201).json({
      message: "Score saved.",
      bestScore: user.bestScore,
      score: {
        id: newScore._id,
        category: newScore.category,
        score: newScore.score,
        totalQuestions: newScore.totalQuestions,
        accuracy: newScore.accuracy,
        createdAt: newScore.createdAt,
      },
    });
  } catch (err) {
    console.error("Error saving score:", err);
    res.status(500).json({ error: "Failed to save score." });
  }
});

// GET /api/scores/me?category=optional
router.get("/me", auth, async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { user: req.userId };
    if (category) filter.category = category;

    const scores = await Score.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ scores });
  } catch (err) {
    console.error("Error fetching user scores:", err);
    res.status(500).json({ error: "Failed to fetch user scores." });
  }
});

// GET /api/scores/leaderboard?category=optional&limit=10
router.get("/leaderboard", async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    const filter = {};
    if (category) filter.category = category;

    const scores = await Score.find(filter)
      .sort({ score: -1, accuracy: -1, createdAt: 1 })
      .limit(parseInt(limit, 10))
      .populate("user", "username")
      .lean();

    res.json({ scores });
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    res.status(500).json({ error: "Failed to fetch leaderboard." });
  }
});

module.exports = router;
