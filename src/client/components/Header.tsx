import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [userCurrency, setUserCurrency] = useState('USDC');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  
  const currencies = ['USDC', 'EURC', 'GBPC', 'CHFC'];

  // Initialize user currency from localStorage or default to USDC
  useEffect(() => {
    const savedCurrency = localStorage.getItem('userCurrency');
    if (savedCurrency) {
      setUserCurrency(savedCurrency);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleUserCurrencyChange = (newCurrency: string) => {
    setUserCurrency(newCurrency);
    localStorage.setItem('userCurrency', newCurrency);
    setShowCurrencyDropdown(false);
  };

  return (
    <header style={{
      backgroundColor: '#111111',
      borderBottom: '1px solid #333333',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <h1 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>
          stellar marketplace
        </h1>
      </Link>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {currentUser ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: '#cccccc', fontSize: '14px' }}>
                {currentUser.email}
              </span>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333333',
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {userCurrency} ▼
                </button>
                {showCurrencyDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.25rem',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333333',
                    borderRadius: '4px',
                    minWidth: '100px',
                    zIndex: 1000
                  }}>
                    {currencies.map(curr => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => handleUserCurrencyChange(curr)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          backgroundColor: curr === userCurrency ? '#4c1d95' : 'transparent',
                          border: 'none',
                          color: '#ffffff',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
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
              logout
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/login" style={{ color: '#4c1d95', textDecoration: 'none', fontWeight: '600' }}>
              log in
            </Link>
            <Link to="/signup" style={{ color: '#4c1d95', textDecoration: 'none', fontWeight: '600' }}>
              sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
