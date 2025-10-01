import express from "express";
import { google } from "googleapis";

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

router.get("/auth/google", (req, res) => {
  const scopes = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/presentations",
  ];

  try {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: scopes,
    });
    console.log("➡️ Redirecting user to:", url);
    res.redirect(url);
  } catch (err) {
    console.error("❌ Failed to generate Google Auth URL:", err);
    res.status(500).send("Google login error");
  }
});

router.get("/auth/google/callback", async (req, res) => {
  console.log("🔍 Callback query:", req.query);
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Missing authorization code.");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("✅ Tokens received:", tokens);

    req.session.tokens = tokens;
    oauth2Client.setCredentials(tokens);
    console.log("✅ Google tokens stored in session");

    res.redirect("http://localhost:3000/uploadTemplate");
  } catch (err) {
    console.error("❌ Google Auth failed:", err.response?.data || err.message || err);
    res.status(500).send("Authentication failed: " + err.message);
  }
});

router.get("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Logged out from Google" });
  });
});

router.get("/auth/status", (req, res) => {
  res.json({ loggedIn: !!req.session.tokens });
});

export default router;
