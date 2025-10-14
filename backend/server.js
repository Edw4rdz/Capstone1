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
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

// Import routes
import templateRoutes from "./routes/templateRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

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

// ---------------- Firebase ---------------- //
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

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

// ---------------- Auth Routes ---------------- //
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password)
    return res
      .status(400)
      .json({ success: false, message: "All fields required." });

  try {
    const userRef = db.collection("users");
    const existing = await userRef.where("email", "==", email).get();

    if (!existing.empty)
      return res
        .status(400)
        .json({ success: false, message: "Email already exists." });

    const hashed = await bcrypt.hash(password, 10);
    const docRef = await userRef.add({
      name,
      email,
      password: hashed,
      created_at: admin.firestore.Timestamp.now(),
    });

    const userSnap = await docRef.get();
    const user = { user_id: docRef.id, ...userSnap.data() };
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res
      .status(400)
      .json({ success: false, message: "Email/password required." });

  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).get();

    if (snapshot.empty)
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });

    const userDoc = snapshot.docs[0];
    const user = { user_id: userDoc.id, ...userDoc.data() };

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });

    res.json({
      success: true,
      user: { user_id: user.user_id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- AI Generator Route ---------------- //
app.post("/ai-generator", async (req, res) => {
  const { topic, slides } = req.body || {};
  if (!topic || !slides)
    return res
      .status(400)
      .json({ success: false, error: "Missing topic or slides" });

  try {
    // Step 1️⃣ Ask AI for slide content + image prompts
    const prompt = `
      Create a presentation with ${slides} slides about: "${topic}".
      Each slide must have:
      - A title (max 10 words)
      - 3–5 bullet points
      - An "imagePrompt" describing an image for the slide
      Return ONLY JSON in this format:
      [
        { "title": "Slide 1 title", "bullets": ["point1", "point2"], "imagePrompt": "image description" }
      ]
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const rawText = await extractResponseText(result);
    const slideData = ensureSlidesArray(JSON.parse(rawText));

    // Step 2️⃣ Image generation function (Pollinations or similar)
    async function generateImage(prompt, retries = 2) {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 20000,
          });
          return Buffer.from(response.data, "binary").toString("base64");
        } catch (err) {
          console.warn(`Pollinations failed (attempt ${attempt + 1}):`, err.message);
          if (attempt < retries) await new Promise((r) => setTimeout(r, 2000));
        }
      }
      return null;
    }

    // Step 3️⃣ Generate images per slide (batching optional)
    const slidesWithImages = [];
    for (const slide of slideData) {
      const imgPrompt =
        slide.imagePrompt ||
        `${slide.title || topic} — ${slide.bullets?.join(", ") || ""}`;
      const imageBase64 = await generateImage(imgPrompt);
      slidesWithImages.push({ ...slide, imageBase64 });
      await new Promise((r) => setTimeout(r, 2000)); // optional delay
    }

    // Step 4️⃣ Return full slides
    res.json({ success: true, slides: slidesWithImages });
  } catch (err) {
    console.error("AI Generator failed:", err);
    res
      .status(500)
      .json({ success: false, error: "AI Generator failed: " + err.message });
  }
});


// ---------------- Download PPTX ---------------- //
app.post("/download-pptx", async (req, res) => {
  const { slides } = req.body || {};
  if (!slides || !Array.isArray(slides))
    return res
      .status(400)
      .json({ success: false, error: "Missing or invalid slides" });

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
          const imgBase64 = `data:image/png;base64,${s.imageBase64}`;
          slide.addImage({
            data: imgBase64,
            x: textWidth + margin,
            y: 1.0,
            w: imageWidth,
            h: 4.5,
          });
        } catch (imgErr) {
          console.warn(`⚠️ Skipping invalid image for "${s.title}":`, imgErr);
        }
      }
    }

    const buffer = await pptx.write("nodebuffer");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=AI_Presentation.pptx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
    res.send(buffer);
  } catch (err) {
    console.error("PPTX generation failed:", err);
    res
      .status(500)
      .json({ success: false, error: "PPTX generation failed: " + err.message });
  }
});


// ---------------- Convert PDF → PPT (with images using Craiyon) ---------------- //
// ---------------- Convert PDF → PPT (with images using Pollinations) ---------------- //
// ---------------- Convert PDF → PPT (Optimized with Pollinations batching + retries) ---------------- //
app.post("/convert-pdf", async (req, res) => {
  const { base64PDF, slides } = req.body || {};
  if (!base64PDF || !slides)
    return res.status(400).json({ error: "Missing base64PDF or slides" });

  try {
    // 🧠 Step 1: Ask Gemini to generate slide text + image prompts
    const textPrompt = `
      Analyze this PDF and create ${slides} PowerPoint slides.
      Each slide must include:
      - A title (max 10 words)
      - 3–5 bullet points
      - An "imagePrompt" describing an image that fits the slide content
      Return ONLY JSON in this format:
      [
        { "title": "Slide 1 title", "bullets": ["point1", "point2"], "imagePrompt": "image description" }
      ]
    `;

    const textResult = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: textPrompt },
            { inlineData: { mimeType: "application/pdf", data: base64PDF } },
          ],
        },
      ],
      generationConfig: { responseMimeType: "application/json" },
    });

    const rawText = await extractResponseText(textResult);
    const slidesData = ensureSlidesArray(JSON.parse(rawText));

    // 🧩 Step 2: Pollinations image generator with retries + delay
    async function generateImage(prompt, retries = 2) {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 20000, // 20s timeout
          });
          const base64 = Buffer.from(response.data, "binary").toString("base64");
          return base64;
        } catch (err) {
          console.warn(`⚠️ Pollinations failed (attempt ${attempt + 1}):`, err.message);
          if (attempt < retries) await new Promise((r) => setTimeout(r, 2000));
        }
      }
      return null;
    }

    // 🧱 Step 3: Batch requests to avoid rate limits (5 per batch)
    const slidesWithImages = [];
    const batchSize = 5;

    for (let i = 0; i < slidesData.length; i += batchSize) {
      const batch = slidesData.slice(i, i + batchSize);

      for (const slide of batch) {
        const imgPrompt =
          slide.imagePrompt ||
          `${slide.title || "presentation topic"} — ${slide.bullets?.join(", ") || ""}`;

        console.log(`🖼 Generating image for slide: ${imgPrompt}`);

        const imageBase64 = await generateImage(imgPrompt);
        slidesWithImages.push({ ...slide, imageBase64 });

        await new Promise((r) => setTimeout(r, 2000)); // 2s per image
      }

      console.log(`✅ Completed batch of ${batch.length} slides, waiting before next...`);
      await new Promise((r) => setTimeout(r, 5000)); // 5s cooldown between batches
    }

    // ✅ Step 4: Return full slides (text + base64 images)
    res.json({ success: true, slides: slidesWithImages });
  } catch (err) {
    console.error("❌ PDF Conversion failed:", err);
    res.status(500).json({ error: "Conversion failed: " + err.message });
  }
});



// ---------------- Convert Word → PPT (with images using Pollinations) ---------------- //
app.post("/convert-word", async (req, res) => {
  const { base64Word, slides } = req.body || {};
  if (!base64Word || !slides)
    return res.status(400).json({ error: "Missing base64Word or slides" });

  try {
    const buffer = Buffer.from(base64Word, "base64");
    const { value: text } = await mammoth.extractRawText({ buffer });

    if (!text || text.trim().length === 0)
      return res.status(400).json({ error: "No readable text found in Word document" });

    const textPrompt = `
      Convert the following Word document into ${slides} PowerPoint slides.
      Each slide must include:
      - A concise title (max 10 words)
      - 3–5 bullet points
      - An "imagePrompt" describing a fitting image

      Respond ONLY in JSON:
      [
        { "title": "Slide title", "bullets": ["point1", "point2"], "imagePrompt": "image idea" }
      ]

      DOCUMENT TEXT:
      ${text}
    `;

    const textResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: textPrompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const rawText = await extractResponseText(textResult);
    const slidesData = ensureSlidesArray(JSON.parse(rawText));

    async function generateImage(prompt, retries = 2) {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });
          return Buffer.from(response.data, "binary").toString("base64");
        } catch (err) {
          console.warn(`⚠️ Pollinations failed (attempt ${attempt + 1}):`, err.message);
          if (attempt < retries) await new Promise((r) => setTimeout(r, 2000));
        }
      }
      return null;
    }

    const slidesWithImages = [];
    const batchSize = 5;

    for (let i = 0; i < slidesData.length; i += batchSize) {
      const batch = slidesData.slice(i, i + batchSize);

      for (const slide of batch) {
        const imgPrompt = slide.imagePrompt || slide.title || "illustration related to topic";
        console.log(`🖼 Generating image for slide: ${imgPrompt}`);
        const imageBase64 = await generateImage(imgPrompt);
        slidesWithImages.push({ ...slide, imageBase64 });
        await new Promise((r) => setTimeout(r, 2000));
      }

      console.log(`✅ Completed batch of ${batch.length} slides, waiting before next...`);
      await new Promise((r) => setTimeout(r, 5000));
    }

    res.json({ success: true, slides: slidesWithImages });
  } catch (err) {
    console.error("❌ Word Conversion failed:", err);
    res.status(500).json({ error: "Conversion failed: " + err.message });
  }
});

// ---------------- Convert Text → PPT ---------------- //
app.post("/convert-text", async (req, res) => {
  const { textContent, slides } = req.body || {};
  if (!textContent || !slides)
    return res.status(400).json({ error: "Missing text content or slide count" });

  try {
    const prompt = `
      Convert the following text into ${slides} PowerPoint slides.
      Each slide must include:
      - A concise title (max 10 words)
      - 3–5 bullet points
      - An "imagePrompt" describing a fitting image

      Respond ONLY in JSON:
      [
        { "title": "Slide title", "bullets": ["point1", "point2"], "imagePrompt": "image idea" }
      ]

      TEXT CONTENT:
      ${textContent}
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const rawText = await extractResponseText(result);
    const slidesData = ensureSlidesArray(JSON.parse(rawText));

    async function generateImage(prompt, retries = 2) {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });
          return Buffer.from(response.data, "binary").toString("base64");
        } catch (err) {
          console.warn(`⚠️ Pollinations failed (attempt ${attempt + 1}):`, err.message);
          if (attempt < retries) await new Promise((r) => setTimeout(r, 2000));
        }
      }
      return null;
    }

    const slidesWithImages = [];
    const batchSize = 5;

    for (let i = 0; i < slidesData.length; i += batchSize) {
      const batch = slidesData.slice(i, i + batchSize);

      for (const slide of batch) {
        const imgPrompt = slide.imagePrompt || slide.title || "illustration related to topic";
        console.log(`🖼 Generating image for slide: ${imgPrompt}`);
        const imageBase64 = await generateImage(imgPrompt);
        slidesWithImages.push({ ...slide, imageBase64 });
        await new Promise((r) => setTimeout(r, 2000));
      }

      console.log(`✅ Completed batch of ${batch.length} slides, waiting before next...`);
      await new Promise((r) => setTimeout(r, 5000));
    }

    res.json({ success: true, slides: slidesWithImages });
  } catch (err) {
    console.error("❌ Text Conversion failed:", err);
    res.status(500).json({ error: "Conversion failed: " + err.message });
  }
});

