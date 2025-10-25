const express = require('express');
const router = express.Router();
const db = require('../config/database');
const trustlessWork = require('../services/trustlessWork');
const { v4: uuidv4 } = require('uuid'); // You'll need to install: npm install uuid

// GET /api/jobs - Get all open jobs
router.get('/jobs', async (req, res) => {
  try {
    const [jobs] = await db.query(
      'SELECT * FROM jobs WHERE status = "open" ORDER BY created_at DESC'
    );
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/employer/:id - Get jobs posted by employer
router.get('/jobs/employer/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [jobs] = await db.query(
      'SELECT * FROM jobs WHERE employer_id = ? ORDER BY created_at DESC',
      [id]
    );
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching employer jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/employee/:id - Get jobs claimed by employee (freelancer)
router.get('/jobs/employee/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [jobs] = await db.query(
      'SELECT * FROM jobs WHERE employee_id = ? ORDER BY created_at DESC',
      [id]
    );
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching employee jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/:id - Get single job by ID
router.get('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [jobs] = await db.query('SELECT * FROM jobs WHERE id = ?', [id]);
    
    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(jobs[0]);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// POST /api/jobs - Create new job
router.post('/jobs', async (req, res) => {
  try {
    const { 
      employer_id, 
      title, 
      description, 
      tags,
      price, 
      currency,
      name 
    } = req.body;

    // Validate input
    if (!employer_id || !title || !description || !price || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate UUID for job
    const jobId = uuidv4();

    // Insert job into database
    await db.query(
      `INSERT INTO jobs 
       (id, employer_id, title, description, tags, price, currency, name, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        jobId,
        employer_id,
        title,
        description,
        tags || null,
        price,
        currency,
        name || null,
        'open'
      ]
    );

    res.json({ 
      job_id: jobId,
      message: 'Job created successfully. Next: create escrow.'
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// POST /api/jobs/:id/create-escrow - Create escrow for job
router.post('/jobs/:id/create-escrow', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      service_provider,  // employee wallet address
      approver,          // employer wallet address
      receiver,          // employee wallet address (where money goes)
      dispute_resolver,
      deadline,
      token              // USDC contract address
    } = req.body;

    // Get job from database
    const [jobs] = await db.query('SELECT * FROM jobs WHERE id = ?', [id]);
    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobs[0];
    
    // Convert price to stroops (multiply by 10^7 if USDC)
    const amountInStroops = Math.floor(parseFloat(job.price) * 10_000_000).toString();

    // Call Trustless Work API to create escrow
    const { xdr, escrow_id } = await trustlessWork.createEscrow(
      service_provider,
      approver,
      receiver,
      dispute_resolver,
      deadline,
      amountInStroops,
      token
    );

    // Save escrow_id and employee_id to database
    await db.query(
      'UPDATE jobs SET escrow_id = ?, employee_id = ? WHERE id = ?',
      [escrow_id, service_provider, id]
    );

    res.json({ 
      xdr,
      escrow_id,
      message: 'Escrow created. Employer must sign and submit XDR.'
    });
  } catch (error) {
    console.error('Error creating escrow:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/jobs/:id/submit-escrow - Submit signed escrow creation XDR
router.post('/jobs/:id/submit-escrow', async (req, res) => {
  try {
    const { signed_xdr } = req.body;

    if (!signed_xdr) {
      return res.status(400).json({ error: 'Missing signed_xdr' });
    }

    // Submit to Stellar via Trustless Work
    const result = await trustlessWork.submitTransaction(signed_xdr);

    res.json({ 
      success: true,
      result,
      message: 'Escrow deployed on blockchain'
    });
  } catch (error) {
    console.error('Error submitting escrow:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/jobs/:id/claim - Employee (freelancer) claims job
router.post('/jobs/:id/claim', async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id } = req.body;

    if (!employee_id) {
      return res.status(400).json({ error: 'Missing employee_id' });
    }

    // Update job status
    const [result] = await db.query(
      'UPDATE jobs SET employee_id = ?, status = "in_progress", updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = "open"',
      [employee_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'Job not available' });
    }

    res.json({ message: 'Job claimed successfully' });
  } catch (error) {
    console.error('Error claiming job:', error);
    res.status(500).json({ error: 'Failed to claim job' });
  }
});

// POST /api/jobs/:id/submit - Employee submits work
router.post('/jobs/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE jobs SET status = "submitted", updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = "in_progress"',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'Cannot submit this job' });
    }

    res.json({ message: 'Work submitted successfully' });
  } catch (error) {
    console.error('Error submitting work:', error);
    res.status(500).json({ error: 'Failed to submit work' });
  }
});

// POST /api/jobs/:id/approve - Employer approves work
router.post('/jobs/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approver } = req.body;

    // Get job
    const [jobs] = await db.query('SELECT * FROM jobs WHERE id = ?', [id]);
    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobs[0];

    if (!job.escrow_id) {
      return res.status(400).json({ error: 'No escrow for this job' });
    }

    if (job.status !== 'submitted') {
      return res.status(400).json({ error: 'Work not submitted yet' });
    }

    // Call Trustless Work to approve milestone
    const { xdr } = await trustlessWork.approveMilestone(job.escrow_id, approver);

    res.json({ 
      xdr,
      message: 'Approval XDR generated. Employer must sign and submit.'
    });
  } catch (error) {
    console.error('Error approving work:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/jobs/:id/submit-approval - Submit signed approval XDR
router.post('/jobs/:id/submit-approval', async (req, res) => {
  try {
    const { id } = req.params;
    const { signed_xdr } = req.body;

    if (!signed_xdr) {
      return res.status(400).json({ error: 'Missing signed_xdr' });
    }

    // Submit transaction
    const result = await trustlessWork.submitTransaction(signed_xdr);

    // Update job status
    await db.query(
      'UPDATE jobs SET status = "completed", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ 
      success: true,
      result,
      message: 'Work approved on blockchain'
    });
  } catch (error) {
    console.error('Error submitting approval:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/jobs/:id/release - Employee releases funds
router.post('/jobs/:id/release', async (req, res) => {
  try {
    const { id } = req.params;
    const { receiver } = req.body;

    // Get job
    const [jobs] = await db.query('SELECT * FROM jobs WHERE id = ?', [id]);
    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobs[0];

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Work not approved yet' });
    }

    if (!job.escrow_id) {
      return res.status(400).json({ error: 'No escrow for this job' });
    }

    // Call Trustless Work to release funds
    const { xdr } = await trustlessWork.releaseFunds(job.escrow_id, receiver);

    res.json({ 
      xdr,
      message: 'Release XDR generated. Employee must sign and submit.'
    });
  } catch (error) {
    console.error('Error releasing funds:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/jobs/:id/submit-release - Submit signed release XDR
router.post('/jobs/:id/submit-release', async (req, res) => {
  try {
    const { signed_xdr } = req.body;

    if (!signed_xdr) {
      return res.status(400).json({ error: 'Missing signed_xdr' });
    }

    // Submit transaction
    const result = await trustlessWork.submitTransaction(signed_xdr);

    res.json({ 
      success: true,
      result,
      message: 'Funds released successfully'
    });
  } catch (error) {
    console.error('Error submitting release:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/jobs/:id - Cancel/delete job (only if not claimed)
router.delete('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { employer_id } = req.body;

    // Verify job exists and is owned by employer
    const [jobs] = await db.query(
      'SELECT * FROM jobs WHERE id = ? AND employer_id = ?',
      [id, employer_id]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    const job = jobs[0];

    if (job.status !== 'open') {
      return res.status(400).json({ error: 'Can only cancel unclaimed jobs' });
    }

    // Update status to cancelled
    await db.query(
      'UPDATE jobs SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: 'Job cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

module.exports = router;