// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const scoreRoutes = require("./routes/scores");

const app = express();

// ====== CONFIG ======
const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/quizapp";

// ====== MONGOOSE CONNECTION (for serverless) ======
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    cachedDb = db;
    console.log("Connected to MongoDB");
    return db;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

// ====== MIDDLEWARE ======
app.use(express.json());

// Serve static assets from project root
app.use(express.static(path.join(__dirname)));

// ====== HELPERS ======
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ====== /api/questions (Trivia API + local fallback) ======
app.get("/api/questions", async (req, res) => {
  try {
    const {
      source = "api", // "api" or "local"
      amount = "10",
      category,
      difficulty,
      type = "multiple",
    } = req.query;

    // 1) Try Open Trivia API
    if (source === "api") {
      try {
        const params = new URLSearchParams({
          amount: String(amount || 10),
          type,
          encode: "url3986",
        });

        if (category) params.append("category", category);
        if (difficulty) params.append("difficulty", difficulty);

        const url = `https://opentdb.com/api.php?${params.toString()}`;
        console.log("Fetching trivia from:", url);

        const response = await fetch(url);
        const apiData = await response.json();

        if (apiData.response_code !== 0) {
          console.warn(
            "Trivia API returned response_code:",
            apiData.response_code
          );
          throw new Error("Trivia API error code " + apiData.response_code);
        }

        const letters = ["A", "B", "C", "D"];

        const mapped = apiData.results.map((q) => {
          const questionText = decodeURIComponent(q.question);
          const correct = decodeURIComponent(q.correct_answer);
          const incorrects = q.incorrect_answers.map((a) =>
            decodeURIComponent(a)
          );

          const allAnswers = shuffleArray([correct, ...incorrects]);

          const obj = {
            question: questionText,
            A: allAnswers[0],
            B: allAnswers[1],
            C: allAnswers[2],
            D: allAnswers[3],
            answer: "",
          };

          const correctIndex = allAnswers.indexOf(correct);
          obj.answer = letters[correctIndex];

          return obj;
        });

        return res.json(mapped);
      } catch (err) {
        console.error("Error fetching trivia API:", err.message);
        // Fall through to local JSON
      }
    }

    // 2) Local questions.json fallback
    const filePath = path.join(__dirname, "questions.json");
    const raw = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    res.json(data);
  } catch (err) {
    console.error("Error in /api/questions:", err);
    res.status(500).json({ error: "Unable to load any questions." });
  }
});

// ====== AUTH & SCORES (with DB connection) ======
app.use("/api/auth", async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error("Database connection failed:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
}, authRoutes);

app.use("/api/scores", async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error("Database connection failed:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
}, scoreRoutes);

// ====== FALLBACK: send index.html for everything else ======
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ====== EXPORT FOR VERCEL ======
module.exports = app;

// ====== LOCAL DEV ONLY ======
if (require.main === module) {
  connectToDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Quiz server running at http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Startup error:", err);
      process.exit(1);
    });
}