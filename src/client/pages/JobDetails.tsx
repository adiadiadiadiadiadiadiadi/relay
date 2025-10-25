import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { convertAndFormatCurrency, Currency } from '../utils/currencyConversion';
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
  escrow_id?: string;
}

const JobDetails: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { currentUser } = useAuth();
  const { userCurrency } = useCurrency();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);

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
        const response = await fetch(`http://localhost:3002/api/jobs/${job.id}/claim`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'in_progress',
            claimed_by: currentUser?.id
          })
        });

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

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
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
              backgroundColor: job.status === 'open' ? '#1a4d1a' : '#1a3a4d',
              color: job.status === 'open' ? '#4ade80' : '#60a5fa',
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
            {job.tags.map(tag => (
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

        {/* Claim Button */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
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
        </div>
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
    </div>
  );
};

export default JobDetails;
