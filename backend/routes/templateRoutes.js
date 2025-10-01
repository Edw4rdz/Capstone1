// routes/templateRoutes.js
import express from "express";

const router = express.Router();

// Example pre-built templates (Google Slides IDs or links)
// 👉 Make sure each template's Google Slides is set to "Anyone with the link can edit"
// OR if you want "force copy", use `.../copy` link instead of `/edit`
const PREBUILT_TEMPLATES = [
  {
    id: "tpl1",
    name: "Business Pitch Deck",
    thumbnail: "https://cms-media.slidesai.io/wp-content/uploads/2024/02/20140647/Cover-Pitch-deck-vs-business-plan.png",
    link: "https://docs.google.com/presentation/d/10vyTYBuu9CgZE8Q8ES30sAzx16CkwMo_ZPuuLSuewdg/copy",
  },
  {
    id: "tpl2",
    name: "Book Report",
    thumbnail: "https://www.bibguru.com/blog/img/book-report-1400x700.png",
    link: "https://docs.google.com/presentation/d/1dPIqKfjDCGGZehxy5bQybSKtKtyMONPEAIY5d7FFsmo/copy",
  },
  {
    id: "tpl3",
    name: "Educational Template",
    thumbnail: "https://slidemodel.com/wp-content/uploads/60508-01-e-learning-powerpoint-template-16x9-1.jpg",
    link: "https://docs.google.com/presentation/d/1qoe2xLXw1XqnTP_1UBHyE1WYSd2wiE02_R7elzLzmss/copy",
  },
];

// ---------------- GET LIST ---------------- //
router.get("/templates/list", (req, res) => {
  res.json(PREBUILT_TEMPLATES);
});

// ---------------- USE TEMPLATE ---------------- //
router.post("/templates/use/:id", (req, res) => {
  const { id } = req.params;
  const tpl = PREBUILT_TEMPLATES.find((t) => t.id === id);

  if (!tpl) {
    return res.status(404).json({ success: false, message: "Template not found" });
  }

  res.json({ success: true, link: tpl.link });
});

export default router;
