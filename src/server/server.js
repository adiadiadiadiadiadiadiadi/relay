import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";

// Load environment variables
dotenv.config();

const app = express();

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Stellar Marketplace API", version: "1.0.0" });
});

// JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";

// connect once at startup
const db = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "payroll_app",
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

// endpoint to list users
app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT id, name, email FROM users");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// endpoint to create a job posting
app.post("/api/jobs", async (req, res) => {
  const { title, description, price, currency, tags, userId } = req.body;

  // Validation
  if (!title || !description || !price || !currency || !tags || !userId) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!Array.isArray(tags) || tags.length === 0) {
    return res.status(400).json({ error: "At least one tag is required" });
  }

  try {
    const jobId = crypto.randomUUID();
    
    // Insert job
    await db.execute(
      "INSERT INTO jobs (id, employer_id, title, description, tags, price, currency, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'open')",
      [jobId, userId, title, description, JSON.stringify(tags), price, currency]
    );

    res.status(201).json({ 
      id: jobId, 
      title,
      description,
      price,
      currency,
      tags,
      employerId: userId,
      status: 'open',
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// endpoint to get all jobs
app.get("/api/jobs", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM jobs WHERE status != 'cancelled' ORDER BY created_at DESC"
    );
    res.json(rows.map(job => ({
      ...job,
      tags: job.tags ? (typeof job.tags === 'string' ? JSON.parse(job.tags) : job.tags) : []
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
