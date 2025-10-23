import dotenv from "dotenv";
dotenv.config();
import AWS from "aws-sdk";
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
const s3 = new AWS.S3();

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
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
// Serve static uploaded templates
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ---------------- Firebase ---------------- //
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();
// ---------------- Save Conversion to Firestore ---------------- //
async function saveConversion(userId, fileName, type, status = "Processing", downloadUrl = null) {
  const conversionRef = db.collection("conversions").doc(userId).collection("user_conversions");
  const docRef = await conversionRef.add({
    fileName,
    type,
    status,
    progress: 0,
    downloadUrl,
    uploadedAt: admin.firestore.Timestamp.now(),
  });
  return docRef.id;
}


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
export const uploadToS3 = async (fileBuffer, fileName, mimeType) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
  };

  try {
    const data = await s3.upload(params).promise();
    console.log("✅ Uploaded:", data.Location);
    return data.Location; // URL for download
  } catch (err) {
    console.error("❌ S3 Upload Error:", err);
    throw err;
  }
};
app.get("/api/conversions", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const ref = db.collection("conversions").doc(userId).collection("user_conversions");
    const snapshot = await ref.orderBy("uploadedAt", "desc").get();

    const conversions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Ensure slides and downloadUrl are included
      slides: doc.data().slides || [],
      downloadUrl: doc.data().downloadUrl || null,
    }));

    res.json(conversions);
  } catch (err) {
    console.error("Error fetching conversions:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/conversions/:id", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  if (!id || !userId) {
    return res.status(400).json({ error: "Missing id or userId" });
  }

  try {
    const ref = db.collection("conversions").doc(userId).collection("user_conversions").doc(id);
    const doc = await ref.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: "Conversion not found" });
    }

    await ref.delete();
    console.log(`✅ Deleted conversion ${id} for user ${userId}`);
    res.json({ success: true, message: "Conversion deleted successfully" });
  } catch (err) {
    console.error(`❌ Error deleting conversion ${id} for user ${userId}:`, err);
    res.status(500).json({ error: `Failed to delete conversion: ${err.message}` });
  }
});

