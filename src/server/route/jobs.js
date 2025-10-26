import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import trustlessWork from '../services/trustlessWork.js';
import stellarPayment from '../services/stellarPayment.js';
import * as sorobanReviews from '../services/sorobanReviews.js';
import dotenv from 'dotenv';

dotenv.config();

const NETWORK_PASSPHRASE = process.env.NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';

const createJobsRouter = (db) => {
  const router = express.Router();
  
  // Log all requests
  router.use((req, res, next) => {
    console.log('📥 REQUEST:', req.method, req.path);
    next();
  });

// GET /api/jobs - Get all jobs
router.get('/jobs', async (req, res) => {
  try {
    const [jobs] = await db.execute(
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
    const [jobs] = await db.execute(
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
    const [jobs] = await db.execute(
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
    const [jobs] = await db.execute('SELECT * FROM jobs WHERE id = ?', [id]);
    
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
      name,
      employerWalletId
    } = req.body;

    console.log('=== POST /api/jobs RECEIVED ===');
    console.log('Full body:', JSON.stringify(req.body, null, 2));
    console.log('employer_id:', employer_id, typeof employer_id);
    console.log('title:', title);
    console.log('description:', description);
    console.log('price:', price, typeof price);
    console.log('currency:', currency);
    console.log('tags:', tags);
    console.log('name:', name);

    // Validate input
    if (!employer_id || !title || !description || !price || !currency) {
      console.log('❌ VALIDATION FAILED');
      console.log('Missing fields - employer_id:', !!employer_id, 'title:', !!title, 'description:', !!description, 'price:', !!price, 'currency:', !!currency);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert employer_id to integer if it's a string
    const employerIdInt = parseInt(employer_id, 10);
    
    if (isNaN(employerIdInt)) {
      console.log('❌ Invalid employer_id:', employer_id);
      return res.status(400).json({ error: 'Invalid employer_id format' });
    }

    // Generate UUID for job
    const jobId = uuidv4();
    console.log('Creating job with ID:', jobId);

    try {
      // Insert job into database
      const result = await db.execute(
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
      console.log('✅ Job inserted successfully');
      
      res.json({ 
        job_id: jobId,
        message: 'Job created successfully. Next: create escrow.'
      });
    } catch (dbError) {
      console.error('❌ DATABASE ERROR:', dbError.message);
      console.error('Stack:', dbError.stack);
      throw dbError;
    }
  } catch (error) {
    console.error('Error creating job:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create job',
      details: error.message 
    });
  }
});

// POST /api/jobs/:id/claim - Employee (freelancer) claims job
router.post('/jobs/:id/claim', async (req, res) => {
  console.log('=== CLAIM REQUEST RECEIVED ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  try {
    const { id } = req.params;
    const { employee_id } = req.body;
    console.log('Job ID:', id);
    console.log('Employee ID:', employee_id);

    if (!employee_id) {
      return res.status(400).json({ error: 'Missing employee_id' });
    }

    // Get job details first
    console.log('Fetching job from database...');
    const [jobs] = await db.execute(
      'SELECT * FROM jobs WHERE id = ?',
      [id]
    );
    console.log('Found', jobs.length, 'job(s)');

    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobs[0];
    console.log('Job status:', job.status);
    console.log('Job employer_id:', job.employer_id);

    // Update job status and employee
    const [result] = await db.execute(
      'UPDATE jobs SET employee_id = ?, status = "in_progress", updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = "open"',
      [employee_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'Job not available' });
    }

    const employerId = job.employer_id;
    const jobTitle = job.title;

    // Create escrow when job is claimed (to lock in the payment)
    console.log('=== CLAIM ENDPOINT - Starting escrow creation ===');
    console.log('Employer ID:', employerId);
    console.log('Employee ID:', employee_id);
    try {
      // Get wallets
      const [employerWallets] = await db.execute(
        'SELECT address FROM wallets WHERE user_id = ? LIMIT 1',
        [employerId]
      );
      console.log('Employer wallets found:', employerWallets.length);
      
      const [employeeWallets] = await db.execute(
        'SELECT address FROM wallets WHERE user_id = ? LIMIT 1',
        [employee_id]
      );
      console.log('Employee wallets found:', employeeWallets.length);
      
      if (employerWallets.length > 0 && employeeWallets.length > 0) {
        console.log('Both parties have wallets, creating escrow...');
        console.log('Employer wallet:', employerWallets[0].address);
        console.log('Employee wallet:', employeeWallets[0].address);
        const token = process.env.TOKEN_CONTRACT || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
        const deadline = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
        const amountInStroops = Math.floor(parseFloat(job.price) * 10_000_000).toString();
        
        console.log('=== CREATING ESCROW ===');
        console.log('Token:', token);
        console.log('Deadline:', deadline);
        console.log('Amount (stroops):', amountInStroops);
        console.log('Job price:', job.price);
        
        console.log('Calling trustlessWork.createEscrow...');
        // Create escrow to lock in payment
        const { xdr: escrowXDR, escrow_id } = await trustlessWork.createEscrow(
          employeeWallets[0].address,
          employerWallets[0].address,
          employeeWallets[0].address,
          employerWallets[0].address,
          deadline,
          amountInStroops,
          token
        );
        console.log('✅ Escrow XDR received, escrow_id:', escrow_id);

        // Store escrow_id
        await db.execute(
          'UPDATE jobs SET escrow_id = ? WHERE id = ?',
          [escrow_id, id]
        );
        
        console.log('Escrow created on claim:', escrow_id);
      } else {
        console.log('❌ Missing wallets - employer:', employerWallets.length, 'employee:', employeeWallets.length);
      }
    } catch (escrowError) {
      console.error('ERROR creating escrow on claim:', escrowError);
      console.error('Error details:', escrowError.message);
      console.error('Error stack:', escrowError.stack);
      // Continue anyway - escrow can be created later
    }
    console.log('=== CLAIM ENDPOINT - Finished escrow creation ===');

    // Check if conversation already exists to avoid duplicates
    const [existingConversations] = await db.execute(
      'SELECT id FROM conversations WHERE (recipient1 = ? AND recipient2 = ?) OR (recipient1 = ? AND recipient2 = ?)',
      [employerId, employee_id, employee_id, employerId]
    );
    
    if (existingConversations.length === 0) {
      // Only create conversation if it doesn't exist
      const conversationId = uuidv4();
      await db.execute(
        'INSERT INTO conversations (id, recipient1, recipient2) VALUES (?, ?, ?)',
        [conversationId, employerId, employee_id]
      );

      // Create initial message from employee to employer
      const messageId = uuidv4();
      const initialMessage = `Hi! I'm interested in your job "${jobTitle}". I'd love to discuss the details and get started on this project.`;
      
      await db.execute(
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

    const [result] = await db.execute(
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

// POST /api/jobs/:id/approve - Employer approves work and triggers payment
router.post('/jobs/:id/approve', async (req, res) => {
  try {
    console.log('=== APPROVE ENDPOINT CALLED ===');
    const { id } = req.params;
    const { approver } = req.body;
    console.log('Job ID:', id);
    console.log('Approver:', approver);

    // Get job
    const [jobs] = await db.execute('SELECT * FROM jobs WHERE id = ?', [id]);
    console.log('Jobs query result:', jobs.length);
    
    if (jobs.length === 0) {
      console.log('Job not found');
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobs[0];
    console.log('Job status:', job.status);
    console.log('Job escrow_id:', job.escrow_id);
    console.log('Job employer_id:', job.employer_id);
    console.log('Job employee_id:', job.employee_id);

    if (job.status !== 'submitted') {
      console.log('Work not submitted yet');
      return res.status(400).json({ error: 'Work not submitted yet' });
    }

    // Check if employee is assigned
    if (!job.employee_id) {
      console.log('No employee assigned to job');
      return res.status(400).json({ error: 'No employee assigned to this job' });
    }

    console.log('Proceeding with blockchain payment');
    
    // Get employer's wallet
    const [employerWallets] = await db.execute(
      'SELECT address FROM wallets WHERE user_id = ? LIMIT 1',
      [job.employer_id]
    );
    console.log('Employer wallets:', employerWallets.length);
    
    if (employerWallets.length === 0) {
      console.log('Missing employer wallet - approving without payment');
      // Approve without payment if no wallet
      await db.execute(
        'UPDATE jobs SET status = "completed", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      
      const notificationId = uuidv4();
      await db.execute(
        'INSERT INTO notifications (id, user_id, message, type, `read`) VALUES (?, ?, ?, ?, ?)',
        [notificationId, job.employee_id, `Your job "${job.title}" has been verified!`, 'job_approved', 0]
      );
      
      return res.json({ 
        success: true,
        message: 'Work approved (no wallet configured for payment)'
      });
    }
    
    // Get employee's wallet
    const [employeeWallets] = await db.execute(
      'SELECT address FROM wallets WHERE user_id = ? LIMIT 1',
      [job.employee_id]
    );
    console.log('Employee wallets:', employeeWallets.length);
    
    if (employeeWallets.length === 0) {
      console.log('Missing employee wallet - approving without payment');
      // Approve without payment if no wallet
      await db.execute(
        'UPDATE jobs SET status = "completed", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      
      const notificationId = uuidv4();
      await db.execute(
        'INSERT INTO notifications (id, user_id, message, type, `read`) VALUES (?, ?, ?, ?, ?)',
        [notificationId, job.employee_id, `Your job "${job.title}" has been verified!`, 'job_approved', 0]
      );
      
      return res.json({ 
        success: true,
        message: 'Work approved (employee wallet not configured)'
      });
    }
    
    const employerWallet = employerWallets[0].address;
    const employeeWallet = employeeWallets[0].address;
    console.log('Employer wallet:', employerWallet);
    console.log('Employee wallet:', employeeWallet);

    // Use stored payment reservation or generate new one
    try {
      console.log('=== PROCESSING PAYMENT APPROVAL ===');
      
      let paymentXDR = null;
      
      if (job.payment_reservation) {
        // Check if it's a simple XDR string or JSON
        try {
          const parsed = JSON.parse(job.payment_reservation);
          paymentXDR = parsed.paymentXDR || job.payment_reservation;
        } catch {
          // It's already a string XDR
          paymentXDR = job.payment_reservation;
        }
        console.log('✅ Using stored payment reservation');
      } else {
        console.log('⚠️ No payment reservation found - generating new payment');
        // Generate new payment if reservation doesn't exist (backwards compatibility)
        const paymentData = await stellarPayment.generateApprovalPayment(
          job.id,
          employerWallet,
          employeeWallet,
          job.price
        );
        paymentXDR = paymentData.paymentXDR;
      }
      
      console.log('Payment ready for signing with Freighter');
      
      // Update job status to completed
      await db.execute(
        'UPDATE jobs SET status = "completed", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      
      // Clear payment reservation (it will be submitted)
      await db.execute(
        'UPDATE jobs SET payment_reservation = NULL WHERE id = ?',
        [id]
      );
      
      // Send notification to employee
      const notificationId = uuidv4();
      await db.execute(
        'INSERT INTO notifications (id, user_id, message, type, `read`) VALUES (?, ?, ?, ?, ?)',
        [
          notificationId,
          job.employee_id,
          `Your job "${job.title}" has been verified!`,
          'job_approved',
          0
        ]
      );
      
      console.log('=== PAYMENT READY FOR SIGNING ===');
      res.json({ 
        success: true,
        message: 'Work approved. Sign the payment transaction to complete payment.',
        xdrs: {
          payment: paymentXDR
        },
        amount: job.price,
        from: employerWallet,
        to: employeeWallet,
        network: 'TESTNET'
      });
    } catch (paymentError) {
      console.error('Error processing payment:', paymentError);
      console.error('Error details:', paymentError.message);
      console.error('Error stack:', paymentError.stack);
      
      // Fallback: mark as completed even if payment generation fails
      await db.execute(
        'UPDATE jobs SET status = "completed", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      
      const notificationId = uuidv4();
      await db.execute(
        'INSERT INTO notifications (id, user_id, message, type, `read`) VALUES (?, ?, ?, ?, ?)',
        [
          notificationId,
          job.employee_id,
          `Your job "${job.title}" has been verified!`,
          'job_approved',
          0
        ]
      );
      
      return res.status(500).json({ 
        error: 'Failed to generate payment: ' + paymentError.message,
        message: 'Work approved but payment generation failed. Please contact support.'
      });
    }
  } catch (error) {
    console.error('Error in approve endpoint:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/jobs/:id/withdraw - Employer cancels job and withdraws payment
router.post('/jobs/:id/withdraw', async (req, res) => {
  try {
    console.log('=== WITHDRAW ENDPOINT CALLED ===');
    const { id } = req.params;
    const { employer_id } = req.body;
    
    console.log('Job ID:', id);
    console.log('Employer ID:', employer_id);

    // Get job
    const [jobs] = await db.execute('SELECT * FROM jobs WHERE id = ?', [id]);
    
    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobs[0];
    
    // Verify employer owns this job
    if (String(job.employer_id) !== String(employer_id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Can only withdraw if job is in_progress or submitted (before completion)
    if (job.status === 'completed') {
      return res.status(400).json({ error: 'Cannot withdraw - job already completed' });
    }
    
    if (job.status === 'open') {
      return res.status(400).json({ error: 'Cannot withdraw - job not claimed yet' });
    }
    
    console.log('Processing withdrawal (canceling payment reservation)');
    
    // Clear payment reservation (this is the "withdrawal")
    await db.execute(
      'UPDATE jobs SET payment_reservation = NULL, status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    // Notify employee
    if (job.employee_id) {
      const notificationId = uuidv4();
      await db.execute(
        'INSERT INTO notifications (id, user_id, message, type, `read`) VALUES (?, ?, ?, ?, ?)',
        [
          notificationId,
          job.employee_id,
          `Job "${job.title}" has been cancelled by employer.`,
          'job_cancelled',
          0
        ]
      );
    }
    
    console.log('✅ Payment reservation cleared - funds remain in employer wallet');
    
    res.json({ 
      success: true,
      message: 'Job cancelled. Payment reservation withdrawn. Funds remain in your wallet.'
    });
  } catch (error) {
    console.error('Error withdrawing:', error);
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
    await db.execute(
      'UPDATE jobs SET status = "completed", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    // Get job
    const [jobs] = await db.execute('SELECT * FROM jobs WHERE id = ?', [id]);

    if (jobs.length > 0) {
      const job = jobs[0];
      
      // Send notification to employee
      const notificationId = uuidv4();
      await db.execute(
        'INSERT INTO notifications (id, user_id, message, type, `read`) VALUES (?, ?, ?, ?, ?)',
        [
          notificationId,
          job.employee_id,
          `Your job "${job.title}" has been verified and payment is being processed!`,
          'job_approved',
          0
        ]
      );

      if (job.escrow_id) {
        // Get employee's wallet address
        const [employeeWallets] = await db.execute(
          'SELECT address FROM wallets WHERE user_id = ? LIMIT 1',
          [job.employee_id]
        );
        
        if (employeeWallets.length > 0) {
          const employeeWalletAddress = employeeWallets[0].address;
          
          // Automatically trigger release of funds
          try {
            const { xdr: releaseXDR } = await trustlessWork.releaseFunds(job.escrow_id, employeeWalletAddress);
            return res.json({ 
              success: true,
              result,
              release_xdr: releaseXDR,
              message: 'Work approved. Please submit release XDR to complete payment.'
            });
          } catch (releaseError) {
            console.error('Error releasing funds:', releaseError);
            return res.json({ 
              success: true,
              result,
              message: 'Work approved on blockchain. Release failed: ' + releaseError.message
            });
          }
        }
      }
    }

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
    const [jobs] = await db.execute('SELECT * FROM jobs WHERE id = ?', [id]);
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
    const [jobs] = await db.execute(
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
    await db.execute('DELETE FROM jobs WHERE id = ?', [id]);
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

    // Get the full job details BEFORE updating status
    const [jobData] = await db.execute(
      'SELECT * FROM jobs WHERE id = ?',
      [id]
    );
    
    if (jobData.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const job = jobData[0];
    const employerId = job.employer_id;

    // Update job status
    const [result] = await db.execute(
      'UPDATE jobs SET employee_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = "open"',
      [claimedByIdInt, status || 'in_progress', id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'Job not available' });
    }

    // RESERVE PAYMENT (Simple payment reservation)
    console.log('=== RESERVING PAYMENT ===');
    try {
      // Get employer and employee wallets
      const [employerWallets] = await db.execute(
        'SELECT address FROM wallets WHERE user_id = ? LIMIT 1',
        [employerId]
      );
      
      const [employeeWallets] = await db.execute(
        'SELECT address FROM wallets WHERE user_id = ? LIMIT 1',
        [claimedByIdInt]
      );
      
      if (employerWallets.length > 0 && employeeWallets.length > 0) {
        console.log('Creating payment reservation (simple escrow)...');
        
        // Generate simple payment XDR (not submitted yet - this is the reservation)
        const paymentData = await stellarPayment.generateApprovalPayment(
          id, // job ID
          employerWallets[0].address, // from
          employeeWallets[0].address, // to
          job.price // amount
        );
        
        console.log('✅ Payment reservation created');
        console.log('Payment will be held until employer approves work');
        
        // Store the payment XDR in database (this is the simple escrow)
        await db.execute(
          'UPDATE jobs SET payment_reservation = ? WHERE id = ?',
          [paymentData.paymentXDR, id]
        );
        
        console.log('Payment reservation stored in database');
      } else {
        console.log('⚠️ Cannot create payment reservation - missing wallets');
      }
    } catch (reservationError) {
      console.error('❌ Error creating payment reservation:', reservationError.message);
      // Continue anyway - job is still claimed
    }
    
    console.log('Job claimed successfully. Payment is reserved.');


    // Get job details to send notification to employer and create conversation
    const [jobs] = await db.execute(
      'SELECT title, employer_id FROM jobs WHERE id = ?',
      [id]
    );

    if (jobs.length > 0) {
      const job = jobs[0];
      const employerId = job.employer_id;
      const jobTitle = job.title;

      // Create notification for the employer
      const notificationId = uuidv4();
      await db.execute(
        'INSERT INTO notifications (id, user_id, message, type, `read`) VALUES (?, ?, ?, ?, ?)',
        [
          notificationId,
          employerId,
          `Your job "${jobTitle}" has been claimed!`,
          'job_claim',
          0
        ]
      );

      // Check if conversation already exists
      const [existingConversations] = await db.execute(
        'SELECT id FROM conversations WHERE (recipient1 = ? AND recipient2 = ?) OR (recipient1 = ? AND recipient2 = ?)',
        [employerId, claimedByIdInt, claimedByIdInt, employerId]
      );
      
      if (existingConversations.length === 0) {
        // Only create conversation if it doesn't exist
        const conversationId = uuidv4();
        await db.execute(
          'INSERT INTO conversations (id, recipient1, recipient2) VALUES (?, ?, ?)',
          [conversationId, employerId, claimedByIdInt]
        );

        // Create initial message from employee to employer
        const messageId = uuidv4();
        const initialMessage = `Hi! I'm interested in your job "${jobTitle}". I'd love to discuss the details and get started on this project.`;
        
        await db.execute(
          'INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)',
          [messageId, conversationId, claimedByIdInt, initialMessage]
        );
      }
    }

    res.json({ message: 'Job claimed successfully' });
  } catch (error) {
    console.error('Error claiming job:', error);
    res.status(500).json({ error: 'Failed to claim job' });
  }
});

// POST /api/jobs/submit-xdr - Submit signed XDR to blockchain
router.post('/jobs/submit-xdr', async (req, res) => {
  try {
    const { signed_xdr } = req.body;

    if (!signed_xdr) {
      return res.status(400).json({ error: 'Missing signed_xdr' });
    }

    console.log('=== RECEIVED SIGNED XDR FROM FRONTEND ===');
    console.log('XDR length:', signed_xdr.length);
    console.log('XDR (first 100 chars):', signed_xdr.substring(0, 100));
    
    // Submit transaction directly to Stellar network using Stellar SDK
    console.log('Submitting transaction to Stellar network...');
    const result = await stellarPayment.submitTransaction(signed_xdr);
    
    console.log('✅ Transaction submitted successfully');
    console.log('Transaction hash:', result.hash);
    
    res.json({ 
      success: true,
      hash: result.hash,
      result
    });
  } catch (error) {
    console.error('❌ Error submitting XDR to Stellar network:', error);
    console.error('Error details:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to submit transaction to Stellar network'
    });
  }
});

// REVIEW ENDPOINTS
// These endpoints use the Soroban Reviews Contract deployed on Stellar

// POST /jobs/:id/review - Create a review using Soroban contract
router.post('/jobs/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewer_id, rating, comment } = req.body;

    console.log('=== POST /jobs/:id/review ===');
    console.log('Job ID:', id);
    console.log('Reviewer ID:', reviewer_id);
    console.log('Rating:', rating);
    console.log('Comment:', comment);

    if (!reviewer_id || !rating) {
      return res.status(400).json({ error: 'reviewer_id and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Get the job to determine who is reviewing whom
    const [jobs] = await db.execute('SELECT * FROM jobs WHERE id = ?', [id]);
    
    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobs[0];

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed jobs' });
    }

    // Determine the reviewer and reviewee IDs
    let revieweeId;

    if (String(job.employer_id) === String(reviewer_id)) {
      revieweeId = job.employee_id;
    } else if (String(job.employee_id) === String(reviewer_id)) {
      revieweeId = job.employer_id;
    } else {
      return res.status(403).json({ error: 'Unauthorized to review this job' });
    }

    if (!revieweeId) {
      return res.status(400).json({ error: 'No reviewee found for this job' });
    }

    // Get wallet addresses for reviewer and reviewee
    const [reviewerWallets] = await db.execute(
      'SELECT address FROM wallets WHERE user_id = ? LIMIT 1',
      [reviewer_id]
    );
    
    const [revieweeWallets] = await db.execute(
      'SELECT address FROM wallets WHERE user_id = ? LIMIT 1',
      [revieweeId]
    );

    if (reviewerWallets.length === 0 || revieweeWallets.length === 0) {
      return res.status(400).json({ error: 'Wallet not found for reviewer or reviewee' });
    }

    const reviewerAddress = reviewerWallets[0].address;
    const revieweeAddress = revieweeWallets[0].address;

    console.log('Reviewer address:', reviewerAddress);
    console.log('Reviewee address:', revieweeAddress);

    // Generate XDR for blockchain submission
    const xdrData = await sorobanReviews.generateReviewXDR(
      reviewerAddress,
      revieweeAddress,
      id,
      rating,
      comment || ''
    );

    console.log('✅ XDR generated for blockchain review submission');
    
    res.json({
      success: true,
      needs_signing: true,
      xdr_data: xdrData,
      message: 'Review data ready for blockchain submission. Please sign with Freighter.'
    });
  } catch (error) {
    console.error('Error preparing review:', error);
    res.status(500).json({ error: 'Failed to prepare review: ' + error.message });
  }
});

// GET /users/:id/reviews - Get reviews for a user from Soroban contract
router.get('/users/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user's wallet address
    const [wallets] = await db.execute(
      'SELECT address FROM wallets WHERE user_id = ? LIMIT 1',
      [id]
    );

    if (wallets.length === 0) {
      return res.json([]);
    }

    const userAddress = wallets[0].address;

    // Query Soroban contract for reviews
    const reviews = await sorobanReviews.getUserReviews(userAddress);

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews from contract' });
  }
});

// GET /users/:id/average-rating - Get average rating from Soroban contract
router.get('/users/:id/average-rating', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user's wallet address
    const [wallets] = await db.execute(
      'SELECT address FROM wallets WHERE user_id = ? LIMIT 1',
      [id]
    );

    if (wallets.length === 0) {
      return res.json({
        average_rating: 0,
        total_reviews: 0,
        user_address: null
      });
    }

    const userAddress = wallets[0].address;

    // Query Soroban contract for average rating
    const ratingData = await sorobanReviews.getUserAverageRating(userAddress);

    res.json(ratingData);
  } catch (error) {
    console.error('Error fetching average rating:', error);
    res.status(500).json({ error: 'Failed to fetch rating from contract' });
  }
});

  return router;
};

export default createJobsRouter;