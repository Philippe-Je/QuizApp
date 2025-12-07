// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const scoreRoutes = require("./routes/scores");

const app = express();

const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/quizapp";

// Parse JSON bodies
app.use(express.json());

// Serve static files (index.html, style.css, script.js, questions.json)
app.use(express.static(__dirname));

// ---------- API: Questions from local JSON ----------
app.get("/api/questions", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "questions.json");
    const jsonData = await fs.readFile(filePath, "utf8");
    const questions = JSON.parse(jsonData);
    res.json(questions);
  } catch (err) {
    console.error("Error reading questions.json:", err);
    res.status(500).json({ error: "Failed to load questions" });
  }
});

// ---------- API: Auth & Scores ----------
app.use("/api/auth", authRoutes);
app.use("/api/scores", scoreRoutes);

// Fallback: send index.html for root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ---------- Connect to MongoDB & start server ----------
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Quiz server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
