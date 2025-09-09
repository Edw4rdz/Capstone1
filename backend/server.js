import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // put your MySQL password if needed
  database: "slideit_db"
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err);
    return;
  }
  console.log("✅ Connected to MySQL!");
});

// Get all users (testing only)
app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// Register route
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  db.query(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, password],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "✅ User registered successfully!" });
    }
  );
});

// Login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length > 0) {
        res.json({ success: true, message: "✅ Login successful!" });
      } else {
        res.json({ success: false, message: "❌ Invalid email or password" });
      }
    }
  );
});

// Start server
app.listen(5000, () => {
  console.log("🚀 Backend running on http://localhost:5000");
});