// ---------------- AI Generator Route ---------------- //
app.post("/ai-generator", async (req, res) => {
  const { topic, slides, userId, fileName } = req.body || {};
  if (!topic || !slides || !userId || !fileName)
    return res.status(400).json({ error: "Missing required fields" });

  let conversionId = null;

  try {
    // 🧩 Step 1: Save "Processing" record in Firestore
    const conversionRef = db
      .collection("conversions")
      .doc(userId)
      .collection("user_conversions");

    const docRef = await conversionRef.add({
      fileName,
      type: "AI",
      status: "Processing",
      progress: 10,
      downloadUrl: null,
      slides: [], // Initialize slides array
      uploadedAt: admin.firestore.Timestamp.now(),
    });

    conversionId = docRef.id;
    console.log(`🤖 Created Firestore record for AI generation: ${conversionId}`);

    // 🧠 Step 2: Ask AI for slide content + image prompts
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

    // 🔄 Update progress
    await conversionRef.doc(conversionId).update({ progress: 40 });

    // 🧱 Step 3: Image generation function
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

    // 🧩 Step 4: Generate images per slide
    const slidesWithImages = [];
    for (const slide of slideData) {
      const imgPrompt = slide.imagePrompt || `${slide.title || topic} — ${slide.bullets?.join(", ") || ""}`;
      const imageBase64 = await generateImage(imgPrompt);
      slidesWithImages.push({ ...slide, imageBase64 });
      await new Promise((r) => setTimeout(r, 2000));
    }

    // 🔄 Update progress and save slides
    await conversionRef.doc(conversionId).update({
      progress: 80,
      slides: slidesWithImages,
    });

    // 📦 Step 5: Generate PPTX and upload to S3
    const pptx = new PPTXGenJS();
    for (const s of slidesWithImages) {
      const slide = pptx.addSlide();
      const margin = 0.5;
      const textWidth = 5.0;
      const imageWidth = 4.5;

      slide.addText(s.title || "Untitled", { x: margin, y: margin, w: textWidth - margin, fontSize: 28, bold: true, color: "203864" });

      if (s.bullets?.length) {
        const bulletText = s.bullets.map((b) => `• ${b}`).join("\n");
        slide.addText(bulletText, { x: margin, y: 1.2, w: textWidth - margin, fontSize: 18, color: "333333", lineSpacing: 28 });
      }

      if (s.imageBase64) {
        try {
          const imgBase64 = `data:image/png;base64,${s.imageBase64}`;
          slide.addImage({ data: imgBase64, x: textWidth + margin, y: 1.0, w: imageWidth, h: 4.5 });
        } catch (imgErr) {
          console.warn(`⚠️ Skipping invalid image for "${s.title}":`, imgErr);
        }
      }
    }

    const buffer = await pptx.write("nodebuffer");
    const s3Key = `conversions/${userId}/${conversionId}.pptx`;
    const downloadUrl = await uploadToS3(buffer, s3Key, "application/vnd.openxmlformats-officedocument.presentationml.presentation");

    // ✅ Step 6: Mark as completed
    await conversionRef.doc(conversionId).update({ status: "Completed", progress: 100, downloadUrl });

    console.log(`✅ AI Generation ${conversionId} completed successfully`);
    res.json({ success: true, slides: slidesWithImages, downloadUrl });
  } catch (err) {
    console.error("❌ AI Generation failed:", err);

    if (conversionId) {
      await conversionRef.doc(conversionId).update({ status: "Failed", progress: 100 });
    }

    res.status(500).json({ error: "AI Generation failed: " + err.message });
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
  const { base64PDF, slides, userId, fileName } = req.body || {};
  if (!base64PDF || !slides || !userId || !fileName)
    return res.status(400).json({ error: "Missing required fields" });

  let conversionId = null;

  try {
    // 🧩 Step 1: Save "Processing" record in Firestore
    const conversionRef = db
      .collection("conversions")
      .doc(userId)
      .collection("user_conversions");

    const docRef = await conversionRef.add({
      fileName,
      type: "PDF",
      status: "Processing",
      progress: 10,
      downloadUrl: null,
      slides: [], // Initialize slides array
      uploadedAt: admin.firestore.Timestamp.now(),
    });

    conversionId = docRef.id;
    console.log(`📄 Created Firestore record for conversion: ${conversionId}`);

    // 🧠 Step 2: Ask Gemini to generate slide text + image prompts
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

    // 🔄 Update progress
    await conversionRef.doc(conversionId).update({ progress: 40 });

    // 🧱 Step 3: Pollinations image generator with retries
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
          console.warn(`⚠️ Pollinations failed (attempt ${attempt + 1}):`, err.message);
          if (attempt < retries) await new Promise((r) => setTimeout(r, 2000));
        }
      }
      return null;
    }

    // 🧩 Step 4: Generate images in batches
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

        await new Promise((r) => setTimeout(r, 2000)); // avoid rate limits
      }

      console.log(`✅ Completed batch of ${batch.length} slides.`);
      await new Promise((r) => setTimeout(r, 5000)); // cooldown
    }

    // 🔄 Update progress and save slides
    await conversionRef.doc(conversionId).update({
      progress: 80,
      slides: slidesWithImages, // Save slide data
    });

    // 📦 Step 5: Generate and upload PPTX to S3
    const pptx = new PPTXGenJS();
    for (const s of slidesWithImages) {
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
    const s3Key = `conversions/${userId}/${conversionId}.pptx`;
    const downloadUrl = await uploadToS3(
      buffer,
      s3Key,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );

    // ✅ Step 6: Mark as completed
    await conversionRef.doc(conversionId).update({
      status: "Completed",
      progress: 100,
      downloadUrl,
    });

    console.log(`✅ Conversion ${conversionId} completed successfully`);
    res.json({ success: true, slides: slidesWithImages, downloadUrl });
  } catch (err) {
    console.error("❌ PDF Conversion failed:", err);

    if (conversionId) {
      await conversionRef.doc(conversionId).update({
        status: "Failed",
        progress: 100,
      });
    }

    res.status(500).json({ error: "Conversion failed: " + err.message });
  }
});


