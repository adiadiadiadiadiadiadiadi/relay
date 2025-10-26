import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import jobsRouter from "./route/jobs.js";

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
  res.json({ message: "Stellar Marketplace API", version: "1.0.1", debug: "Updated server" });
});

// Test endpoint to verify server is updated
app.get("/api/test", (req, res) => {
  res.json({ message: "Server updated", timestamp: new Date().toISOString() });
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

// Use jobs router with database connection
app.use("/api", jobsRouter(db));

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
  const { title, description, price, currency, tags, userId, employerName } = req.body;

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
      "INSERT INTO jobs (id, employer_id, title, description, tags, price, currency, status, employer_name) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)",
      [jobId, userId, title, description, JSON.stringify(tags), price, currency, employerName || null]
    );

    res.status(201).json({ 
      id: jobId, 
      title,
      description,
      price,
      currency,
      tags,
      employerId: userId,
      employerName: employerName || null,
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

// endpoint to get conversations for a user
app.get("/api/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching conversations for user:', userId);
    
    // Get conversations with user details
    const [conversations] = await db.execute(`
      SELECT 
        c.id,
        c.recipient1,
        c.recipient2,
        c.created_at,
        CASE 
          WHEN c.recipient1 = ? THEN u2.name
          ELSE u1.name
        END as contact_name,
        CASE 
          WHEN c.recipient1 = ? THEN u2.email
          ELSE u1.email
        END as contact_email,
        CASE 
          WHEN c.recipient1 = ? THEN u2.id
          ELSE u1.id
        END as contact_id,
        j.title as job_title,
        m.content as last_message,
        m.created_at as last_message_time,
        m.sender_id as last_message_sender_id
      FROM conversations c
      LEFT JOIN users u1 ON c.recipient1 = u1.id
      LEFT JOIN users u2 ON c.recipient2 = u2.id
      LEFT JOIN jobs j ON (
        (c.recipient1 = j.employer_id AND c.recipient2 = j.employee_id) OR
        (c.recipient1 = j.employee_id AND c.recipient2 = j.employer_id)
      )
      LEFT JOIN messages m ON m.id = (
        SELECT id FROM messages 
        WHERE conversation_id = c.id 
        ORDER BY created_at DESC 
        LIMIT 1
      )
      WHERE c.recipient1 = ? OR c.recipient2 = ?
      ORDER BY COALESCE(m.created_at, c.created_at) DESC
    `, [userId, userId, userId, userId, userId]);

    console.log('Found conversations:', conversations.length);
    res.json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: "Database error" });
  }
});

