// api/server.js
const mongoose = require("mongoose");
const app = require("../server");

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
  console.log("Connected to MongoDB (Vercel serverless)");
}

module.exports = async (req, res) => {
  try {
    await connectToDatabase();
    return app(req, res); // hand off to Express app
  } catch (err) {
    console.error("Serverless error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
