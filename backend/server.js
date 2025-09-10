import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import bcrypt from "bcrypt";

const app = express();

// Enable CORS + JSON
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Database connection
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "slideit_db",
  waitForConnections: true,
  queueLimit: 0,
});

// Test DB connection
db.getConnection()
  .then(() => console.log("✅ Connected to MySQL!"))
  .catch((err) => console.error("❌ MySQL connection failed:", err.message));

// Get all users
app.get("/users", async (req, res) => {
  try {
    console.log("📥 Fetching users...");
    const [rows] = await db.execute("SELECT user_id, name, email, created_at FROM users");
    console.log("📊 Users fetched:", rows.length);
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch users error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Register route
app.post("/register", async (req, res) => {
  console.log("📥 Register request received:", req.body);
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    console.log("🔍 Checking for existing email:", email);
    const [existing] = await db.execute("SELECT email FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      console.log("🚫 Email already exists:", email);
      return res.status(400).json({ success: false, message: "Email already exists." });
    }

    console.log("🔒 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("💾 Inserting new user...");
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, NOW())",
      [fullName, email, hashedPassword]
    );

    console.log("📋 Fetching new user ID:", result.insertId);
    const [userResult] = await db.execute(
      "SELECT user_id, name, email FROM users WHERE user_id = ?",
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "✅ Account created successfully!",
      user: userResult[0] || { name: fullName, email },
    });
  } catch (err) {
    console.error("❌ Register error:", err.message);
    res.status(500).json({ success: false, message: `Database error: ${err.message}` });
  }
});

// Login route
app.post("/login", async (req, res) => {
  console.log("📥 Login request received for email:", req.body.email);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  try {
    console.log("🔍 Searching for user with email:", email);
    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      console.log("🚫 No user found for email:", email);
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const user = users[0];
    console.log("🔑 Comparing password...");
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log("🚫 Password mismatch for email:", email);
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    res.status(200).json({
      success: true,
      message: "✅ Login successful.",
      user: { user_id: user.user_id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ success: false, message: "Database error." });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log("📋 Available routes: /register (POST), /login (POST), /users (GET)");
});