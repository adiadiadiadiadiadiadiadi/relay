import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { convertAndFormatCurrency, Currency } from '../utils/currencyConversion';
import { useNavigate, Link } from 'react-router-dom';
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

const AllPostings: React.FC = () => {
  const { currentUser } = useAuth();
  const { userCurrency } = useCurrency();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/jobs');
        if (response.ok) {
          const data = await response.json();
          setJobs(data);
        } else {
          console.error('Failed to fetch jobs');
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleClaimClick = (e: React.MouseEvent, job: Job) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedJob(job);
    setShowConfirmation(true);
  };

  const handleConfirmClaim = async () => {
    if (selectedJob) {
      try {
        // Optimistically update the UI immediately
        setJobs(prevJobs => 
          prevJobs.filter(job => job.id !== selectedJob.id)
        );
        
        // Close the confirmation dialog
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

        if (!response.ok) {
          console.error('Failed to claim job');
          // If server request failed, refetch jobs to restore correct state
          const fetchJobs = async () => {
            try {
              const response = await fetch('http://localhost:3002/api/jobs');
              if (response.ok) {
                const data = await response.json();
                setJobs(data);
              } else {
                console.error('Failed to fetch jobs');
              }
            } catch (error) {
              console.error('Error fetching jobs:', error);
            }
          };
          fetchJobs();
        }
      } catch (error) {
        console.error('Error claiming job:', error);
        // If there was an error, refetch jobs to restore correct state
        const fetchJobs = async () => {
          try {
            const response = await fetch('http://localhost:3002/api/jobs');
            if (response.ok) {
              const data = await response.json();
              setJobs(data);
            } else {
              console.error('Failed to fetch jobs');
            }
          } catch (error) {
            console.error('Error fetching jobs:', error);
          }
        };
        fetchJobs();
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
            email: `${selectedJob.employer_id}@example.com`, // Using employer_id as fallback
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

  // Filter jobs based on search query
  const filteredJobs = jobs.filter(job => {
    if (job.status !== 'open') return false;
    
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.description.toLowerCase().includes(query) ||
      job.tags.some(tag => tag.toLowerCase().includes(query)) ||
      (job.employer_name && job.employer_name.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
      }}>
        <Header />
        <div style={{ color: '#ffffff', fontSize: '1.2rem' }}>Loading jobs...</div>
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

      {/* Header Section */}
      <section style={{
        padding: '2rem',
        backgroundColor: '#111111',
        margin: '2rem',
        borderRadius: '4px',
        border: '1px solid #333333'
      }}>
        <h1 style={{ color: '#ffffff', fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>
          all job postings
        </h1>
        <p style={{ color: '#888888', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Browse and claim available freelance opportunities
        </p>

        {/* Search Bar */}
        <div style={{ position: 'relative', maxWidth: '600px' }}>
          <input
            type="text"
            placeholder="Search by job title, description, tags, or employer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem 1rem 1rem 3rem',
              backgroundColor: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4c1d95';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#333333';
            }}
          />
          <div style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#888888',
            fontSize: '1.2rem'
          }}>
            🔍
          </div>
        </div>
      </section>

      {/* Jobs Grid */}
      <section style={{ padding: '0 2rem 2rem 2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {filteredJobs.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '3rem',
              backgroundColor: '#111111',
              borderRadius: '4px',
              border: '1px solid #333333'
            }}>
              <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>
                {searchQuery ? 'No jobs found matching your search' : 'No open jobs available'}
              </h3>
              <p style={{ color: '#888888', fontSize: '1rem' }}>
                {searchQuery ? 'Try adjusting your search terms' : 'Check back later for new opportunities'}
              </p>
            </div>
          ) : (
            filteredJobs.map(job => (
              <div key={job.id} style={{ position: 'relative' }}>
                <Link to={`/job/${job.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    backgroundColor: '#111111',
                    border: '1px solid #333333',
                    borderRadius: '4px',
                    padding: '1.25rem',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
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
                      <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: '600', margin: 0, flex: 1 }}>
                        {job.title}
                      </h3>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        backgroundColor: '#1a4d1a',
                        color: '#4ade80',
                        fontSize: '10px',
                        fontWeight: '600',
                        marginLeft: '0.5rem'
                      }}>
                        {job.status}
                      </span>
                    </div>
                    
                    <p style={{ color: '#888888', fontSize: '13px', marginBottom: '0.75rem', lineHeight: '1.5', flex: 1 }}>
                      {job.description.length > 120 ? `${job.description.substring(0, 120)}...` : job.description}
                    </p>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {job.tags.slice(0, 3).map(tag => (
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
                      {job.tags.length > 3 && (
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '8px',
                          backgroundColor: '#1a1a1a',
                          color: '#888888',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          +{job.tags.length - 3} more
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <span style={{ color: '#4c1d95', fontSize: '1.2rem', fontWeight: '700' }}>
                        {convertAndFormatCurrency(job.price, job.currency as Currency, userCurrency)}
                      </span>
                      <span style={{ color: '#666666', fontSize: '11px' }}>
                        {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
                
                {/* Claim Button */}
                <button
                  onClick={(e) => handleClaimClick(e, job)}
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
              </div>
            ))
          )}
        </div>
      </section>

      {/* Confirmation Alert */}
      {selectedJob && (
        <ConfirmationAlert
          isOpen={showConfirmation}
          onClose={handleCloseConfirmation}
          onMessageSeller={handleMessageSeller}
          onConfirm={handleConfirmClaim}
          jobTitle={selectedJob.title}
          jobPrice={convertAndFormatCurrency(selectedJob.price, selectedJob.currency as Currency, userCurrency)}
        />
      )}
    </div>
  );
};

export default AllPostings;
