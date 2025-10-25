import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const NoAccess: React.FC = () => {
  const navigate = useNavigate();

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
        textAlign: 'left',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
        
        <h1 style={{ 
          color: '#ffffff', 
          marginBottom: '1rem', 
          fontSize: '2rem', 
          fontWeight: '800' 
        }}>
          access denied
        </h1>
        
        <p style={{ 
          color: '#cccccc', 
          marginBottom: '2rem', 
          fontSize: '1.1rem',
          lineHeight: '1.5'
        }}>
          You need to be logged in to access this page.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '800',
              transition: 'background-color 0.2s',
              boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)'
            }}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#0056b3'}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#007bff'}
          >
            Log In
          </button>
          
          <button
            onClick={() => navigate('/signup')}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '800',
              transition: 'background-color 0.2s',
              boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)'
            }}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#1e7e34'}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#28a745'}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoAccess;
