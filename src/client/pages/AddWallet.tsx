import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';

const AddWallet: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!label || !address) {
      return setError('All fields are required');
    }

    if (!userData) {
      return setError('You must be logged in to add a wallet');
    }

    try {
      setError('');
      setLoading(true);
      
      const response = await fetch(`http://localhost:3002/api/users/${userData.id}/wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ label, address }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add wallet');
      }

      // Navigate back to profile
      navigate(`/employer/${userData.id}`);
    } catch (error: any) {
      setError(error.message || 'Failed to add wallet');
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

      {/* Main Content */}
      <section style={{ padding: '3rem 2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ color: '#ffffff', fontSize: '2rem', fontWeight: '800', marginBottom: '2rem', textTransform: 'lowercase' }}>
          add wallet
        </h1>

        <div style={{
          backgroundColor: '#111111',
          padding: '2rem',
          borderRadius: '4px',
          border: '1px solid #333333'
        }}>
          {error && (
            <div style={{
              backgroundColor: '#2d1b1b',
              color: '#ff6b6b',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '1.5rem',
              border: '1px solid #ff6b6b'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cccccc', fontSize: '14px', fontWeight: '700' }}>
                label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., main wallet, savings"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #333333',
                  borderRadius: '2px',
                  fontSize: '16px',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4c1d95'}
                onBlur={(e) => e.target.style.borderColor = '#333333'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cccccc', fontSize: '14px', fontWeight: '700' }}>
                wallet address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., GB... (Stellar address)"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #333333',
                  borderRadius: '2px',
                  fontSize: '16px',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4c1d95'}
                onBlur={(e) => e.target.style.borderColor = '#333333'}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  backgroundColor: loading ? '#333333' : '#4c1d95',
                  color: 'white',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '2px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  textTransform: 'lowercase',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#3b0764';
                }}
                onMouseLeave={(e) => {
                  if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#4c1d95';
                }}
              >
                {loading ? 'adding...' : 'add wallet'}
              </button>
              
              <Link
                to={userData ? `/employer/${userData.id}` : '/'}
                style={{
                  flex: 1,
                  backgroundColor: '#333333',
                  color: 'white',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'block',
                  textTransform: 'lowercase'
                }}
              >
                cancel
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default AddWallet; 