// endpoint to get messages for a conversation
app.get("/api/conversations/:conversationId/messages", async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const [messages] = await db.execute(`
      SELECT 
        m.id,
        m.sender_id,
        m.content,
        m.created_at,
        u.name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `, [conversationId]);

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// endpoint to send a message
app.post("/api/conversations/:conversationId/messages", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { sender_id, content } = req.body;

    if (!sender_id || !content) {
      return res.status(400).json({ error: "Missing sender_id or content" });
    }

    const messageId = crypto.randomUUID();
    
    await db.execute(
      "INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)",
      [messageId, conversationId, sender_id, content]
    );

    // Get the created message with sender info
    const [messages] = await db.execute(`
      SELECT 
        m.id,
        m.sender_id,
        m.content,
        m.created_at,
        u.name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [messageId]);

    res.status(201).json(messages[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// endpoint to create a new conversation
app.post("/api/conversations", async (req, res) => {
  try {
    const { recipient1, recipient2 } = req.body;

    if (!recipient1 || !recipient2) {
      return res.status(400).json({ error: "Missing recipient1 or recipient2" });
    }

    // Check if conversation already exists
    const [existing] = await db.execute(
      "SELECT id FROM conversations WHERE (recipient1 = ? AND recipient2 = ?) OR (recipient1 = ? AND recipient2 = ?)",
      [recipient1, recipient2, recipient2, recipient1]
    );

    if (existing.length > 0) {
      return res.json({ conversation_id: existing[0].id, message: "Conversation already exists" });
    }

    const conversationId = crypto.randomUUID();
    
    await db.execute(
      "INSERT INTO conversations (id, recipient1, recipient2) VALUES (?, ?, ?)",
      [conversationId, recipient1, recipient2]
    );

    res.status(201).json({ conversation_id: conversationId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// endpoint to claim a job
app.put("/api/jobs/:id/claim", async (req, res) => {
  const { id } = req.params;
  const { status, claimed_by } = req.body;

  try {
    // First get the job to find the employer
    const [jobRows] = await db.execute(
      "SELECT employer_id, title FROM jobs WHERE id = ?",
      [id]
    );

    if (jobRows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const job = jobRows[0];

    // Update job status
    const [result] = await db.execute(
      "UPDATE jobs SET status = ?, employee_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'open'",
      [status, claimed_by, id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: "Job not available or already claimed" });
    }

    // Create notification for the employer
    const notificationId = crypto.randomUUID();
    await db.execute(
      "INSERT INTO notifications (id, user_id, message, type, `read`) VALUES (?, ?, ?, ?, 0)",
      [notificationId, job.employer_id, `Your job "${job.title}" has been claimed!`, 'job_claim']
    );

    // Check if conversation already exists between employer and employee
    const [existingConversations] = await db.execute(
      "SELECT id FROM conversations WHERE (recipient1 = ? AND recipient2 = ?) OR (recipient1 = ? AND recipient2 = ?)",
      [job.employer_id, claimed_by, claimed_by, job.employer_id]
    );

    let conversationId;
    
    if (existingConversations.length > 0) {
      // Use existing conversation
      conversationId = existingConversations[0].id;
      console.log('Using existing conversation:', conversationId, 'between', job.employer_id, 'and', claimed_by);
    } else {
      // Create new conversation
      conversationId = crypto.randomUUID();
      console.log('Creating new conversation:', conversationId, 'between', job.employer_id, 'and', claimed_by);
      
      await db.execute(
        "INSERT INTO conversations (id, recipient1, recipient2) VALUES (?, ?, ?)",
        [conversationId, job.employer_id, claimed_by]
      );
      console.log('Conversation created successfully');
    }

    try {
      // Create initial message from employee to employer
      const messageId = crypto.randomUUID();
      const initialMessage = `Hi! I'm interested in your job "${job.title}". I'd love to discuss the details and get started on this project.`;
      
      console.log('Creating initial message:', messageId, 'in conversation:', conversationId);
      
      await db.execute(
        "INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)",
        [messageId, conversationId, claimed_by, initialMessage]
      );
      console.log('Initial message created successfully');

      console.log('Job claimed successfully, conversation:', conversationId);
      console.log('About to send response with conversation_id:', conversationId);
      
      res.json({ 
        message: "Job claimed successfully",
        conversation_id: conversationId
      });
    } catch (conversationError) {
      console.error('Error creating message:', conversationError);
      // Still return success for job claim, but without conversation
      res.json({ 
        message: "Job claimed successfully",
        error: "Failed to create message"
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// endpoint to submit a job (employee submits work)
app.put("/api/jobs/:id/submit", async (req, res) => {
  const { id } = req.params;
  const { employee_id } = req.body;

  try {
    // First get the job to find the employer
    const [jobRows] = await db.execute(
      "SELECT employer_id, title, status, employee_id FROM jobs WHERE id = ?",
      [id]
    );

    if (jobRows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const job = jobRows[0];

    // Verify the employee owns this job
    if (parseInt(job.employee_id) !== parseInt(employee_id)) {
      return res.status(403).json({ error: "You don't have permission to submit this job" });
    }

    // Update job status to submitted
    const [result] = await db.execute(
      "UPDATE jobs SET status = 'submitted', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: "Failed to update job status" });
    }

    // Find conversation between employer and employee
    const [conversations] = await db.execute(
      "SELECT id FROM conversations WHERE (recipient1 = ? AND recipient2 = ?) OR (recipient1 = ? AND recipient2 = ?)",
      [job.employer_id, employee_id, employee_id, job.employer_id]
    );

    if (conversations.length > 0) {
      const conversationId = conversations[0].id;
      
      // Send message to employer
      const messageId = crypto.randomUUID();
      const messageContent = "The product has been submitted and is ready for review.";
      
      await db.execute(
        "INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)",
        [messageId, conversationId, employee_id, messageContent]
      );
    }

    res.json({ message: "Job submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// endpoint to verify a job (employer verifies work)
app.put("/api/jobs/:id/verify", async (req, res) => {
  const { id } = req.params;
  const { employer_id } = req.body;

  try {
    // First get the job to verify ownership
    const [jobRows] = await db.execute(
      "SELECT employer_id, status FROM jobs WHERE id = ?",
      [id]
    );

    if (jobRows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const job = jobRows[0];

    // Verify the employer owns this job
    if (parseInt(job.employer_id) !== parseInt(employer_id)) {
      return res.status(403).json({ error: "You don't have permission to verify this job" });
    }

    // Update job status to completed
    const [result] = await db.execute(
      "UPDATE jobs SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: "Failed to update job status" });
    }

    // Call handlePayment function (placeholder for now)
    // TODO: Implement payment logic here
    console.log('Job verified, payment should be processed now');

    res.json({ message: "Job verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// endpoint to get user wallets
app.get("/api/users/:id/wallets", async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await db.execute(
      "SELECT * FROM wallets WHERE user_id = ? ORDER BY created_at DESC",
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// endpoint to add a wallet
app.post("/api/users/:id/wallets", async (req, res) => {
  const { id } = req.params;
  const { label, address } = req.body;

  // Validation
  if (!label || !address) {
    return res.status(400).json({ error: "Label and address are required" });
  }

  try {
    const walletId = crypto.randomUUID();
    
    // Insert wallet
    await db.execute(
      "INSERT INTO wallets (id, user_id, label, address) VALUES (?, ?, ?, ?)",
      [walletId, id, label, address]
    );

    res.status(201).json({ 
      id: walletId,
      user_id: id,
      label,
      address,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// endpoint to delete a wallet
app.delete("/api/users/:id/wallets/:walletId", async (req, res) => {
  const { id, walletId } = req.params;

  try {
    const [result] = await db.execute(
      "DELETE FROM wallets WHERE id = ? AND user_id = ?",
      [walletId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    res.json({ message: "Wallet deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// endpoint to get user notifications
app.get("/api/users/:id/notifications", async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await db.execute(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// endpoint to mark notifications as read
app.put("/api/users/:id/notifications/read", async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute(
      "UPDATE notifications SET `read` = 1 WHERE user_id = ? AND `read` = 0",
      [id]
    );

    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// endpoint to create a notification
app.post("/api/notifications", async (req, res) => {
  const { user_id, message, type } = req.body;

  // Validation
  if (!user_id || !message) {
    return res.status(400).json({ error: "User ID and message are required" });
  }

  try {
    const notificationId = crypto.randomUUID();
    
    // Insert notification
    await db.execute(
      "INSERT INTO notifications (id, user_id, message, type, `read`) VALUES (?, ?, ?, ?, 0)",
      [notificationId, user_id, message, type || 'job_claim']
    );

    res.status(201).json({ 
      id: notificationId,
      user_id,
      message,
      type: type || 'job_claim',
      read: false,
      created_at: new Date().toISOString()
    });
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
