import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';
import { convertAndFormatCurrency, Currency } from '../utils/currencyConversion';
import { signAndSubmitTransaction, checkFreighterAvailable } from '../utils/freighterSigning';
import Header from '../components/Header';
import ConfirmationAlert from '../components/ConfirmationAlert';
import DeleteConfirmationAlert from '../components/DeleteConfirmationAlert';
import ReviewModal from '../components/ReviewModal';

interface Job {
  id: string;
  title: string;
  description: string;
  price: number | string;
  currency: string;
  tags: string[];
  status: string;
  created_at: string;
  employer_id: string;
  employee_id?: string;
  employer_name?: string;
  escrow_id?: string;
}

const JobDetails: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { currentUser } = useAuth();
  const { userCurrency } = useCurrency();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ name: string; role: 'employer' | 'employee'; id: string } | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchJob(jobId);
    }
  }, [jobId]);

  const fetchJob = async (id: string) => {
    try {
      const response = await fetch('http://localhost:3002/api/jobs');
      const data = await response.json();
      const foundJob = data.find((j: Job) => j.id === id);
      setJob(foundJob || null);
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimClick = () => {
    // Check if user is logged in
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setShowConfirmation(true);
  };

  const handleConfirmClaim = async () => {
    if (job) {
      try {
        // Optimistically update the UI immediately
        setJob(prevJob => prevJob ? { ...prevJob, status: 'in_progress' } : null);
        
        // Close the confirmation dialog
        setShowConfirmation(false);

        // Update job status to in_progress on server
        console.log('=== FRONTEND: Calling claim endpoint ===');
        console.log('Job ID:', job.id);
        console.log('Employee ID:', currentUser?.id);
        const claimBody = { employee_id: currentUser?.id };
        console.log('Request body:', claimBody);
        const response = await fetch(`http://localhost:3002/api/jobs/${job.id}/claim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(claimBody)
        });
        console.log('=== FRONTEND: Claim response received ===');
        console.log('Response status:', response.status);
        const responseData = await response.json();
        console.log('Response data:', responseData);

        if (!response.ok) {
          console.error('Failed to claim job');
          // If server request failed, refetch job to restore correct state
          const fetchJob = async () => {
            try {
              const response = await fetch(`http://localhost:3002/api/jobs/${job.id}`);
              if (response.ok) {
                const data = await response.json();
                setJob(data);
              } else {
                console.error('Failed to fetch job');
              }
            } catch (error) {
              console.error('Error fetching job:', error);
            }
          };
          fetchJob();
        }
      } catch (error) {
        console.error('Error claiming job:', error);
        // If there was an error, refetch job to restore correct state
        const fetchJob = async () => {
          try {
            const response = await fetch(`http://localhost:3002/api/jobs/${job.id}`);
            if (response.ok) {
              const data = await response.json();
              setJob(data);
            } else {
              console.error('Failed to fetch job');
            }
          } catch (error) {
            console.error('Error fetching job:', error);
          }
        };
        fetchJob();
      }
    }
  };

  const handleMessageSeller = () => {
    setShowConfirmation(false);
    if (job) {
      // Navigate to messages with job poster info to start new conversation
      navigate('/messages', { 
        state: { 
          startConversationWith: {
            name: job.employer_name || 'Job Poster',
            email: `${job.employer_id}@example.com`, // Using employer_id as fallback
            jobTitle: job.title
          }
        } 
      });
    } else {
      navigate('/messages');
    }
  };

  const handleSubmitWork = async () => {
    if (!job) return;
    
    try {
      // Optimistically update the UI immediately
      setJob(prevJob => prevJob ? { ...prevJob, status: 'submitted' } : null);

      const response = await fetch(`http://localhost:3002/api/jobs/${job.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.error('Failed to submit work');
        // If failed, refetch job to restore state
        const fetchJob = async () => {
          try {
            const response = await fetch('http://localhost:3002/api/jobs');
            const data = await response.json();
            const foundJob = data.find((j: Job) => j.id === job.id);
            setJob(foundJob || null);
          } catch (error) {
            console.error('Error fetching job:', error);
          }
        };
        fetchJob();
      }
    } catch (error) {
      console.error('Error submitting work:', error);
      // Refetch on error
      const fetchJob = async () => {
        try {
          const response = await fetch('http://localhost:3002/api/jobs');
          const data = await response.json();
          const foundJob = data.find((j: Job) => j.id === job.id);
          setJob(foundJob || null);
        } catch (error) {
          console.error('Error fetching job:', error);
        }
      };
      fetchJob();
    }
  };

  const handleApproveWork = async () => {
    if (!job) return;
    
    try {
      // Check if Freighter is available
      const freighterAvailable = await checkFreighterAvailable();
      if (!freighterAvailable) {
        showToast('Freighter wallet required. Please install and connect Freighter.', 'error');
        return;
      }

      showToast('Approving work and preparing payment...', 'info');

      // Call approve endpoint to get XDRs
      const response = await fetch(`http://localhost:3002/api/jobs/${job.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to approve work', 'error');
        return;
      }

      const data = await response.json();
      
      // Check if we have payment XDR to sign and submit
      if (data.xdrs && data.xdrs.payment) {
        showToast('Signing payment transaction with Freighter...', 'info');

        try {
          console.log('Signing and submitting payment XDR...');
          console.log('Amount:', data.amount);
          console.log('From:', data.from);
          console.log('To:', data.to);
          
          const paymentResult = await signAndSubmitTransaction(data.xdrs.payment, 'TESTNET');
          
          if (!paymentResult.success) {
            throw new Error(`Payment failed: ${paymentResult.error}`);
          }
          
          console.log('✅ Payment transaction submitted successfully');
          showToast('Payment sent successfully!', 'success');
          
          // Refresh job status
          const refreshedResponse = await fetch(`http://localhost:3002/api/jobs/${job.id}`);
          if (refreshedResponse.ok) {
            const refreshedData = await refreshedResponse.json();
            setJob(refreshedData);
          } else {
            setJob(prevJob => prevJob ? { ...prevJob, status: 'completed' } : null);
          }
        } catch (signingError: any) {
          console.error('Error signing/submitting payment transaction:', signingError);
          showToast(`Payment error: ${signingError.message}`, 'error');
        }
      } else if (data.success) {
        // Work approved but no payment XDR (no wallet configured)
        showToast('Work approved successfully!', 'success');
        
        // Update job status
        setJob(prevJob => prevJob ? { ...prevJob, status: 'completed' } : null);
      }
    } catch (error) {
      console.error('Error approving work:', error);
      showToast('Error approving work', 'error');
    }
  };

  // Show review modal when job is completed and user hasn't reviewed yet
  useEffect(() => {
    if (!job || job.status !== 'completed' || !currentUser) return;

    // Check if user should review
    const isEmployer = String(job.employer_id) === String(currentUser.id);
    const isEmployee = job.employee_id && String(job.employee_id) === String(currentUser.id);

    if (isEmployee && job.employer_name && !showReviewModal) {
      // Employee reviews employer
      setReviewTarget({
        name: job.employer_name,
        role: 'employer',
        id: job.employer_id
      });
      setShowReviewModal(true);
    } else if (isEmployer && job.employee_id) {
      // Fetch employee name and show review modal
      fetch(`http://localhost:3002/api/users/${job.employee_id}`)
        .then(res => res.json())
        .then(employeeData => {
          if (!showReviewModal) {
            setReviewTarget({
              name: employeeData.name || employeeData.email || 'Employee',
              role: 'employee',
              id: job.employee_id!
            });
            setShowReviewModal(true);
          }
        })
        .catch(err => console.error('Error fetching employee data:', err));
    }
  }, [job?.status, currentUser, job?.id, showReviewModal]);

  const handleSubmitReview = async (rating: number) => {
    if (!job || !reviewTarget) return;

    try {
      showToast('Submitting review...', 'info');
      
      const response = await fetch(`http://localhost:3002/api/jobs/${job.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewer_id: currentUser?.id,
          rating: rating,
          comment: ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to submit review', 'error');
        return;
      }

      showToast('Review submitted successfully!', 'success');
      setShowReviewModal(false);
      setReviewTarget(null);
    } catch (error) {
      console.error('Error submitting review:', error);
      showToast('Error submitting review', 'error');
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!job) return;
    
    try {
      // Delete from server
      const response = await fetch(`http://localhost:3002/api/jobs/${job.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employer_id: currentUser?.id
        })
      });

      if (response.ok) {
        // Navigate back to home after successful deletion
        showToast('Job deleted successfully', 'success');
        navigate('/');
      } else {
        console.error('Failed to delete job');
        showToast('Failed to delete job', 'error');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      showToast('Error deleting job', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0a0a0a',
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
      }}>
        <Header />
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: '#888888' }}>loading...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0a0a0a',
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
      }}>
        <Header />
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: '#ff6b6b' }}>job not found</p>
          <Link to="/" style={{ color: '#4c1d95', textDecoration: 'none' }}>back to home</Link>
        </div>
      </div>
    );
  }

  // Check if user has access to view this job
  // If job is not 'open', only employer or employee can view it
  const isEmployer = currentUser?.id && job.employer_id === currentUser.id.toString();
  const isEmployee = currentUser?.id && job.employee_id?.toString() === currentUser.id.toString();
  const hasAccess = job.status === 'open' || isEmployer || isEmployee;

  console.log('=== ACCESS CHECK ===');
  console.log('Current user ID:', currentUser?.id);
  console.log('Job status:', job.status);
  console.log('Job employer_id:', job.employer_id);
  console.log('Job employee_id:', job.employee_id);
  console.log('Is employer?', isEmployer);
  console.log('Is employee?', isEmployee);
  console.log('Has access?', hasAccess);

  // Debug submit button logic
  console.log('=== SUBMIT BUTTON CHECK ===');
  console.log('Job status === in_progress?', job.status === 'in_progress');
  console.log('Job employee_id exists?', !!job.employee_id);
  console.log('Employee ID matches?', String(job.employee_id) === String(currentUser?.id));
  console.log('Show submit button?', job.status === 'in_progress' && job.employee_id && String(job.employee_id) === String(currentUser?.id));

  if (!hasAccess) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0a0a0a',
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
      }}>
        <Header />
        <div style={{ 
          padding: '3rem', 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 200px)'
        }}>
          <p style={{ 
            color: '#ffffff', 
            fontSize: '8rem', 
            fontWeight: '800',
            margin: '0 0 1rem 0',
            lineHeight: 1
          }}>
            404
          </p>
          <p style={{ 
            color: '#ffffff', 
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
    }}>
      <Header />

      <section style={{ padding: '3rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
        {/* Back Button */}
        <Link to="/" style={{ 
          display: 'inline-block', 
          marginBottom: '2rem',
          color: '#888888',
          textDecoration: 'none',
          fontSize: '14px'
        }}>
          ← back to home
        </Link>

        {/* Job Header */}
        <div style={{
          backgroundColor: '#111111',
          border: '1px solid #333333',
          borderRadius: '4px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h1 style={{ color: '#ffffff', fontSize: '2rem', fontWeight: '800', margin: 0 }}>
              {job.title}
            </h1>
            <span style={{
              padding: '4px 10px',
              borderRadius: '12px',
              backgroundColor: job.status === 'open' ? '#1a4d1a' : job.status === 'in_progress' ? '#1a3a4d' : job.status === 'submitted' ? '#7c2d12' : job.status === 'completed' ? '#1a4d1a' : '#4d1a1a',
              color: job.status === 'open' ? '#4ade80' : job.status === 'in_progress' ? '#60a5fa' : job.status === 'submitted' ? '#fb923c' : job.status === 'completed' ? '#4ade80' : '#f87171',
              fontSize: '10px',
              fontWeight: '600'
            }}>
              {job.status}
            </span>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ color: '#4c1d95', fontSize: '2rem', fontWeight: '700' }}>
              {convertAndFormatCurrency(job.price, job.currency as Currency, userCurrency)}
            </span>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {(Array.isArray(job.tags) ? job.tags : []).map(tag => (
              <span key={tag} style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: '#1a1a1a',
                color: '#4c1d95',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        {(job.employer_name || job.escrow_id) && (
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #333333',
            borderRadius: '4px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h2 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
              additional information
            </h2>
            {job.employer_name && (
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ color: '#888888', fontSize: '14px', marginRight: '0.5rem' }}>posted by:</span>
                <span style={{ color: '#cccccc', fontSize: '14px' }}>{job.employer_name}</span>
              </div>
            )}
            {job.escrow_id && (
              <div>
                <span style={{ color: '#888888', fontSize: '14px', marginRight: '0.5rem' }}>escrow id:</span>
                <span style={{ color: '#cccccc', fontSize: '14px' }}>{job.escrow_id}</span>
              </div>
            )}
          </div>
        )}

        {/* Job Description */}
        <div style={{
          backgroundColor: '#111111',
          border: '1px solid #333333',
          borderRadius: '4px',
          padding: '2rem'
        }}>
          <h2 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
            description
          </h2>
          <p style={{ color: '#cccccc', fontSize: '16px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {job.description}
          </p>
        </div>

        {/* Action Buttons */}
        {job.status === 'open' && (
          <div style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            {/* Delete Button - Show for job owner */}
            {String(job.employer_id) === String(currentUser?.id) && (
              <button 
                onClick={handleDeleteClick}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '2px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textTransform: 'lowercase',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }}
              >
                delete
              </button>
            )}
            
            {/* Claim Button - Only show for jobs that aren't yours */}
            {String(job.employer_id) !== String(currentUser?.id) && (
              <button 
                onClick={handleClaimClick}
                style={{
                  backgroundColor: '#4c1d95',
                  color: 'white',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '2px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textTransform: 'lowercase'
                }}
              >
                claim
              </button>
            )}
          </div>
        )}

        {/* Submit Button for In-Progress Jobs - Show for employees */}
        {job.status === 'in_progress' && job.employee_id && String(job.employee_id) === String(currentUser?.id) && (
          <div style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={handleSubmitWork}
              style={{
                backgroundColor: '#4c1d95',
                color: 'white',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '2px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'lowercase',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5b21b6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4c1d95';
              }}
            >
              submit work
            </button>
          </div>
        )}

        {/* Waiting for Verification - Show for employees on submitted jobs */}
        {job.status === 'submitted' && job.employee_id && String(job.employee_id) === String(currentUser?.id) && (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <div style={{
              backgroundColor: '#111111',
              border: '1px solid #333333',
              borderRadius: '4px',
              padding: '2rem',
              display: 'inline-block'
            }}>
              <p style={{ color: '#60a5fa', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                ✓ work submitted
              </p>
              <p style={{ color: '#888888', fontSize: '14px', margin: '0.5rem 0 0 0' }}>
                waiting for employer verification...
              </p>
            </div>
          </div>
        )}

        {/* Approve Button - Show for employers on submitted jobs */}
        {job.status === 'submitted' && String(job.employer_id) === String(currentUser?.id) && (
          <div style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={handleApproveWork}
              style={{
                backgroundColor: '#4c1d95',
                color: 'white',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '2px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'lowercase',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5b21b6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4c1d95';
              }}
            >
              verify work
            </button>
          </div>
        )}
      </section>

      {/* Confirmation Alert */}
      {job && (
        <ConfirmationAlert
          isOpen={showConfirmation}
          onClose={handleCloseConfirmation}
          onMessageSeller={handleMessageSeller}
          onConfirm={handleConfirmClaim}
          jobTitle={job.title}
          jobPrice={convertAndFormatCurrency(job.price, job.currency as Currency, userCurrency)}
        />
      )}

      {/* Delete Confirmation Alert */}
      {job && (
        <DeleteConfirmationAlert
          isOpen={showDeleteConfirmation}
          onClose={() => setShowDeleteConfirmation(false)}
          onConfirm={handleConfirmDelete}
          title="delete job"
          message="are you sure you want to delete this job?"
          itemName={job.title}
        />
      )}

      {/* Review Modal */}
      {job && reviewTarget && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setReviewTarget(null);
          }}
          onSubmit={handleSubmitReview}
          personName={reviewTarget.name}
          role={reviewTarget.role}
          jobTitle={job.title}
        />
      )}
    </div>
  );
};

export default JobDetails;
