import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { convertAndFormatCurrency, Currency } from '../utils/currencyConversion';
import { useNavigate, Link, useParams } from 'react-router-dom';
import Header from '../components/Header';

interface Job {
  id: string;
  title: string;
  description: string;
  price: number | string;
  currency: string;
  tags: string[];
  status: string;
  created_at: string;
}

const EmployerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { userCurrency } = useCurrency();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  
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

  const fetchJobs = async (employerId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3002/api/jobs`);
      const allJobs = await response.json();
      // Filter jobs by employer_id
      const employerJobs = allJobs.filter((job: any) => job.employer_id === employerId);
      setJobs(employerJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Categorize jobs
  const openJobs = jobs.filter(job => job.status === 'open');
  const currentJobs = jobs.filter(job => job.status === 'in_progress' || job.status === 'submitted');
  const pastJobs = jobs.filter(job => job.status === 'completed' || job.status === 'cancelled');

  const renderJobCard = (job: Job) => (
    <Link key={job.id} to={`/job/${job.id}`} style={{ textDecoration: 'none' }}>
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
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
    }}>
      <Header />

      {/* Profile Title */}
      <div style={{ padding: '2rem 2rem 1rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ color: '#ffffff', fontSize: '2rem', fontWeight: '800', margin: 0, textTransform: 'lowercase' }}>
          {currentUser?.name || currentUser?.email}'s profile
        </h1>
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
                <h3 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                  wallet
                </h3>
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
            
            {/* Open Jobs */}
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
                open jobs
                <span style={{ 
                  backgroundColor: '#1a4d1a', 
                  color: '#4ade80', 
                  fontSize: '12px', 
                  padding: '2px 8px', 
                  borderRadius: '10px',
                  fontWeight: '600'
                }}>
                  {openJobs.length}
                </span>
              </h2>
              {loading ? (
                <p style={{ color: '#888888' }}>loading...</p>
              ) : openJobs.length === 0 ? (
                <div style={{
                  backgroundColor: '#111111',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  padding: '2rem',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#888888', fontSize: '14px' }}>
                    no open jobs
                  </p>
                </div>
              ) : (
                openJobs.map(renderJobCard)
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
                currentJobs.map(renderJobCard)
              )}
            </div>

            {/* Past Jobs */}
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
                past jobs
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
                pastJobs.map(renderJobCard)
              )}
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default EmployerDashboard;
