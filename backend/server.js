// server.js
import dotenv from "dotenv";
dotenv.config();   // 👈 must run before anything else

import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import bcrypt from "bcrypt";
import session from "express-session";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";

// Import routes AFTER dotenv
import templateRoutes from "./routes/templateRoutes.js";  // ✅ new prebuilt templates
import uploadRoutes from "./routes/uploadRoutes.js";      // ✅ upload PPTX files

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "*****" : "Not set");
console.log("DB_NAME:", process.env.DB_NAME);

const app = express();

// ---------------- Middleware ---------------- //
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "25mb" }));

// Sessions (for local login if needed)
app.use(
  session({
    secret: "super-secret-key", // ⚠️ replace with env var in production
    resave: false,
    saveUninitialized: true,
  })
);

// Serve static uploaded templates
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ---------------- Database ---------------- //
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  queueLimit: 0,
});

db.getConnection()
  .then(() => console.log("✅ Connected to MySQL!"))
  .catch((err) => console.error("❌ MySQL connection failed:", err.message));

// ---------------- Gemini API ---------------- //
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ---------------- Routes ---------------- //
// Prebuilt templates (editable Google Slides links)
app.use("/", templateRoutes);

// Upload custom PPTX templates
app.use("/", uploadRoutes);

// ---------------- Auth Routes (local DB login/register) ---------------- //
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields required." });
  }

  try {
    const [existing] = await db.execute("SELECT email FROM users WHERE email = ?", [email]);
    if (existing.length) {
      return res.status(400).json({ success: false, message: "Email already exists." });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      "INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, NOW())",
      [name, email, hashed]
    );

    const [user] = await db.execute(
      "SELECT user_id, name, email FROM users WHERE user_id = ?",
      [result.insertId]
    );

    res.status(201).json({ success: true, user: user[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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

// ---------------- Convert PDF to PPT ---------------- //
app.post("/convert-pdf", async (req, res) => {
  const { base64PDF, slides } = req.body;
  if (!base64PDF || !slides) {
    return res.status(400).json({ error: "Missing base64PDF or slides" });
  }

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

// ---------------- Convert Word to PPT ---------------- //
app.post("/convert-word", async (req, res) => {
  const { base64Word, slides } = req.body;
  if (!base64Word || !slides) {
    return res.status(400).json({ error: "Missing Word file or slides" });
  }

  try {
    const buffer = Buffer.from(base64Word, "base64");
    const { value: text } = await mammoth.extractRawText({ buffer });

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Could not extract text from Word file" });
    }

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

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
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

// ---------------- Start Server ---------------- //
app.listen(process.env.PORT || 5000, () =>
  console.log("🚀 Backend running on port", process.env.PORT || 5000)
);
