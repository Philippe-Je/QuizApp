// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const scoreRoutes = require("./routes/scores");

const app = express();
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/quizapp";

// Parse JSON bodies
app.use(express.json());

// Serve static files (index.html, style.css, script.js, questions.json)
app.use(express.static(__dirname));

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}


// ---------- API: Questions from local JSON ----------
// GET /api/questions
// By default tries Open Trivia DB; falls back to local questions.json if API fails.
// Optional query params: source=api|local, amount, category, difficulty, type
app.get("/api/questions", async (req, res) => {
  const {
    source = "api",        // "api" or "local"
    amount = "10",
    category,
    difficulty,
    type = "multiple",     // we’ll use multiple-choice for now
  } = req.query;

  // ================
  // 1) API MODE
  // ================
  if (source === "api") {
    try {
      const params = new URLSearchParams({
        amount: String(amount || 10),
        type,                      // "multiple" by default
        encode: "url3986",         // easier to decode
      });

      if (category) params.append("category", category);
      if (difficulty) params.append("difficulty", difficulty);

      const url = `https://opentdb.com/api.php?${params.toString()}`;
      console.log("Fetching trivia from:", url);

      const response = await fetch(url);
      const apiData = await response.json();

      if (apiData.response_code !== 0) {
        console.warn("Trivia API returned response_code:", apiData.response_code);
        // fall through to local questions below
        throw new Error("Trivia API error code " + apiData.response_code);
      }

      const letters = ["A", "B", "C", "D"];

      // Map API results → SAME shape as your local JSON:
      // { question, A, B, C, D, answer: "A"|"B"|"C"|"D" }
      const mapped = apiData.results.map((q) => {
        // Decode URL-encoded text
        const questionText = decodeURIComponent(q.question);
        const correct = decodeURIComponent(q.correct_answer);
        const incorrects = q.incorrect_answers.map((a) =>
          decodeURIComponent(a)
        );

        // For multiple-choice we have 1 correct + 3 incorrect = 4 answers
        // Put them all in one array, then shuffle
        const allAnswers = shuffleArray([correct, ...incorrects]);

        const obj = {
          question: questionText,
          A: allAnswers[0],
          B: allAnswers[1],
          C: allAnswers[2],
          D: allAnswers[3],
          answer: "", // will be set below
        };

        // Find which letter is the correct one
        const correctIndex = allAnswers.indexOf(correct);
        obj.answer = letters[correctIndex]; // "A"/"B"/"C"/"D"

        return obj;
      });

      return res.json(mapped);
    } catch (err) {
      console.error("Error fetching trivia API:", err.message);
      // if API failed, we continue to LOCAL fallback below
    }
  }

  // ================
  // 2) LOCAL FALLBACK
  // ================
  try {
    const filePath = path.join(__dirname, "questions.json");
    const raw = await fs.promises.readFile(filePath, "utf8");
    const data = JSON.parse(raw); // already in { question, A, B, C, D, answer } shape
    res.json(data);
  } catch (err) {
    console.error("Error reading local questions.json:", err);
    res.status(500).json({ error: "Unable to load any questions." });
  }
});


// ---------- API: Auth & Scores ----------
app.use("/api/auth", authRoutes);
app.use("/api/scores", scoreRoutes);

// Fallback: send index.html for root
// Fallback: serve index.html for any unknown route (so / just works)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


// ---------- Connect to MongoDB & start server ----------
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Quiz server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongo connection error:", err);
  });
