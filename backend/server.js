import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import bcrypt from "bcrypt";
import session from "express-session";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";
import PPTXGenJS from "pptxgenjs";
import multer from "multer";

// Import routes
import templateRoutes from "./routes/templateRoutes.js"; // prebuilt templates
import uploadRoutes from "./routes/uploadRoutes.js"; // upload PPTX files

const app = express();
const upload = multer({ storage: multer.memoryStorage() }); // for file uploads

// ---------------- Middleware ---------------- //
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "25mb" }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "super-secret-key",
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
app.use("/", templateRoutes);
app.use("/", uploadRoutes);

// ---------------- Helpers ---------------- //
function ensureSlidesArray(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.slides)) return parsed.slides;
  if (parsed && Array.isArray(parsed.data)) return parsed.data;
  // handle object maps like { "0": {...}, "1": {...} }
  if (parsed && typeof parsed === "object") {
    const vals = Object.values(parsed).filter(
      (v) => v && (v.title || v.bullets || Array.isArray(v))
    );
    if (vals.length) return vals;
  }
  throw new Error("Invalid slides format (expected an array)");
}

async function extractResponseText(result) {
  if (!result) return "";
  const resp = result.response;
  if (!resp) return JSON.stringify(result);
  if (typeof resp.text === "function") {
    // some SDKs return a function to get text
    try {
      const t = resp.text();
      return t instanceof Promise ? await t : t;
    } catch {
      // fallback
      return JSON.stringify(resp);
    }
  }
  // resp.text might be a string property
  if (typeof resp.text === "string") return resp.text;
  return JSON.stringify(resp);
}

// ---------------- Auth Routes ---------------- //
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: "All fields required." });

  try {
    const [existing] = await db.execute("SELECT email FROM users WHERE email = ?", [email]);
    if (existing.length) return res.status(400).json({ success: false, message: "Email already exists." });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, NOW())",
      [name, email, hashed]
    );
    const [user] = await db.execute("SELECT user_id, name, email FROM users WHERE user_id = ?", [result.insertId]);
    res.status(201).json({ success: true, user: user[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ success: false, message: "Email/password required." });

  try {
    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (!users.length) return res.status(401).json({ success: false, message: "Invalid email or password." });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: "Invalid email or password." });

    res.json({ success: true, user: { user_id: user.user_id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- AI Generator Route (JSON output) ---------------- //
app.post("/ai-generator", async (req, res) => {
  const { topic, slides } = req.body || {};
  if (!topic || !slides) return res.status(400).json({ success: false, error: "Missing topic or slides" });

  try {
    const prompt = `
      Create a presentation with ${slides} slides about: "${topic}".
      Each slide must have:
      - A title (max 10 words)
      - 3–5 bullet points
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

    let rawText = "";
    try {
      rawText = await extractResponseText(result);
    } catch (err) {
      console.error("Failed to extract response text:", err);
      return res.status(500).json({ success: false, error: "AI returned unexpected response" });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      console.error("AI JSON parse failed:", err, rawText);
      return res.status(500).json({ success: false, error: "Gemini returned invalid JSON" });
    }

    let slideData;
    try {
      slideData = ensureSlidesArray(parsed);
    } catch (err) {
      console.error("AI slides normalization failed:", err, parsed);
      return res.status(500).json({ success: false, error: "Invalid slides format from AI" });
    }

    // Return JSON so frontend can optionally preview
    res.json({ success: true, slides: slideData });
  } catch (err) {
    console.error("AI Generator failed:", err);
    res.status(500).json({ success: false, error: "AI Generator failed: " + err.message });
  }
});

// ---------------- Download PPTX Route ---------------- //
app.post("/download-pptx", async (req, res) => {
  const { slides } = req.body || {};
  if (!slides || !Array.isArray(slides)) return res.status(400).json({ success: false, error: "Missing or invalid slides" });

  try {
    const pptx = new PPTXGenJS();
    slides.forEach((s) => {
      const slide = pptx.addSlide();
      slide.addText(s.title || "Untitled", { x: 0.5, y: 0.5, fontSize: 24, bold: true });
      if (s.bullets?.length) {
        s.bullets.forEach((b, i) => {
          slide.addText(`• ${b}`, { x: 0.7, y: 1 + i * 0.5, fontSize: 18 });
        });
      }
    });

    const buffer = await pptx.write("nodebuffer");
    res.setHeader("Content-Disposition", "attachment; filename=AI_Presentation.pptx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.send(buffer);
  } catch (err) {
    console.error("PPTX generation failed:", err);
    res.status(500).json({ success: false, error: "PPTX generation failed" });
  }
});

// ---------------- Convert PDF → PPT ---------------- //
app.post("/convert-pdf", async (req, res) => {
  const { base64PDF, slides } = req.body || {};
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

    let rawText = "";
    try {
      rawText = await extractResponseText(result);
    } catch (err) {
      console.error("Failed to extract response text from PDF conversion:", err);
      return res.status(500).json({ error: "AI returned unexpected response" });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      console.error("PDF JSON parse failed:", err, rawText);
      return res.status(500).json({ error: "Gemini returned invalid JSON" });
    }

    let slideData;
    try {
      slideData = ensureSlidesArray(parsed);
    } catch (err) {
      console.error("PDF slides normalization failed:", err, parsed);
      return res.status(500).json({ error: "Invalid slides format from AI" });
    }

    res.json({ success: true, slides: slideData });
  } catch (err) {
    console.error("Conversion failed:", err);
    res.status(500).json({ error: "Conversion failed: " + err.message });
  }
});

// ---------------- Convert Word → PPT ---------------- //
app.post("/convert-word", async (req, res) => {
  const { base64Word, slides } = req.body || {};
  if (!base64Word || !slides) return res.status(400).json({ error: "Missing Word file or slides" });

  try {
    const buffer = Buffer.from(base64Word, "base64");
    const { value: text } = await mammoth.extractRawText({ buffer });
    if (!text || text.trim().length === 0) return res.status(400).json({ error: "Could not extract text from Word file" });

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

    let rawText = "";
    try {
      rawText = await extractResponseText(result);
    } catch (err) {
      console.error("Failed to extract response text from Word conversion:", err);
      return res.status(500).json({ error: "AI returned unexpected response" });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      console.error("Word JSON parse failed:", err, rawText);
      return res.status(500).json({ error: "Gemini returned invalid JSON" });
    }

    let slideData;
    try {
      slideData = ensureSlidesArray(parsed);
    } catch (err) {
      console.error("Word slides normalization failed:", err, parsed);
      return res.status(500).json({ error: "Invalid slides format from AI" });
    }

    res.json({ success: true, slides: slideData });
  } catch (err) {
    console.error("Word Conversion failed:", err);
    res.status(500).json({ error: "Word Conversion failed: " + err.message });
  }
});

// ---------------- Start Server ---------------- //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("🚀 Backend running on port", PORT));