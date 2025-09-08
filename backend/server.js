import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",   // put your MySQL password if you have one
  database: "slideit_db"
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err);
    return;
  }
  console.log("✅ Connected to MySQL!");
});

app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  db.query(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, password],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "User registered successfully!" });
    }
  );
});

app.listen(5000, () => {
  console.log("🚀 Backend running on http://localhost:5000");
});
