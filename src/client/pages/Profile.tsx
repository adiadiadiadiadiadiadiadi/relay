import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const { userCurrency } = useCurrency();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'settings'>('overview');

  // Mock data for demonstration
  const profileStats = {
    totalJobs: 12,
    completedJobs: 8,
    totalEarnings: 2450.75,
    rating: 4.8,
    reviews: 24
  };

  const recentJobs = [
    {
      id: '1',
      title: 'web development project',
      status: 'completed',
      earnings: 500,
      completedAt: '2024-01-15'
    },
    {
      id: '2',
      title: 'ui/ux design',
      status: 'in progress',
      earnings: 0,
      completedAt: null
    },
    {
      id: '3',
      title: 'mobile app development',
      status: 'completed',
      earnings: 750,
      completedAt: '2024-01-10'
    }
  ];

  if (!currentUser) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0a0a0a',
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
      }}>
        <Header />
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: '#ff6b6b' }}>please log in to view your profile</p>
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

      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Profile Header */}
        <div style={{
          backgroundColor: '#111111',
          border: '1px solid #333333',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
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
              {currentUser.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ color: '#ffffff', fontSize: '2rem', fontWeight: '800', margin: '0 0 0.5rem 0' }}>
                {currentUser.email.split('@')[0]}
              </h1>
              <p style={{ color: '#888888', fontSize: '14px', margin: 0 }}>
                {currentUser.email}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: '4px',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ color: '#4c1d95', fontSize: '2rem', fontWeight: '700' }}>
                {profileStats.totalJobs}
              </div>
              <div style={{ color: '#cccccc', fontSize: '14px' }}>
                total jobs
              </div>
            </div>
            <div style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: '4px',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ color: '#4c1d95', fontSize: '2rem', fontWeight: '700' }}>
                {profileStats.completedJobs}
              </div>
              <div style={{ color: '#cccccc', fontSize: '14px' }}>
                completed
              </div>
            </div>
            <div style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: '4px',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ color: '#4c1d95', fontSize: '2rem', fontWeight: '700' }}>
                {profileStats.totalEarnings.toFixed(2)} {userCurrency}
              </div>
              <div style={{ color: '#cccccc', fontSize: '14px' }}>
                total earnings
              </div>
            </div>
            <div style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: '4px',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ color: '#4c1d95', fontSize: '2rem', fontWeight: '700' }}>
                {profileStats.rating}
              </div>
              <div style={{ color: '#cccccc', fontSize: '14px' }}>
                rating ({profileStats.reviews} reviews)
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #333333'
        }}>
          {[
            { id: 'overview', label: 'overview' },
            { id: 'jobs', label: 'my jobs' },
            { id: 'settings', label: 'settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                backgroundColor: activeTab === tab.id ? '#4c1d95' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#888888',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '2rem'
          }}>
            <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
              recent activity
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentJobs.slice(0, 3).map(job => (
                <div key={job.id} style={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h3 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                      {job.title}
                    </h3>
                    <p style={{ color: '#888888', fontSize: '14px', margin: 0 }}>
                      {job.status === 'completed' ? `completed on ${job.completedAt}` : 'in progress'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#4c1d95', fontSize: '1.2rem', fontWeight: '700' }}>
                      {job.earnings > 0 ? `${job.earnings} ${userCurrency}` : 'pending'}
                    </div>
                    <div style={{
                      color: job.status === 'completed' ? '#4ade80' : '#60a5fa',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {job.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '2rem'
          }}>
            <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
              all jobs
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentJobs.map(job => (
                <div key={job.id} style={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h3 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                      {job.title}
                    </h3>
                    <p style={{ color: '#888888', fontSize: '14px', margin: 0 }}>
                      {job.status === 'completed' ? `completed on ${job.completedAt}` : 'in progress'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#4c1d95', fontSize: '1.2rem', fontWeight: '700' }}>
                      {job.earnings > 0 ? `${job.earnings} ${userCurrency}` : 'pending'}
                    </div>
                    <div style={{
                      color: job.status === 'completed' ? '#4ade80' : '#60a5fa',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {job.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '2rem'
          }}>
            <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
              account settings
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ color: '#cccccc', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
                  email address
                </label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #333333',
                    color: '#888888',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#cccccc', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
                  display name
                </label>
                <input
                  type="text"
                  value={currentUser.email.split('@')[0]}
                  disabled
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #333333',
                    color: '#888888',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#cccccc', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
                  preferred currency
                </label>
                <div style={{ color: '#4c1d95', fontSize: '16px', fontWeight: '600' }}>
                  {userCurrency}
                </div>
                <p style={{ color: '#888888', fontSize: '12px', margin: '0.25rem 0 0 0' }}>
                  change currency in the header dropdown
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