// ---------------- Convert Word → PPT (with images using Pollinations) ---------------- //
app.post("/convert-word", async (req, res) => {
  const { base64Word, slides, userId, fileName } = req.body || {};
  if (!base64Word || !slides || !userId || !fileName)
    return res.status(400).json({ error: "Missing required fields" });

  let conversionId = null;

  try {
    // 🧩 Step 1: Save "Processing" record in Firestore
    const conversionRef = db
      .collection("conversions")
      .doc(userId)
      .collection("user_conversions");

    const docRef = await conversionRef.add({
      fileName,
      type: "Word",
      status: "Processing",
      progress: 10,
      downloadUrl: null,
      slides: [], // Initialize slides array
      uploadedAt: admin.firestore.Timestamp.now(),
    });

    conversionId = docRef.id;
    console.log(`📄 Created Firestore record for conversion: ${conversionId}`);

    // 🧠 Step 2: Extract text from Word
    const buffer = Buffer.from(base64Word, "base64");
    const { value: text } = await mammoth.extractRawText({ buffer });

    if (!text || text.trim().length === 0)
      throw new Error("No readable text found in Word document");

    // 🧠 Step 3: Ask Gemini to generate slide text + image prompts
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

    // 🔄 Update progress
    await conversionRef.doc(conversionId).update({ progress: 40 });

    // 🧱 Step 4: Pollinations image generator with retries
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
          console.warn(`⚠️ Pollinations failed (attempt ${attempt + 1}):`, err.message);
          if (attempt < retries) await new Promise((r) => setTimeout(r, 2000));
        }
      }
      return null;
    }

    // 🧩 Step 5: Generate images in batches
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

        await new Promise((r) => setTimeout(r, 2000)); // avoid rate limits
      }

      console.log(`✅ Completed batch of ${batch.length} slides.`);
      await new Promise((r) => setTimeout(r, 5000)); // cooldown
    }

    // 🔄 Update progress and save slides
    await conversionRef.doc(conversionId).update({
      progress: 80,
      slides: slidesWithImages, // Save slide data
    });

    // 📦 Step 6: Generate and upload PPTX to S3
    const pptx = new PPTXGenJS();
    for (const s of slidesWithImages) {
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

    const bufferPPTX = await pptx.write("nodebuffer");
    const s3Key = `conversions/${userId}/${conversionId}.pptx`;
    const downloadUrl = await uploadToS3(
      bufferPPTX,
      s3Key,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );

    // ✅ Step 7: Mark as completed
    await conversionRef.doc(conversionId).update({
      status: "Completed",
      progress: 100,
      downloadUrl,
    });

    console.log(`✅ Word Conversion ${conversionId} completed successfully`);
    res.json({ success: true, slides: slidesWithImages, downloadUrl, conversionId });
  } catch (err) {
    console.error("❌ Word Conversion failed:", err);

    if (conversionId) {
      await conversionRef.doc(conversionId).update({
        status: "Failed",
        progress: 100,
      });
    }

    res.status(500).json({ error: "Conversion failed: " + err.message });
  }
});


