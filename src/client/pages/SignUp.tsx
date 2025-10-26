import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/home');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password, name);
      navigate('/home');
    } catch (error: any) {
      setError('Failed to create an account');
      console.error('Signup error:', error);
    }

    setLoading(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#0a0a0a',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#111111',
        padding: '3rem',
        borderRadius: '4px',
        border: '1px solid #333333',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ textAlign: 'left', marginBottom: '2rem', color: '#ffffff', fontSize: '2rem', fontWeight: '800' }}>
          sign up
        </h2>
        
        {error && (
          <div style={{
            backgroundColor: '#2d1b1b',
            color: '#ff6b6b',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '1rem',
            textAlign: 'center',
            border: '1px solid #ff6b6b'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cccccc', fontSize: '14px', fontWeight: '700' }}>
              name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#333333' : '#4c1d95',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '1.5rem',
              transition: 'background-color 0.2s',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(76, 29, 149, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#3b0764';
            }}
            onMouseLeave={(e) => {
              if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#4c1d95';
            }}
          >
            {loading ? 'creating account...' : 'sign up'}
          </button>
        </form>

        <div style={{ textAlign: 'left' }}>
          <p style={{ color: '#888888', fontSize: '14px' }}>
            already have an account?{' '}
            <Link 
              to="/login" 
              style={{ 
                color: '#4c1d95', 
                textDecoration: 'none',
                fontWeight: '700',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#3b0764'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#4c1d95'}
            >
              log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
