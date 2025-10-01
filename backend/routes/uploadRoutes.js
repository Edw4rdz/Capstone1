import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Ensure uploads folder exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

// Allow only PPTX files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
    cb(null, true);
  } else {
    cb(new Error("Only .pptx files are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

// ---------------- ROUTES ---------------- //

// Upload a PPTX template
router.post("/upload-template", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  res.json({
    success: true,
    message: "Template uploaded successfully",
    file: {
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`, // public URL
      mimetype: req.file.mimetype,
      size: req.file.size,
    },
  });
});

// List uploaded templates
router.get("/uploaded-templates", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to read uploads folder" });
    }
    const templates = files.map((file) => ({
      name: file,
      url: `/uploads/${file}`,
    }));
    res.json(templates);
  });
});

export default router;
