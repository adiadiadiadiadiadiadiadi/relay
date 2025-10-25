import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Currency } from '../utils/currencyConversion';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { userCurrency, setUserCurrency } = useCurrency();
  const navigate = useNavigate();
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  
  const currencies: Currency[] = ['USDC', 'EURC', 'GBPC', 'CHFC'];
  
  // Generate a display name from email (first part before @)
  const getUserDisplayName = () => {
    if (!currentUser?.email) return 'User';
    return currentUser.email.split('@')[0];
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleUserCurrencyChange = (newCurrency: Currency) => {
    setUserCurrency(newCurrency);
    setShowCurrencyDropdown(false);
  };

  const handleViewProfile = () => {
    setShowUserDropdown(false);
    navigate(`/employer/${currentUser?.id}`);
  };

  const handleUserDropdownToggle = () => {
    setShowUserDropdown(!showUserDropdown);
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>
            stellar marketplace
          </h1>
        </Link>
        
        {/* Navigation Links */}
        {currentUser && (
          <nav style={{ display: 'flex', gap: '1.5rem' }}>
            <Link 
              to="/" 
              style={{ 
                color: '#cccccc', 
                textDecoration: 'none', 
                fontSize: '14px',
                fontWeight: '500',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#cccccc'}
            >
              home
            </Link>
            <Link 
              to="/all-postings" 
              style={{ 
                color: '#cccccc', 
                textDecoration: 'none', 
                fontSize: '14px',
                fontWeight: '500',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#cccccc'}
            >
              all postings
            </Link>
            <Link 
              to="/services" 
              style={{ 
                color: '#cccccc', 
                textDecoration: 'none', 
                fontSize: '14px',
                fontWeight: '500',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#cccccc'}
            >
              services
            </Link>
            <Link 
              to="/post-job" 
              style={{ 
                color: '#cccccc', 
                textDecoration: 'none', 
                fontSize: '14px',
                fontWeight: '500',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#cccccc'}
            >
              post job
            </Link>
          </nav>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {currentUser ? (
          <>
            {/* Messages Button */}
            <button
              onClick={() => navigate('/messages')}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#cccccc',
                padding: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px'
              }}
              title="Messages"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div ref={userDropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={handleUserDropdownToggle}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#cccccc',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}
                >
                  {getUserDisplayName()} ▼
                </button>
                {showUserDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.25rem',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333333',
                    borderRadius: '4px',
                    minWidth: '150px',
                    zIndex: 1000
                  }}>
                    <button
                      type="button"
                      onClick={handleViewProfile}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderBottom: '1px solid #333333'
                      }}
                    >
                      view profile
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      log out
                    </button>
                  </div>
                )}
              </div>
              <div ref={currencyDropdownRef} style={{ position: 'relative' }}>
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
