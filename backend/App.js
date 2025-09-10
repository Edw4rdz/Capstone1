import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" })); // Increase limit for PDF base64

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Convert PDF endpoint
app.post("/convert-pdf", async (req, res) => {
  try {
    const { base64PDF, slides } = req.body;
    if (!base64PDF || !slides) {
      return res.status(400).json({ error: "Missing PDF or slides number" });
    }

    const prompt = `
      Extract text from this PDF and organize it into ${slides} slides.
      Return JSON in the format: [{ "title": "...", "bullets": ["...", "..."] }]
    `;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "application/pdf", data: base64PDF } }
          ]
        }
      ],
      generationConfig: { responseMimeType: "application/json" }
    });

    const slideData = JSON.parse(result.response.text());
    res.json(slideData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Optional: auth endpoints
app.post("/login", (req, res) => {
  // Dummy login
  res.json({ success: true });
});

app.post("/register", (req, res) => {
  // Dummy register
  res.json({ success: true });
});

app.listen(5000, () => console.log("🚀 Backend running on http://localhost:5000"));
