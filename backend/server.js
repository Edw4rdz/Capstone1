import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";


dotenv.config();
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "*****" : "Not set");
console.log("DB_NAME:", process.env.DB_NAME);
const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json({ limit: "25mb" }));

// Database
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  queueLimit: 0,
});

// Test DB connection
db.getConnection()
  .then(() => console.log("✅ Connected to MySQL!"))
  .catch((err) => console.error("❌ MySQL connection failed:", err.message));

// Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ----------------- ROUTES -----------------

// Register
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields required." });
  }

  try {
    // Check if email already exists
    const [existing] = await db.execute("SELECT email FROM users WHERE email = ?", [email]);
    if (existing.length) {
      return res.status(400).json({ success: false, message: "Email already exists." });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, NOW())",
      [name, email, hashed]
    );

    // Fetch newly created user
    const [user] = await db.execute(
      "SELECT user_id, name, email FROM users WHERE user_id = ?",
      [result.insertId]
    );

    res.status(201).json({ success: true, user: user[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email/password required." });
  }

  try {
    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);

    if (!users.length) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    res.json({
      success: true,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Convert PDF to PPT
app.post("/convert-pdf", async (req, res) => {
  const { base64PDF, slides } = req.body;
  if (!base64PDF || !slides) return res.status(400).json({ error: "Missing base64PDF or slides" });

  try {
    const prompt = `
      Extract text from this PDF and organize into ${slides} slides.
      Each slide: title (max 10 words) + 3-5 bullet points.
      Return JSON array of objects with "title" and "bullets".
    `;
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "application/pdf", data: base64PDF } },
          ],
        },
      ],
      generationConfig: { responseMimeType: "application/json" },
    });

    const slideData = JSON.parse(result.response.text());
    res.json(slideData);
  } catch (err) {
    res.status(500).json({ error: "Conversion failed: " + err.message });
  }
});
// --- CONVERT WORD TO PPT ---
app.post("/convert-word", async (req, res) => {
  const { base64Word, slides } = req.body;
  if (!base64Word || !slides) {
    return res.status(400).json({ error: "Missing Word file or slides" });
  }

  try {
    // Decode base64 Word → Buffer
    const buffer = Buffer.from(base64Word, "base64");

    // Extract text using Mammoth
    const { value: text } = await mammoth.extractRawText({ buffer });

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Could not extract text from Word file" });
    }

    // Build the prompt for Gemini
    const prompt = `
      Organize the following text into ${slides} slides.
      Each slide must have:
      - A title (max 10 words)
      - 3–5 bullet points
      Text:
      ${text}
      Return ONLY JSON in this format:
      [
        { "title": "Slide 1 title", "bullets": ["point1", "point2"] },
        { "title": "Slide 2 title", "bullets": ["point1", "point2"] }
      ]
    `;

    // Send ONLY extracted text to Gemini (❌ no inlineData here!)
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    let slideData = [];
    try {
      slideData = JSON.parse(result.response.text());
    } catch (err) {
      console.error("JSON parse failed:", err, result.response.text());
      return res.status(500).json({ error: "Gemini returned invalid JSON" });
    }

    res.json(slideData);
  } catch (err) {
    console.error("Word Conversion failed:", err);
    res.status(500).json({ error: "Word Conversion failed: " + err.message });
  }
});

// ----------------- START SERVER -----------------
app.listen(process.env.PORT || 5000, () =>
  console.log("🚀 Backend running on port", process.env.PORT || 5000)
);
