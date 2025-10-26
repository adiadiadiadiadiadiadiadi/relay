import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { convertAndFormatCurrency, Currency } from '../utils/currencyConversion';
import { useNavigate, Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import ConfirmationAlert from '../components/ConfirmationAlert';

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
  employer_name?: string;
  employer_email?: string;
  escrow_id?: string;
}

const EmployerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { userCurrency } = useCurrency();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  
  // Hardcoded ratings
  const employerRating = 4.8;
  const employeeRating = 4.6;
  const marketplaceRating = ((employerRating + employeeRating) / 2).toFixed(1);
  const totalReviews = 127;

  useEffect(() => {
    if (userId && userId !== currentUser?.id) {
      // If viewing someone else's dashboard, fetch their jobs
      fetchJobs(userId);
    } else if (currentUser) {
      // Viewing own dashboard
      fetchJobs(currentUser.id);
    }
  }, [userId, currentUser]);

  const fetchJobs = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3002/api/jobs`);
      const allJobs = await response.json();
      // Filter jobs by employer_id OR employee_id (jobs posted by user OR claimed by user)
      const userJobs = allJobs.filter((job: any) => 
        job.employer_id === userId || job.employee_id === userId
      );
      setJobs(userJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Categorize jobs - show all posted jobs regardless of status
  const postedJobs = jobs.filter(job => job.employer_id === (userId || currentUser?.id));
  const openJobs = jobs.filter(job => job.status === 'open');
  const currentJobs = jobs.filter(job => job.status === 'in_progress' || job.status === 'submitted');
  const pastJobs = jobs.filter(job => job.status === 'completed' || job.status === 'cancelled');

  const handleClaimClick = (job: Job, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedJob(job);
    setShowConfirmation(true);
  };

  const handleConfirmClaim = async () => {
    if (selectedJob) {
      try {
        // Close the confirmation dialog first
        setShowConfirmation(false);
        setSelectedJob(null);

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
                ? { ...job, status: 'in_progress', employee_id: currentUser?.id }
                : job
            )
          );
        } else {
          const errorData = await response.json();
          console.error('Failed to claim job:', errorData.error);
          alert(`Failed to claim job: ${errorData.error}`);
          // Refetch jobs to restore correct state
          await fetchJobs(userId || currentUser?.id || '');
        }
      } catch (error) {
        console.error('Error claiming job:', error);
        alert('Error claiming job. Please try again.');
        // Refetch jobs to restore correct state
        await fetchJobs(userId || currentUser?.id || '');
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

  const handleDeleteJob = async (job: Job, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setJobToDelete(job);
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (jobToDelete) {
      try {
        console.log('Attempting to delete job:', jobToDelete.id);
        console.log('Employer ID:', userId || currentUser?.id);
        
        // Close the confirmation modal first
        setShowDeleteConfirmation(false);
        setJobToDelete(null);
        
        // Delete the job from the server
        const response = await fetch(`http://localhost:3002/api/jobs/${jobToDelete.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employer_id: userId || currentUser?.id
          })
        });

        console.log('Delete response status:', response.status);
        
        if (response.ok) {
          console.log('Job deleted successfully');
          // Optimistically remove the job from the UI after successful server response
          setJobs(prevJobs => prevJobs.filter(j => j.id !== jobToDelete.id));
        } else {
          const errorData = await response.json();
          console.error('Failed to delete job:', errorData);
          alert(`Failed to delete job: ${errorData.error}`);
          // Refetch jobs to restore correct state
          await fetchJobs(userId || currentUser?.id || '');
        }
      } catch (error) {
        console.error('Error deleting job:', error);
        alert('Error deleting job. Please try again.');
        // Refetch jobs to restore correct state
        await fetchJobs(userId || currentUser?.id || '');
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setJobToDelete(null);
  };

  const renderJobSection = (jobs: Job[], title: string, badgeColor: string, badgeTextColor: string) => {
    return (
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
          {title}
          <span style={{ 
            backgroundColor: badgeColor, 
            color: badgeTextColor, 
            fontSize: '12px', 
            padding: '2px 8px', 
            borderRadius: '10px',
            fontWeight: '600'
          }}>
            {jobs.length}
          </span>
        </h2>
        {loading ? (
          <p style={{ color: '#888888' }}>loading...</p>
        ) : jobs.length === 0 ? (
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #333333',
            borderRadius: '4px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <p style={{ color: '#888888', fontSize: '14px' }}>
              no {title.toLowerCase()}
            </p>
          </div>
        ) : (
          <div 
            className="job-scroll-container"
            style={{
              backgroundColor: '#111111',
              border: '1px solid #333333',
              borderRadius: '4px',
              padding: '1rem',
              maxHeight: '250px',
              overflowY: 'auto',
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none' // IE/Edge
            }}>
            {jobs.map(renderJobCard)}
          </div>
        )}
      </div>
    );
  };

  const renderJobCard = (job: Job) => (
    <div key={job.id} style={{ position: 'relative', marginBottom: '1rem' }}>
      <Link to={`/job/${job.id}`} style={{ textDecoration: 'none' }}>
        <div
          style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333333',
            borderRadius: '4px',
            padding: '1rem',
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
          backgroundColor: job.status === 'open' ? '#1a4d1a' : job.status === 'in_progress' ? '#1a3a4d' : '#4d1a1a',
          color: job.status === 'open' ? '#4ade80' : job.status === 'in_progress' ? '#60a5fa' : '#f87171',
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
    
    {/* Action Button for Open Jobs */}
    {job.status === 'open' && (
      <>
        {/* Delete Button for Jobs Posted by Current User */}
        {job.employer_id === (userId || currentUser?.id) && (
          <button
            onClick={(e) => handleDeleteJob(job, e)}
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
        )}
        
        {/* Claim Button for Jobs Posted by Others */}
        {job.employer_id !== (userId || currentUser?.id) && (
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
      <style>
        {`
          .job-scroll-container::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
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
          justifyContent: 'space-between',
          gap: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
              {currentUser?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ 
                color: '#ffffff', 
                fontSize: '2rem', 
                fontWeight: '800', 
                margin: '0 0 0.5rem 0',
                textTransform: 'lowercase'
              }}>
                {currentUser?.email?.split('@')[0]}
              </h1>
              <p style={{ 
                color: '#888888', 
                fontSize: '14px', 
                margin: 0 
              }}>
                {currentUser?.email}
              </p>
            </div>
          </div>
          
          {/* Post Job Button - Only show if viewing own profile */}
          {(() => {
            console.log('Debug - currentUser:', currentUser);
            console.log('Debug - userId:', userId);
            console.log('Debug - currentUser.id:', currentUser?.id);
            console.log('Debug - userId type:', typeof userId);
            console.log('Debug - currentUser.id type:', typeof currentUser?.id);
            console.log('Debug - comparison:', currentUser?.id === userId);
            console.log('Debug - string comparison:', String(currentUser?.id) === String(userId));
            return currentUser && userId && String(currentUser.id) === String(userId);
          })() && (
            <button
              onClick={() => navigate('/post-job')}
              style={{
                backgroundColor: '#4c1d95',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5b21b6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4c1d95';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              post new job
            </button>
          )}
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
                  <span style={{ color: '#888888', fontSize: '13px' }}>open</span>
                  <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: '600' }}>{openJobs.length}</span>
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

            {/* Wallet Display - Only show for current user */}
            {(!userId || userId === currentUser?.id) && (
              <div style={{
                backgroundColor: '#111111',
                border: '1px solid #333333',
                borderRadius: '4px',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                    wallet
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#888888', fontSize: '13px' }}>USDC balance</span>
                    <span style={{ color: '#4c1d95', fontSize: '16px', fontWeight: '700' }}>1,250.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#888888', fontSize: '13px' }}>EURC balance</span>
                    <span style={{ color: '#4c1d95', fontSize: '16px', fontWeight: '700' }}>850.50</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#888888', fontSize: '13px' }}>GBPC balance</span>
                    <span style={{ color: '#4c1d95', fontSize: '16px', fontWeight: '700' }}>320.75</span>
                  </div>
                  <div style={{ 
                    borderTop: '1px solid #333333', 
                    paddingTop: '0.75rem',
                    marginTop: '0.25rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: '600' }}>total value</span>
                      <span style={{ color: '#ffffff', fontSize: '18px', fontWeight: '800' }}>$2,421.25</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Job Lists */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Posted Jobs */}
            {renderJobSection(postedJobs, 'posted jobs', '#1a4d1a', '#4ade80')}

            {/* Current Jobs */}
            {renderJobSection(currentJobs, 'current jobs', '#1a3a4d', '#60a5fa')}

            {/* Past Jobs */}
            {renderJobSection(pastJobs, 'past jobs', '#1a1a1a', '#888888')}

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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && jobToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
        }}>
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              color: '#dc2626'
            }}>
              ⚠️
            </div>
            <h3 style={{
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '1rem'
            }}>
              delete job?
            </h3>
            <p style={{
              color: '#888888',
              fontSize: '1rem',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              are you sure you want to delete <strong style={{ color: '#ffffff' }}>"{jobToDelete.title}"</strong>? this action cannot be undone.
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleCancelDelete}
                style={{
                  backgroundColor: 'transparent',
                  color: '#888888',
                  border: '1px solid #333333',
                  borderRadius: '6px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a1a1a';
                  e.currentTarget.style.borderColor = '#555555';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#333333';
                }}
              >
                cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;
