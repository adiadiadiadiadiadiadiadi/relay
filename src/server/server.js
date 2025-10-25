import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

// JWT secret key (in production, use environment variable)
const JWT_SECRET = "your-secret-key-change-in-production";

// connect once at startup
const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "payroll_app",
});

// endpoint to register/signup
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name } = req.body;
  
  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    // Check if user already exists
    const [existingUsers] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name || email, email, hashedPassword]
    );

    // Generate JWT token
    const token = jwt.sign({ id: result.insertId, email }, JWT_SECRET, { expiresIn: "24h" });

    res.status(201).json({ 
      id: result.insertId, 
      email, 
      name: name || email,
      token 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// endpoint to login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Find user
    const [users] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });

    res.json({ 
      id: user.id, 
      email: user.email, 
      name: user.name,
      token 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// endpoint to add a user (legacy)
app.post("/users", async (req, res) => {
  const { name, email } = req.body;
  try {
    const [result] = await db.execute(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name, email]
    );
    res.status(201).json({ id: result.insertId, name, email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// endpoint to list users (legacy)
app.get("/users", async (req, res) => {
  const [rows] = await db.execute("SELECT * FROM users");
  res.json(rows);
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
