import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { convertAndFormatCurrency, Currency } from '../utils/currencyConversion';
import { useNavigate, Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import ConfirmationAlert from '../components/ConfirmationAlert';
import DeleteConfirmationAlert from '../components/DeleteConfirmationAlert';
import ReviewModal from '../components/ReviewModal';
import { useToast } from '../contexts/ToastContext';
import { signAndSubmitTransaction, checkFreighterAvailable } from '../utils/freighterSigning';

interface Wallet {
  id: string;
  label: string;
  address: string;
  created_at: string;
}

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
  employer_email?: string;
}

const EmployerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { userCurrency } = useCurrency();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [showWalletDeleteConfirmation, setShowWalletDeleteConfirmation] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);
  const [viewedUser, setViewedUser] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ name: string; role: 'employer' | 'employee'; id: string; jobId: string; jobTitle: string } | null>(null);
  const [userReviews, setUserReviews] = useState<Map<string, number>>(new Map()); // jobId -> rating
  
  const [employerRating, setEmployerRating] = useState(0);
  const [employeeRating, setEmployeeRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  
  const marketplaceRating = totalReviews > 0 ? ((employerRating + employeeRating) / 2).toFixed(1) : '0.0';

  // Fetch viewed user details
  const fetchUserDetails = async (userIdParam: string) => {
    try {
      const response = await fetch('http://localhost:3002/api/users');
      if (response.ok) {
        const allUsers = await response.json();
        const user = allUsers.find((u: any) => u.id.toString() === userIdParam);
        setViewedUser(user);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  useEffect(() => {
    if (userId && userId !== currentUser?.id) {
      // If viewing someone else's dashboard, fetch their jobs and details
      fetchJobs(userId);
      fetchUserDetails(userId);
      fetchUserRatings(userId);
    } else if (currentUser) {
      // Viewing own dashboard
      fetchJobs(currentUser.id);
      setViewedUser(null); // Reset to use currentUser
      fetchUserRatings(currentUser.id);
    }
  }, [userId, currentUser]);
  
  const fetchUserRatings = async (userId: string) => {
    try {
      // Fetch average rating for this user
      const response = await fetch(`http://localhost:3002/api/users/${userId}/average-rating`);
      if (response.ok) {
        const data = await response.json();
        setEmployerRating(data.average_rating || 0);
        setTotalReviews(data.total_reviews || 0);
        // For now, set employee rating same as employer rating
        // TODO: Fetch separately when API supports it
        setEmployeeRating(data.average_rating || 0);
      }
    } catch (error) {
      console.error('Error fetching user ratings:', error);
    }
  };

  // Fetch wallets when viewing own dashboard
  const fetchWallets = useCallback(async () => {
    if (!currentUser || (userId && userId !== currentUser.id)) return;
    
    try {
      setLoadingWallets(true);
      const response = await fetch(`http://localhost:3002/api/users/${currentUser.id}/wallets`);
      if (response.ok) {
        const data = await response.json();
        setWallets(data);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoadingWallets(false);
    }
  }, [currentUser, userId]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleDeleteWallet = useCallback(async (walletId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) {
      setWalletToDelete(wallet);
      setShowWalletDeleteConfirmation(true);
    }
  }, [wallets]);

  const handleConfirmWalletDelete = async () => {
    if (!walletToDelete) return;

    try {
      const response = await fetch(`http://localhost:3002/api/users/${currentUser?.id}/wallets/${walletToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Refresh wallets list
        fetchWallets();
      } else {
        console.error('Failed to delete wallet');
      }
    } catch (error) {
      console.error('Error deleting wallet:', error);
    }
  };

  const fetchJobs = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3002/api/jobs`);
      const allJobs = await response.json();
      // Filter jobs by employer_id OR employee_id (jobs posted by user OR claimed by user)
      const userJobs = allJobs.filter((job: any) => 
        job.employer_id === userId || job.employee_id === userId
      );
      // Remove duplicates by converting to Map with job.id as key
      const uniqueJobs: Job[] = Array.from(
        new Map(userJobs.map((job: Job) => [job.id, job])).values()
      ) as Job[];
      setJobs(uniqueJobs);
      
      // Fetch user's reviews
      if (currentUser) {
        try {
          const reviewsResponse = await fetch(`http://localhost:3002/api/users/${currentUser.id}/reviews`);
          if (reviewsResponse.ok) {
            const reviews = await reviewsResponse.json();
            // Check if reviews is an array
            if (Array.isArray(reviews) && reviews.length > 0) {
              const reviewMap = new Map();
              reviews.forEach((review: any) => {
                reviewMap.set(review.job_id, review.rating);
              });
              setUserReviews(reviewMap);
            }
          }
        } catch (error) {
          console.error('Error fetching reviews:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Categorize jobs based on user's role
  // If viewing own dashboard: show owned jobs (they posted) vs jobs they're working on
  // If viewing someone else's dashboard: show the same (their owned jobs vs jobs they're working on)
  const targetUserId = userId || currentUser?.id;
  
  const ownedJobs = jobs.filter(job => 
    job.employer_id === targetUserId && job.status !== 'completed' && job.status !== 'cancelled'
  );
  
  const completedJobs = jobs.filter(job => 
    job.status === 'completed'
  );
  
  const currentJobs = jobs.filter(job => 
    job.employee_id?.toString() === targetUserId?.toString() && 
    (job.status === 'in_progress' || job.status === 'submitted')
  );
  
  const pastJobs = jobs.filter(job => 
    (job.employer_id === targetUserId && (job.status === 'completed' || job.status === 'cancelled')) ||
    (job.employee_id?.toString() === targetUserId?.toString() && job.status === 'completed')
  );

  const handleClaimClick = (job: Job, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedJob(job);
    setShowConfirmation(true);
  };

  const handleConfirmClaim = async () => {
    if (selectedJob) {
      try {
        // Update job status to in_progress on server
        const response = await fetch(`http://localhost:3002/api/jobs/${selectedJob.id}/claim`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'in_progress',
            claimed_by: currentUser?.id
          })
        });

        if (response.ok) {
          // Update local state to reflect the change
          setJobs(prevJobs => 
            prevJobs.map(job => 
              job.id === selectedJob.id 
                ? { ...job, status: 'in_progress' }
                : job
            )
          );
        } else {
          console.error('Failed to claim job');
        }
      } catch (error) {
        console.error('Error claiming job:', error);
      }
    }
  };

  const handleMessageSeller = () => {
    setShowConfirmation(false);
    if (selectedJob) {
      // Navigate to messages with job poster info to start new conversation
      navigate('/messages', { 
        state: { 
          startConversationWith: {
            name: selectedJob.employer_name || 'Job Poster',
            email: selectedJob.employer_email || 'unknown@example.com',
            jobTitle: selectedJob.title
          }
        } 
      });
    } else {
      navigate('/messages');
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setSelectedJob(null);
  };

  const handleLeaveReview = async (job: Job, targetRole: 'employer' | 'employee') => {
    console.log('=== handleLeaveReview called ===');
    console.log('Job:', job);
    console.log('Target role:', targetRole);
    
    // Get target user ID based on role
    const targetUserId = targetRole === 'employer' ? job.employer_id : job.employee_id;
    
    if (!targetUserId) {
      console.error('No target user ID found');
      return;
    }

    console.log('Fetching target user data');
    // Fetch the actual user's name
    try {
      const response = await fetch(`http://localhost:3002/api/users`);
      const allUsers = await response.json();
      const targetUser = allUsers.find((u: any) => u.id.toString() === targetUserId.toString());
      
      const userName = targetUser?.name || targetUser?.email || `User ${targetUserId}`;
      
      console.log('Setting review target with name:', userName);
      setReviewTarget({
        name: userName,
        role: targetRole,
        id: targetUserId,
        jobId: job.id,
        jobTitle: job.title
      });
      
      console.log('Opening review modal');
      setShowReviewModal(true);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to ID if fetch fails
      setReviewTarget({
        name: `User ${targetUserId}`,
        role: targetRole,
        id: targetUserId,
        jobId: job.id,
        jobTitle: job.title
      });
      setShowReviewModal(true);
    }
  };

  const handleSubmitReview = async (rating: number) => {
    if (!reviewTarget) return;

    try {
      showToast('Preparing blockchain transaction...', 'info');
      
      // Get XDR from backend
      const response = await fetch(`http://localhost:3002/api/jobs/${reviewTarget.jobId}/review`, {
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
        showToast(errorData.error || 'Failed to prepare review', 'error');
        return;
      }

      const data = await response.json();
      
      if (data.needs_signing && data.xdr_data) {
        showToast('Please sign the transaction with Freighter...', 'info');
        
        // Check Freighter is available
        const freighterAvailable = await checkFreighterAvailable();
        if (!freighterAvailable) {
          showToast('Freighter wallet required. Please install and connect Freighter.', 'error');
          return;
        }

        // For now, just show success - XDR generation worked
        // TODO: Implement full Soroban SDK integration for actual blockchain submission
        console.log('Review data received:', data.xdr_data);
        
        showToast('Review prepared for blockchain submission!', 'success');
        setShowReviewModal(false);
        
        // Update local reviews map
        if (reviewTarget) {
          const newReviews = new Map(userReviews);
          newReviews.set(reviewTarget.jobId, rating);
          setUserReviews(newReviews);
        }
        
        setReviewTarget(null);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showToast('Error submitting review', 'error');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, job: Job) => {
    e.preventDefault();
    e.stopPropagation();
    
    setJobToDelete(job);
    setShowDeleteConfirmation(true);
  };

  const handleConfirmJobDelete = async () => {
    if (!jobToDelete) return;
    
    try {
      // Optimistically remove from UI
      setJobs(prevJobs => prevJobs.filter(j => j.id !== jobToDelete.id));
      
      // Delete from server
      const response = await fetch(`http://localhost:3002/api/jobs/${jobToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employer_id: currentUser?.id
        })
      });

      if (!response.ok) {
        console.error('Failed to delete job');
        // If failed, refetch to restore state
        fetchJobs(currentUser?.id || '');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      // Refetch on error
      fetchJobs(currentUser?.id || '');
    }
  };

  const renderJobCard = (job: Job) => (
    <div key={job.id} style={{ position: 'relative' }}>
      <Link to={`/job/${job.id}`} style={{ textDecoration: 'none' }}>
        <div
          style={{
            backgroundColor: '#111111',
            border: '1px solid #333333',
            borderRadius: '4px',
            padding: '1.25rem',
            marginBottom: '1rem',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(76, 29, 149, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
        <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
          {job.title}
        </h3>
        <span style={{
          padding: '4px 10px',
          borderRadius: '12px',
          backgroundColor: job.status === 'open' ? '#1a4d1a' : job.status === 'in_progress' ? '#1a3a4d' : job.status === 'submitted' ? '#7c2d12' : '#4d1a1a',
          color: job.status === 'open' ? '#4ade80' : job.status === 'in_progress' ? '#60a5fa' : job.status === 'submitted' ? '#fb923c' : '#f87171',
          fontSize: '10px',
          fontWeight: '600'
        }}>
          {job.status}
        </span>
      </div>
      <p style={{ color: '#888888', fontSize: '13px', marginBottom: '0.75rem', lineHeight: '1.5' }}>
        {job.description.length > 100 ? `${job.description.substring(0, 100)}...` : job.description}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {(Array.isArray(job.tags) ? job.tags : []).slice(0, 3).map(tag => (
          <span
            key={tag}
            style={{
              padding: '3px 8px',
              borderRadius: '8px',
              backgroundColor: '#1a1a1a',
              color: '#4c1d95',
              fontSize: '11px',
              fontWeight: '600'
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#4c1d95', fontSize: '1.2rem', fontWeight: '700' }}>
          {convertAndFormatCurrency(job.price, job.currency as Currency, userCurrency)}
        </span>
        <span style={{ color: '#666666', fontSize: '11px' }}>
          {new Date(job.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
    </Link>
    
    {/* Action Buttons for Open Jobs */}
    {job.status === 'open' && (
      <>
        {/* Delete Button - Show for job owner when viewing own dashboard */}
        {(!userId || userId === currentUser?.id) && String(job.employer_id) === String(currentUser?.id) ? (
          <button
            onClick={(e) => handleDeleteClick(e, job)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              zIndex: 10
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
        ) : (
          /* Claim Button - Show for jobs that aren't yours */
          String(job.employer_id) !== String(currentUser?.id) && (
            <button
              onClick={(e) => handleClaimClick(job, e)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                backgroundColor: '#4c1d95',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5b21b6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4c1d95';
              }}
            >
              claim
            </button>
          )
        )}
      </>
    )}
    
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
    }}>
      <Header />

      {/* Profile Header */}
      <div style={{ padding: '2rem 2rem 1rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: '#111111',
          border: '1px solid #333333',
          borderRadius: '8px',
          padding: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#4c1d95',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: '700',
            color: '#ffffff'
          }}>
            {(viewedUser ? viewedUser.email : currentUser?.email)?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ 
              color: '#ffffff', 
              fontSize: '2rem', 
              fontWeight: '800', 
              margin: '0 0 0.5rem 0',
              textTransform: 'lowercase'
            }}>
              {(viewedUser ? viewedUser.name : currentUser?.name) || 
               (viewedUser ? viewedUser.email : currentUser?.email)?.split('@')[0]}
            </h1>
            <p style={{ 
              color: '#888888', 
              fontSize: '14px', 
              margin: 0 
            }}>
              {viewedUser ? viewedUser.email : currentUser?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section style={{ padding: '1rem 2rem 2rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
          
          {/* Left Column - Profile & Rating */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Rating Box */}
            <div style={{
              backgroundColor: '#111111',
              border: '1px solid #333333',
              borderRadius: '4px',
              padding: '1.5rem',
              position: 'relative'
            }}>
              <h3 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                marketplace rating
              </h3>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  marginBottom: '0.75rem',
                  cursor: 'pointer'
                }}
                onClick={() => setShowRatingDropdown(!showRatingDropdown)}
              >
                <span style={{ color: '#ffffff', fontSize: '2.5rem', fontWeight: '800' }}>
                  {marketplaceRating}
                </span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} style={{ color: star <= Math.floor(Number(marketplaceRating)) ? '#fbbf24' : '#444444', fontSize: '1.5rem' }}>
                      ★
                    </span>
                  ))}
                </div>
                <span style={{ color: '#666666', fontSize: '1.2rem' }}>
                  ▼
                </span>
              </div>
              <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>
                {totalReviews} reviews
              </p>
              
              {showRatingDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '0.5rem',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  padding: '1rem',
                  zIndex: 1000,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
                }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#ffffff', fontSize: '12px', fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>employer rating</span>
                      <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600', fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>{employerRating}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} style={{ color: star <= Math.floor(employerRating) ? '#fbbf24' : '#444444', fontSize: '1rem' }}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #333333', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#ffffff', fontSize: '12px', fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>employee rating</span>
                      <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600', fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif' }}>{employeeRating}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} style={{ color: star <= Math.floor(employeeRating) ? '#fbbf24' : '#444444', fontSize: '1rem' }}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Box */}
            <div style={{
              backgroundColor: '#111111',
              border: '1px solid #333333',
              borderRadius: '4px',
              padding: '1.5rem'
            }}>
              <h3 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                statistics
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888888', fontSize: '13px' }}>total jobs</span>
                  <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: '600' }}>{jobs.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888888', fontSize: '13px' }}>owned</span>
                  <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: '600' }}>{ownedJobs.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888888', fontSize: '13px' }}>in progress</span>
                  <span style={{ color: '#60a5fa', fontSize: '13px', fontWeight: '600' }}>{currentJobs.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888888', fontSize: '13px' }}>completed</span>
                  <span style={{ color: '#888888', fontSize: '13px', fontWeight: '600' }}>{pastJobs.length}</span>
                </div>
              </div>
            </div>

            {/* Wallets Display - Only show for current user */}
            {(!userId || userId === currentUser?.id) && (
              <div style={{
                backgroundColor: '#111111',
                border: '1px solid #333333',
                borderRadius: '4px',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                    wallets
                  </h3>
                  <Link to="/add-wallet" style={{ textDecoration: 'none' }}>
                    <button style={{
                      backgroundColor: '#4c1d95',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#5b21b6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#4c1d95';
                    }}>
                      + add wallet
                    </button>
                  </Link>
                </div>
                
                {loadingWallets ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    color: '#888888',
                    fontSize: '13px'
                  }}>
                    loading wallets...
                  </div>
                ) : wallets.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '1rem', 
                    color: '#888888',
                    fontSize: '13px'
                  }}>
                    no wallets yet. add your first wallet!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                    {wallets.map(wallet => (
                      <div
                        key={wallet.id}
                        style={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #333333',
                          borderRadius: '4px',
                          padding: '0.75rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#2a2a2a';
                          e.currentTarget.style.borderColor = '#4c1d95';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#1a1a1a';
                          e.currentTarget.style.borderColor = '#333333';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <h4 style={{
                            color: '#ffffff',
                            fontSize: '14px',
                            fontWeight: '600',
                            margin: 0
                          }}>
                            {wallet.label}
                          </h4>
                          <button
                            onClick={(e) => handleDeleteWallet(wallet.id, e)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#888888',
                              fontSize: '16px',
                              cursor: 'pointer',
                              padding: '0.25rem 0.5rem',
                              transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#f87171';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#888888';
                            }}
                          >
                            ✕
                          </button>
                        </div>
                        <p style={{
                          color: '#888888',
                          fontSize: '12px',
                          margin: 0,
                          fontFamily: 'monospace',
                          wordBreak: 'break-all'
                        }}>
                          {wallet.address}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Job Lists */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Owned Jobs */}
            <div>
              <h2 style={{ 
                color: '#ffffff', 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                owned jobs
                <span style={{ 
                  backgroundColor: '#1a4d1a', 
                  color: '#4ade80', 
                  fontSize: '12px', 
                  padding: '2px 8px', 
                  borderRadius: '10px',
                  fontWeight: '600'
                }}>
                  {ownedJobs.length}
                </span>
              </h2>
              {loading ? (
                <p style={{ color: '#888888' }}>loading...</p>
              ) : ownedJobs.length === 0 ? (
                <div style={{
                  backgroundColor: '#111111',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  padding: '2rem',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#888888', fontSize: '14px' }}>
                    no owned jobs
                  </p>
                </div>
              ) : (
                <div style={{ maxHeight: '17rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ownedJobs.map(renderJobCard)}
                </div>
              )}
            </div>

            {/* Current Jobs */}
            <div>
              <h2 style={{ 
                color: '#ffffff', 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                current jobs
                <span style={{ 
                  backgroundColor: '#1a3a4d', 
                  color: '#60a5fa', 
                  fontSize: '12px', 
                  padding: '2px 8px', 
                  borderRadius: '10px',
                  fontWeight: '600'
                }}>
                  {currentJobs.length}
                </span>
              </h2>
              {loading ? (
                <p style={{ color: '#888888' }}>loading...</p>
              ) : currentJobs.length === 0 ? (
                <div style={{
                  backgroundColor: '#111111',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  padding: '2rem',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#888888', fontSize: '14px' }}>
                    no active jobs
                  </p>
                </div>
              ) : (
                <div style={{ maxHeight: '17rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {currentJobs.map(renderJobCard)}
                </div>
              )}
            </div>

            {/* History */}
            <div>
              <h2 style={{ 
                color: '#ffffff', 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                history
                <span style={{ 
                  backgroundColor: '#1a1a1a', 
                  color: '#888888', 
                  fontSize: '12px', 
                  padding: '2px 8px', 
                  borderRadius: '10px',
                  fontWeight: '600'
                }}>
                  {pastJobs.length}
                </span>
              </h2>
              {loading ? (
                <p style={{ color: '#888888' }}>loading...</p>
              ) : pastJobs.length === 0 ? (
                <div style={{
                  backgroundColor: '#111111',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  padding: '2rem',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#888888', fontSize: '14px' }}>
                    no completed jobs
                  </p>
                </div>
              ) : (
                <div style={{ maxHeight: '17rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {pastJobs.map(job => {
                    const hasReviewed = userReviews.has(job.id);
                    const rating = userReviews.get(job.id);
                    
                    const renderCardWithReviewButton = () => (
                      <div key={job.id} style={{ position: 'relative' }}>
                        <div
                          style={{
                            backgroundColor: '#111111',
                            border: '1px solid #333333',
                            borderRadius: '4px',
                            padding: '1.25rem',
                            transition: 'transform 0.2s, box-shadow 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(76, 29, 149, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                              <Link to={`/job/${job.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                                <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                                  {job.title}
                                </h3>
                              </Link>
                              {hasReviewed ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '1rem' }}>
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} style={{ color: i < (rating || 0) ? '#fbbf24' : '#333333', fontSize: '14px' }}>
                                      ★
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('=== Review button clicked ===');
                                    console.log('Current user ID:', currentUser?.id);
                                    console.log('Job employer ID:', job.employer_id);
                                    const targetRole = job.employer_id === String(currentUser?.id) ? 'employee' : 'employer';
                                    console.log('Calculated target role:', targetRole);
                                    console.log('Job:', job);
                                    handleLeaveReview(job, targetRole);
                                  }}
                                  style={{
                                    backgroundColor: '#4c1d95',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '6px 14px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    textTransform: 'lowercase',
                                    transition: 'all 0.2s',
                                    marginLeft: '1rem',
                                    zIndex: 10
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#5b21b6';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#4c1d95';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  leave review
                                </button>
                              )}
                            </div>
                            <Link to={`/job/${job.id}`} style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}>
                              <p style={{ color: '#888888', fontSize: '13px', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                                {job.description.length > 100 ? `${job.description.substring(0, 100)}...` : job.description}
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                {(Array.isArray(job.tags) ? job.tags : []).slice(0, 3).map(tag => (
                                  <span
                                    key={tag}
                                    style={{
                                      padding: '3px 8px',
                                      borderRadius: '8px',
                                      backgroundColor: '#1a1a1a',
                                      color: '#4c1d95',
                                      fontSize: '11px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#4c1d95', fontSize: '1.2rem', fontWeight: '700' }}>
                                  {convertAndFormatCurrency(job.price, job.currency as Currency, userCurrency)}
                                </span>
                                <span style={{ color: '#666666', fontSize: '11px' }}>
                                  {new Date(job.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </Link>
                          </div>
                        </div>
                      );
                      return renderCardWithReviewButton();
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
      
      {/* Confirmation Alert */}
      {showConfirmation && selectedJob && (
        <ConfirmationAlert
          isOpen={showConfirmation}
          onClose={handleCloseConfirmation}
          onMessageSeller={handleMessageSeller}
          jobTitle={selectedJob.title}
          jobPrice={convertAndFormatCurrency(selectedJob.price, selectedJob.currency as Currency, userCurrency)}
        />
      )}

      {/* Delete Confirmation Alert for Jobs */}
      {jobToDelete && (
        <DeleteConfirmationAlert
          isOpen={showDeleteConfirmation}
          onClose={() => {
            setShowDeleteConfirmation(false);
            setJobToDelete(null);
          }}
          onConfirm={handleConfirmJobDelete}
          title="delete job"
          message="are you sure you want to delete this job?"
          itemName={jobToDelete.title}
        />
      )}

      {/* Delete Confirmation Alert for Wallets */}
      {walletToDelete && (
        <DeleteConfirmationAlert
          isOpen={showWalletDeleteConfirmation}
          onClose={() => {
            setShowWalletDeleteConfirmation(false);
            setWalletToDelete(null);
          }}
          onConfirm={handleConfirmWalletDelete}
          title="delete wallet"
          message="are you sure you want to delete this wallet?"
          itemName={walletToDelete.label}
        />
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setReviewTarget(null);
          }}
          onSubmit={handleSubmitReview}
          personName={reviewTarget.name}
          role={reviewTarget.role}
          jobTitle={reviewTarget.jobTitle}
        />
      )}
    </div>
  );
};

export default EmployerDashboard;
