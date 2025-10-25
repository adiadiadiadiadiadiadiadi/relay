import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useParams } from 'react-router-dom';
import Header from '../components/Header';

interface Job {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  tags: string[];
  status: string;
  created_at: string;
}

const EmployerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

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



  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
    }}>
      <Header />
      
      {/* Modified header for dashboard-specific buttons */}
      <div style={{
        backgroundColor: '#111111',
        borderBottom: '1px solid #333333',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderTop: '1px solid #333333'
      }}>
        <Link to="/post-job" style={{ 
          backgroundColor: '#4c1d95', 
          color: 'white', 
          padding: '8px 16px', 
          borderRadius: '2px', 
          textDecoration: 'none', 
          fontSize: '14px', 
          fontWeight: '600' 
        }}>
          post job
        </Link>
      </div>

      {/* Main Content */}
      <section style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ color: '#ffffff', fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>
          my job postings
        </h2>

        {loading ? (
          <p style={{ color: '#888888' }}>Loading...</p>
        ) : jobs.length === 0 ? (
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #333333',
            borderRadius: '4px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <p style={{ color: '#888888', fontSize: '1.1rem', marginBottom: '1rem' }}>
              no jobs posted yet
            </p>
            <Link to="/post-job" style={{
              backgroundColor: '#4c1d95',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '600',
              display: 'inline-block'
            }}>
              post your first job
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {jobs.map(job => (
              <div
                key={job.id}
                style={{
                  backgroundColor: '#111111',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  padding: '1.5rem',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(76, 29, 149, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <h3 style={{ color: '#ffffff', fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                  {job.title}
                </h3>
                <p style={{ color: '#888888', fontSize: '14px', marginBottom: '1rem', lineHeight: '1.5' }}>
                  {job.description}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {job.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        backgroundColor: '#1a1a1a',
                        color: '#4c1d95',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#4c1d95', fontSize: '1.5rem', fontWeight: '700' }}>
                    {Number(job.price).toFixed(2)} {job.currency}
                  </span>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    backgroundColor: job.status === 'open' ? '#1a4d1a' : '#4d1a1a',
                    color: job.status === 'open' ? '#4ade80' : '#f87171',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default EmployerDashboard;
