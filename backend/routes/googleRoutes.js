// routes/googleRoutes.js
import express from "express";

const router = express.Router();

// Prebuilt templates — just share Google Slides "view-only" links or your own hosted thumbnails
const PREBUILT_TEMPLATES = [
  {
    id: "1abcXYZ1234567890", // Google Slide ID
    name: "Business Pitch Deck",
    thumbnail: "https://i.imgur.com/example1.png",
  },
  {
    id: "1defUVW9876543210",
    name: "Minimal Portfolio",
    thumbnail: "https://i.imgur.com/example2.png",
  },
];

// ---------------- LIST ---------------- //
router.get("/templates/list", (req, res) => {
  res.json(PREBUILT_TEMPLATES);
});

// ---------------- USE ---------------- //
// Instead of copying into Drive, just open the editable link
router.post("/templates/use/:id", (req, res) => {
  const { id } = req.params;

  const template = PREBUILT_TEMPLATES.find((tpl) => tpl.id === id);
  if (!template) {
    return res.status(404).json({ error: "Template not found" });
  }

  res.json({
    success: true,
    link: `https://docs.google.com/presentation/d/${id}/edit`,
  });
});

export default router;