// ---------------- Convert Excel → PPT ---------------- //
app.post("/convert-excel", async (req, res) => {
  const { base64Excel, slides } = req.body || {};
  if (!base64Excel || !slides)
    return res.status(400).json({ error: "Missing Excel file or slide count" });

  try {
    const buffer = Buffer.from(base64Excel, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });

    let combinedText = "";
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_csv(sheet);
      combinedText += `\n📄 Sheet: ${sheetName}\n${sheetData}\n`;
    });

    const prompt = `
      Convert the following Excel content into ${slides} PowerPoint slides.
      Each slide must include:
      - A concise title (max 10 words)
      - 3–5 bullet points summarizing insights, totals, or patterns
      - An "imagePrompt" describing a relevant image for the slide

      Respond ONLY in JSON:
      [
        { "title": "Slide title", "bullets": ["point1", "point2"], "imagePrompt": "image idea" }
      ]

      EXCEL CONTENT:
      ${combinedText}
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const rawText = await extractResponseText(result);
    let slidesData;
    try {
      slidesData = JSON.parse(rawText);
      if (!Array.isArray(slidesData)) throw new Error("Invalid JSON");
    } catch {
      slidesData = [{ title: "Summary", bullets: ["Could not parse Gemini output."], imagePrompt: "" }];
    }

    async function generateImage(prompt, retries = 2) {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });
          return Buffer.from(response.data, "binary").toString("base64");
        } catch (err) {
          console.warn(`⚠️ Pollinations failed (attempt ${attempt + 1}):`, err.message);
          if (attempt < retries) await new Promise((r) => setTimeout(r, 2000));
        }
      }
      return null;
    }

    const slidesWithImages = [];
    const batchSize = 5;

    for (let i = 0; i < slidesData.length; i += batchSize) {
      const batch = slidesData.slice(i, i + batchSize);

      for (const slide of batch) {
        const imgPrompt = slide.imagePrompt || slide.title || "Excel data illustration";
        console.log(`🖼 Generating image for slide: ${imgPrompt}`);
        const imageBase64 = await generateImage(imgPrompt);
        slidesWithImages.push({ ...slide, imageBase64 });
        await new Promise((r) => setTimeout(r, 2000));
      }

      console.log(`✅ Completed batch of ${batch.length} slides, waiting before next...`);
      await new Promise((r) => setTimeout(r, 5000));
    }

    res.json({ success: true, slides: slidesWithImages });
  } catch (err) {
    console.error("❌ Excel Conversion failed:", err);
    res.status(500).json({ error: "Excel Conversion failed: " + err.message });
  }
});



// ---------------- Start Server ---------------- //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("🚀 Backend running on port", PORT));