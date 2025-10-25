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

const Home: React.FC = () => {
  const { currentUser } = useAuth();
  const { userCurrency } = useCurrency();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/jobs');
      const data = await response.json();
      
      // If user is logged in, filter out their own jobs
      let filteredJobs = data;
      if (currentUser) {
        filteredJobs = data.filter((job: Job) => job.employer_id !== currentUser.id.toString());
      }
      
      // Get the 9 most recent jobs
      const recentJobs = filteredJobs.slice(0, 9);
      setJobs(recentJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimClick = (e: React.MouseEvent, job: Job) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedJob(job);
    setShowConfirmation(true);
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

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
    }}>
      <Header />

      {/* Hero Section */}
      <section style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        backgroundColor: '#111111',
        margin: '2rem',
        borderRadius: '4px',
        border: '1px solid #333333'
      }}>
        <h2 style={{ color: '#ffffff', fontSize: '3rem', fontWeight: '800', marginBottom: '1rem' }}>
          find freelance services
        </h2>
        <p style={{ color: '#cccccc', fontSize: '1.2rem', marginBottom: '2rem' }}>
          connect with top freelancers and pay with stablecoins
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/services" style={{ textDecoration: 'none' }}>
            <button style={{
              backgroundColor: '#4c1d95',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              browse services
            </button>
          </Link>
          <button 
            onClick={() => currentUser ? navigate('/post-job') : navigate('/login')}
            style={{
              backgroundColor: 'transparent',
              color: '#4c1d95',
              border: '2px solid #4c1d95',
              padding: '10px 24px',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            post a job
          </button>
        </div>
      </section>

      {/* Services Grid */}
      <section style={{ padding: '2rem' }}>
        <h3 style={{ color: '#ffffff', fontSize: '2rem', fontWeight: '700', marginBottom: '2rem', textAlign: 'left' }}>
          latest job postings
        </h3>
        {loading ? (
          <p style={{ color: '#888888', textAlign: 'center' }}>loading...</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem'
          }}>
            {jobs.map(job => (
              <Link key={job.id} to={`/job/${job.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: '#111111',
                border: '1px solid #333333',
                borderRadius: '4px',
                padding: '1.5rem',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(76, 29, 149, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h4 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                    {job.title}
                  </h4>
                  <span style={{ color: '#4c1d95', fontSize: '1.2rem', fontWeight: '700' }}>
                    {convertAndFormatCurrency(job.price, job.currency as Currency, userCurrency)}
                  </span>
                </div>
                <p style={{ color: '#888888', fontSize: '14px', marginBottom: '1rem' }}>
                  {job.description.length > 100 ? `${job.description.substring(0, 100)}...` : job.description}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {job.tags.slice(0, 3).map(tag => (
                    <span key={tag} style={{
                      padding: '3px 8px',
                      borderRadius: '8px',
                      backgroundColor: '#1a1a1a',
                      color: '#4c1d95',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
                    <span style={{ color: '#666666', fontSize: '11px' }}>
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => handleClaimClick(e, job)}
                    style={{
                      backgroundColor: '#4c1d95',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    claim
                  </button>
                </div>
              </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Confirmation Alert */}
      {selectedJob && (
        <ConfirmationAlert
          isOpen={showConfirmation}
          onClose={handleCloseConfirmation}
          onMessageSeller={handleMessageSeller}
          jobTitle={selectedJob.title}
          jobPrice={convertAndFormatCurrency(selectedJob.price, selectedJob.currency as Currency, userCurrency)}
        />
      )}
    </div>
  );
};

export default Home;
