// ===== TIPPING ENDPOINTS =====

// POST /api/tips - Send tip (returns XDR)
router.post('/tips', async (req, res) => {
  try {
    const { job_id, from, to, token, amount, message } = req.body;
    
    if (!from || !to || !token || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    
    const { xdr } = await customContracts.sendTip(
      job_id || '',  // Optional job_id
      from,
      to,
      token,
      amount,
      message || ''
    );
    
    res.json({
      xdr,
      message: 'Tip XDR generated. Sign with Freighter and submit.'
    });
  } catch (error) {
    console.error('Error creating tip:', error);
    res.status(500).json({ error: error.message || 'Failed to create tip' });
  }
});

// POST /api/tips/submit - Submit signed tip transaction
router.post('/tips/submit', async (req, res) => {
  try {
    const { signed_xdr } = req.body;
    
    if (!signed_xdr) {
      return res.status(400).json({ error: 'Missing signed_xdr' });
    }
    
    const result = await customContracts.submitTransaction(signed_xdr);
    
    res.json({
      success: true,
      result,
      message: 'Tip sent successfully!'
    });
  } catch (error) {
    console.error('Error submitting tip:', error);
    res.status(500).json({ error: error.message || 'Failed to submit tip' });
  }
});

// GET /api/tips/received/:address - Get tips received by user
router.get('/tips/received/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const tips = await customContracts.getTipsReceived(address);
    res.json(tips);
  } catch (error) {
    console.error('Error fetching tips:', error);
    res.status(500).json({ error: 'Failed to fetch tips' });
  }
});

// GET /api/tips/total/:address - Get total tips received
router.get('/tips/total/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const total = await customContracts.getTotalTipsReceived(address);
    res.json({ total: total.toString() });
  } catch (error) {
    console.error('Error fetching total tips:', error);
    res.status(500).json({ error: 'Failed to fetch total tips' });
  }
});

// ===== REVIEW ENDPOINTS =====

// POST /api/reviews - Leave review (returns XDR)
router.post('/reviews', async (req, res) => {
  try {
    const { job_id, reviewer, reviewee, rating, comment } = req.body;
    
    if (!job_id || !reviewer || !reviewee || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Check if already reviewed
    const alreadyReviewed = await customContracts.hasReviewedJob(job_id, reviewer);
    if (alreadyReviewed) {
      return res.status(400).json({ error: 'Already reviewed this job' });
    }
    
    const { xdr } = await customContracts.leaveReview(
      job_id,
      reviewer,
      reviewee,
      ratingNum,
      comment || ''
    );
    
    res.json({
      xdr,
      message: 'Review XDR generated. Sign with Freighter and submit.'
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: error.message || 'Failed to create review' });
  }
});

// POST /api/reviews/submit - Submit signed review transaction
router.post('/reviews/submit', async (req, res) => {
  try {
    const { signed_xdr } = req.body;
    
    if (!signed_xdr) {
      return res.status(400).json({ error: 'Missing signed_xdr' });
    }
    
    const result = await customContracts.submitTransaction(signed_xdr);
    
    res.json({
      success: true,
      result,
      message: 'Review posted successfully!'
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: error.message || 'Failed to submit review' });
  }
});

// GET /api/reviews/:address - Get all reviews for user
router.get('/reviews/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const reviews = await customContracts.getUserReviews(address);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/reviews/:address/rating - Get average rating for user
router.get('/reviews/:address/rating', async (req, res) => {
  try {
    const { address } = req.params;
    const rating = await customContracts.getAverageRating(address);
    const count = await customContracts.getReviewCount(address);
    
    res.json({
      average_rating: rating,
      review_count: count
    });
  } catch (error) {
    console.error('Error fetching rating:', error);
    res.status(500).json({ error: 'Failed to fetch rating' });
  }
});

// GET /api/reviews/check/:jobId/:reviewer - Check if already reviewed
router.get('/reviews/check/:jobId/:reviewer', async (req, res) => {
  try {
    const { jobId, reviewer } = req.params;
    const hasReviewed = await customContracts.hasReviewedJob(jobId, reviewer);
    res.json({ has_reviewed: hasReviewed });
  } catch (error) {
    console.error('Error checking review status:', error);
    res.status(500).json({ error: 'Failed to check review status' });
  }
});

module.exports = router;