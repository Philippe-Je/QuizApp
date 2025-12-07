// server.js
const express = require("express");
const path = require("path");
const fs = require("fs").promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies if/when we add POST routes later
app.use(express.json());

// Serve static files (index.html, style.css, script.js, questions.json)
app.use(express.static(__dirname));

// Simple API endpoint to get questions
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

// Fallback: send index.html for the root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Quiz server running at http://localhost:${PORT}`);
});
