// routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key_change";

// POST /api/auth/signup
// Body: { username, password }
router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || username.trim().length < 2) {
      return res
        .status(400)
        .json({ error: "Username must be at least 2 characters." });
    }

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters." });
    }

    const cleanName = username.trim();

    // Check if user already exists
    const existing = await User.findOne({ username: cleanName });
    if (existing) {
      return res
        .status(409)
        .json({ error: "Username already exists. Please choose another." });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: cleanName,
      passwordHash,
      bestScore: 0,
    });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        bestScore: user.bestScore || 0,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error during signup." });
  }
});

// POST /api/auth/login
// Body: { username, password }
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required." });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res
        .status(400)
        .json({ error: "Invalid username or password." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res
        .status(400)
        .json({ error: "Invalid username or password." });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        bestScore: user.bestScore || 0,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login." });
  }
});

module.exports = router;
