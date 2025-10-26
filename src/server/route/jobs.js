import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import trustlessWork from '../services/trustlessWork.js';

const createJobsRouter = (db) => {
  const router = express.Router();

// GET /api/jobs - Get all jobs
router.get('/jobs', async (req, res) => {
  try {
    const [jobs] = await db.query(
      'SELECT * FROM jobs ORDER BY created_at DESC'
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

    console.log('POST /jobs - Received data:', req.body);
    console.log('employer_id:', employer_id, typeof employer_id);
    console.log('title:', title);
    console.log('description:', description);
    console.log('price:', price);
    console.log('currency:', currency);
    console.log('tags:', tags);
    console.log('name:', name);

    // Validate input
    if (!employer_id || !title || !description || !price || !currency) {
      console.log('Missing required fields - employer_id:', !!employer_id, 'title:', !!title, 'description:', !!description, 'price:', !!price, 'currency:', !!currency);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert employer_id to integer if it's a string
    const employerIdInt = parseInt(employer_id, 10);
    
    if (isNaN(employerIdInt)) {
      return res.status(400).json({ error: 'Invalid employer_id format' });
    }

    // Generate UUID for job
    const jobId = uuidv4();

    // Insert job into database
    await db.query(
      `INSERT INTO jobs 
       (id, employer_id, title, description, tags, price, currency, employer_name, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        jobId,
        employerIdInt,
        title,
        description,
        JSON.stringify(tags || []),
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

    // Get job details to send notification to employer and create conversation
    const [jobs] = await db.query(
      'SELECT title, employer_id FROM jobs WHERE id = ?',
      [id]
    );

    if (jobs.length > 0) {
      const job = jobs[0];
      const employerId = job.employer_id;
      const jobTitle = job.title;

      // Create notification for the employer
      const notificationId = uuidv4();
      await db.query(
        'INSERT INTO notifications (id, user_id, message, type, `read`) VALUES (?, ?, ?, ?, ?)',
        [
          notificationId,
          employerId,
          `Your job "${jobTitle}" has been claimed!`,
          'job_claim',
          0
        ]
      );

      // Create conversation between employer and employee
      const conversationId = uuidv4();
      await db.query(
        'INSERT INTO conversations (id, recipient1, recipient2) VALUES (?, ?, ?)',
        [conversationId, employerId, employee_id]
      );

      // Create initial message from employee to employer
      const messageId = uuidv4();
      const initialMessage = `Hi! I'm interested in your job "${jobTitle}". I'd love to discuss the details and get started on this project.`;
      
      await db.query(
        'INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)',
        [messageId, conversationId, employee_id, initialMessage]
      );
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

// PUT /api/jobs/:id/submit - Employee submits work (same functionality, different method)
router.put('/jobs/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id } = req.body;

    // First get the job to find the employer and verify employee owns it
    const [jobRows] = await db.query(
      'SELECT employer_id, title, status, employee_id FROM jobs WHERE id = ?',
      [id]
    );

    if (jobRows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobRows[0];

    // Verify the employee owns this job
    if (parseInt(job.employee_id) !== parseInt(employee_id)) {
      return res.status(403).json({ error: "You don't have permission to submit this job" });
    }

    // Update job status to submitted
    const [result] = await db.query(
      'UPDATE jobs SET status = "submitted", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'Failed to update job status' });
    }

    // Find conversation between employer and employee
    const [conversations] = await db.query(
      'SELECT id FROM conversations WHERE (recipient1 = ? AND recipient2 = ?) OR (recipient1 = ? AND recipient2 = ?)',
      [job.employer_id, employee_id, employee_id, job.employer_id]
    );

    if (conversations.length > 0) {
      const conversationId = conversations[0].id;
      
      // Send message to employer
      const messageId = uuidv4();
      const messageContent = 'The product has been submitted and is ready for review.';
      
      await db.query(
        'INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)',
        [messageId, conversationId, employee_id, messageContent]
      );
    }

    res.json({ message: 'Job submitted successfully' });
  } catch (error) {
    console.error('Error submitting job:', error);
    res.status(500).json({ error: 'Failed to submit job' });
  }
});

// PUT /api/jobs/:id/verify - Employer verifies work
router.put('/jobs/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { employer_id } = req.body;

    // First get the job to verify ownership
    const [jobRows] = await db.query(
      'SELECT employer_id, status FROM jobs WHERE id = ?',
      [id]
    );

    if (jobRows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobRows[0];

    // Verify the employer owns this job
    if (parseInt(job.employer_id) !== parseInt(employer_id)) {
      return res.status(403).json({ error: "You don't have permission to verify this job" });
    }

    // Update job status to completed
    const [result] = await db.query(
      'UPDATE jobs SET status = "completed", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'Failed to update job status' });
    }

    // Call handlePayment function (placeholder for now)
    // TODO: Implement payment logic here
    console.log('Job verified, payment should be processed now');

    res.json({ message: 'Job verified successfully' });
  } catch (error) {
    console.error('Error verifying job:', error);
    res.status(500).json({ error: 'Failed to verify job' });
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

// DELETE /api/jobs/:id - Delete job (only if not claimed)
router.delete('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { employer_id } = req.body;

    console.log('Delete request - Job ID:', id);
    console.log('Delete request - Employer ID:', employer_id);
    console.log('Delete request - Employer ID type:', typeof employer_id);

    // Convert employer_id to integer if it's a string
    const employerIdInt = parseInt(employer_id, 10);
    
    console.log('Parsed employer ID:', employerIdInt);
    
    if (isNaN(employerIdInt)) {
      console.log('Invalid employer_id format');
      return res.status(400).json({ error: 'Invalid employer_id format' });
    }

    // Verify job exists and is owned by employer
    const [jobs] = await db.query(
      'SELECT * FROM jobs WHERE id = ? AND employer_id = ?',
      [id, employerIdInt]
    );

    console.log('Found jobs:', jobs.length);

    if (jobs.length === 0) {
      console.log('Job not found or unauthorized');
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    const job = jobs[0];
    console.log('Job status:', job.status);

    if (job.status !== 'open') {
      console.log('Job is not open, cannot delete');
      return res.status(400).json({ error: 'Can only delete unclaimed jobs' });
    }

    // Actually delete the job from database
    console.log('Deleting job from database...');
    await db.query('DELETE FROM jobs WHERE id = ?', [id]);
    console.log('Job deleted successfully');

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// PUT /api/jobs/:id/claim - Employee (freelancer) claims job
router.put('/jobs/:id/claim', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, claimed_by } = req.body;

    if (!claimed_by) {
      return res.status(400).json({ error: 'Missing claimed_by' });
    }

    // Convert claimed_by to integer if it's a string
    const claimedByIdInt = parseInt(claimed_by, 10);
    
    if (isNaN(claimedByIdInt)) {
      return res.status(400).json({ error: 'Invalid claimed_by format' });
    }

    // Update job status
    const [result] = await db.query(
      'UPDATE jobs SET employee_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = "open"',
      [claimedByIdInt, status || 'in_progress', id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'Job not available' });
    }

    // Get job details to send notification to employer and create conversation
    const [jobs] = await db.query(
      'SELECT title, employer_id FROM jobs WHERE id = ?',
      [id]
    );

    if (jobs.length > 0) {
      const job = jobs[0];
      const employerId = job.employer_id;
      const jobTitle = job.title;

      // Create notification for the employer
      const notificationId = uuidv4();
      await db.query(
        'INSERT INTO notifications (id, user_id, message, type, `read`) VALUES (?, ?, ?, ?, ?)',
        [
          notificationId,
          employerId,
          `Your job "${jobTitle}" has been claimed!`,
          'job_claim',
          0
        ]
      );

      // Create conversation between employer and employee
      const conversationId = uuidv4();
      await db.query(
        'INSERT INTO conversations (id, recipient1, recipient2) VALUES (?, ?, ?)',
        [conversationId, employerId, claimedByIdInt]
      );

      // Create initial message from employee to employer
      const messageId = uuidv4();
      const initialMessage = `Hi! I'm interested in your job "${jobTitle}". I'd love to discuss the details and get started on this project.`;
      
      await db.query(
        'INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)',
        [messageId, conversationId, claimedByIdInt, initialMessage]
      );
    }

    res.json({ message: 'Job claimed successfully' });
  } catch (error) {
    console.error('Error claiming job:', error);
    res.status(500).json({ error: 'Failed to claim job' });
  }
});

  return router;
};

export default createJobsRouter;