import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import session from "express-session";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";
import PPTXGenJS from "pptxgenjs";
import multer from "multer";
import * as XLSX from "xlsx";
import axios from "axios";
import admin from "firebase-admin";
import fs from "fs";

// Import routes
import templateRoutes from "./routes/templateRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

// ✅ Import JSON file using ESM JSON import syntax
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Express setup
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "25mb" }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "super-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Gemini API setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ---------------- Helper Functions ---------------- //
function ensureSlidesArray(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.slides)) return parsed.slides;
  if (parsed && Array.isArray(parsed.data)) return parsed.data;
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
    try {
      const t = resp.text();
      return t instanceof Promise ? await t : t;
    } catch {
      return JSON.stringify(resp);
    }
  }
  if (typeof resp.text === "string") return resp.text;
  return JSON.stringify(resp);
}

// ---------------- AUTH ROUTES (FIRESTORE VERSION) ---------------- //
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: "All fields required." });

  try {
    const userRef = db.collection("users");
    const existing = await userRef.where("email", "==", email).get();
    if (!existing.empty)
      return res.status(400).json({ success: false, message: "Email already exists." });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = {
      name,
      email,
      password: hashed,
      created_at: admin.firestore.Timestamp.now(),
    };

    const docRef = await userRef.add(newUser);
    const userSnap = await docRef.get();
    const user = { user_id: docRef.id, ...userSnap.data() };

    res.status(201).json({ success: true, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email/password required." });

  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).get();

    if (snapshot.empty)
      return res.status(401).json({ success: false, message: "Invalid email or password." });

    const userDoc = snapshot.docs[0];
    const user = { user_id: userDoc.id, ...userDoc.data() };

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ success: false, message: "Invalid email or password." });

    res.json({ success: true, user: { user_id: user.user_id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- Include Routes ---------------- //
app.use("/", templateRoutes);
app.use("/", uploadRoutes);

// ---------------- AI Generator ---------------- //
app.post("/ai-generator", async (req, res) => {
  const { topic, slides } = req.body || {};
  if (!topic || !slides)
    return res.status(400).json({ success: false, error: "Missing topic or slides" });

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

    const rawText = await extractResponseText(result);
    const parsed = JSON.parse(rawText);
    const slideData = ensureSlidesArray(parsed);
    res.json({ success: true, slides: slideData });
  } catch (err) {
    console.error("AI Generator failed:", err);
    res.status(500).json({ success: false, error: "AI Generator failed: " + err.message });
  }
});

// ---------------- Download PPTX ---------------- //
app.post("/download-pptx", async (req, res) => {
  const { slides } = req.body || {};
  if (!slides || !Array.isArray(slides))
    return res.status(400).json({ success: false, error: "Missing or invalid slides" });

  try {
    const pptx = new PPTXGenJS();
    for (const s of slides) {
      const slide = pptx.addSlide();
      const margin = 0.5;
      const textWidth = 5.0;
      const imageWidth = 4.5;

      slide.addText(s.title || "Untitled", {
        x: margin,
        y: margin,
        w: textWidth - margin,
        fontSize: 28,
        bold: true,
        color: "203864",
      });

      if (s.bullets?.length) {
        const bulletText = s.bullets.map((b) => `• ${b}`).join("\n");
        slide.addText(bulletText, {
          x: margin,
          y: 1.2,
          w: textWidth - margin,
          fontSize: 18,
          color: "333333",
          lineSpacing: 28,
        });
      }

      if (s.imageBase64) {
        try {
          slide.addImage({
            data: `data:image/png;base64,${s.imageBase64}`,
            x: textWidth + margin,
            y: 1.0,
            w: imageWidth,
            h: 4.5,
          });
        } catch (err) {
          console.warn(`Skipping invalid image for slide "${s.title}":`, err.message);
        }
      }
    }

    const buffer = await pptx.write("nodebuffer");
    res.setHeader("Content-Disposition", "attachment; filename=AI_Presentation.pptx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
    res.send(buffer);
  } catch (err) {
    console.error("PPTX generation failed:", err);
    res.status(500).json({ success: false, error: "PPTX generation failed: " + err.message });
  }
});

// ---------------- Start Server ---------------- //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("🚀 Backend running on port", PORT));