// ---------------- Convert Text → PPT ---------------- //
app.post("/convert-text", async (req, res) => {
  const { textContent, slides, userId, fileName } = req.body || {};
  if (!textContent || !slides || !userId || !fileName)
    return res.status(400).json({ error: "Missing required fields" });

  let conversionId = null;

  try {
    // 🧩 Step 1: Save "Processing" record in Firestore
    const conversionRef = db
      .collection("conversions")
      .doc(userId)
      .collection("user_conversions");

    const docRef = await conversionRef.add({
      fileName,
      type: "Text",
      status: "Processing",
      progress: 10,
      downloadUrl: null,
      slides: [],
      uploadedAt: admin.firestore.Timestamp.now(),
    });

    conversionId = docRef.id;
    console.log(`📄 Created Firestore record for conversion: ${conversionId}`);

    // 🧠 Step 2: Ask Gemini/OpenAI to generate slide text + image prompts
    const prompt = `
      Convert the following text into ${slides} PowerPoint slides.
      Each slide must include:
      - A concise title (max 10 words)
      - 3–5 bullet points
      - An "imagePrompt" describing a fitting image

      Respond ONLY in JSON in this format:
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

    // 🔄 Update progress
    await conversionRef.doc(conversionId).update({ progress: 40 });

    // 🧱 Step 3: Pollinations image generator with retries
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
          console.warn(`⚠️ Pollinations failed (attempt ${attempt + 1}):`, err.message);
          if (attempt < retries) await new Promise((r) => setTimeout(r, 2000));
        }
      }
      return null;
    }

    // 🖼 Step 4: Generate images in batches
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

      console.log(`✅ Completed batch of ${batch.length} slides.`);
      await new Promise((r) => setTimeout(r, 5000)); // cooldown
    }

    // 🔄 Update progress and save slides
    await conversionRef.doc(conversionId).update({
      progress: 80,
      slides: slidesWithImages,
    });

    // 📦 Step 5: Generate PPTX
    const pptx = new PPTXGenJS();
    for (const s of slidesWithImages) {
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
        slide.addText(s.bullets.map((b) => `• ${b}`).join("\n"), {
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
        } catch (imgErr) {
          console.warn(`⚠️ Skipping invalid image for "${s.title}":`, imgErr);
        }
      }
    }

    const buffer = await pptx.write("nodebuffer");
    const s3Key = `conversions/${userId}/${conversionId}.pptx`;
    const downloadUrl = await uploadToS3(
      buffer,
      s3Key,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );

    // ✅ Step 6: Mark as completed
    await conversionRef.doc(conversionId).update({
      status: "Completed",
      progress: 100,
      downloadUrl,
    });

    console.log(`✅ Text Conversion ${conversionId} completed successfully`);
    res.json({ success: true, slides: slidesWithImages, downloadUrl });
  } catch (err) {
    console.error("❌ Text Conversion failed:", err);
    if (conversionId) {
      await conversionRef.doc(conversionId).update({
        status: "Failed",
        progress: 100,
      });
    }
    res.status(500).json({ error: "Conversion failed: " + err.message });
  }
});


app.post("/convert-excel", async (req, res) => {
  const { base64Excel, slides, userId, fileName } = req.body || {};
  if (!base64Excel || !slides || !userId || !fileName)
    return res.status(400).json({ error: "Missing required fields" });

  let conversionId = null;

  try {
    // 🧩 Step 1: Save "Processing" record in Firestore
    const conversionRef = db
      .collection("conversions")
      .doc(userId)
      .collection("user_conversions");

    const docRef = await conversionRef.add({
      fileName,
      type: "Excel",
      status: "Processing",
      progress: 10,
      downloadUrl: null,
      slides: [],
      uploadedAt: admin.firestore.Timestamp.now(),
    });

    conversionId = docRef.id;
    console.log(`📊 Created Firestore record for conversion: ${conversionId}`);

    // 🧱 Step 2: Parse Excel
    const buffer = Buffer.from(base64Excel, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });

    let combinedText = "";
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_csv(sheet);
      combinedText += `\n📄 Sheet: ${sheetName}\n${sheetData}\n`;
    });

    // 🔄 Update progress
    await conversionRef.doc(conversionId).update({ progress: 20 });

    // 🧠 Step 3: Generate slide text + image prompts via Gemini
    const prompt = `
      Convert the following Excel content into ${slides} PowerPoint slides.
      Each slide must include:
      - A concise title (max 10 words)
      - 3–5 bullet points summarizing insights, totals, or patterns
      - An "imagePrompt" describing a relevant image for the slide
      Respond ONLY in JSON.
      EXCEL CONTENT:
      ${combinedText}
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const rawText = await extractResponseText(result);
    const slidesData = ensureSlidesArray(JSON.parse(rawText));

    // 🔄 Update progress
    await conversionRef.doc(conversionId).update({ progress: 40 });

    // 🧩 Step 4: Pollinations image generator with retries
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
          console.warn(`⚠️ Pollinations failed (attempt ${attempt + 1}):`, err.message);
          if (attempt < retries) await new Promise((r) => setTimeout(r, 2000));
        }
      }
      return null;
    }

    // 🧱 Step 5: Generate images in batches
    const slidesWithImages = [];
    const batchSize = 5;

    for (let i = 0; i < slidesData.length; i += batchSize) {
      const batch = slidesData.slice(i, i + batchSize);

      for (const slide of batch) {
        const imgPrompt =
          slide.imagePrompt || slide.title || "Excel data illustration";
        console.log(`🖼 Generating image for slide: ${imgPrompt}`);
        const imageBase64 = await generateImage(imgPrompt);
        slidesWithImages.push({ ...slide, imageBase64 });
        await new Promise((r) => setTimeout(r, 2000));
      }

      console.log(`✅ Completed batch of ${batch.length} slides`);
      await new Promise((r) => setTimeout(r, 5000)); // cooldown
    }

    // 🔄 Update progress
    await conversionRef.doc(conversionId).update({
      progress: 80,
      slides: slidesWithImages,
    });

    // 📦 Step 6: Generate PPTX
    const pptx = new PPTXGenJS();
    for (const s of slidesWithImages) {
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
        slide.addText(s.bullets.map((b) => `• ${b}`).join("\n"), {
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

    const bufferPPTX = await pptx.write("nodebuffer");
    const s3Key = `conversions/${userId}/${conversionId}.pptx`;
    const downloadUrl = await uploadToS3(
      bufferPPTX,
      s3Key,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );

    // ✅ Step 7: Mark as completed
    await conversionRef.doc(conversionId).update({
      status: "Completed",
      progress: 100,
      downloadUrl,
    });

    console.log(`✅ Excel Conversion ${conversionId} completed`);
    res.json({ success: true, slides: slidesWithImages, downloadUrl });
  } catch (err) {
    console.error("❌ Excel Conversion failed:", err);
    if (conversionId) {
      await conversionRef.doc(conversionId).update({
        status: "Failed",
        progress: 100,
      });
    }
    res.status(500).json({ error: "Conversion failed: " + err.message });
  }
});




// ---------------- Start Server ---------------- //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("🚀 Backend running on port", PORT));