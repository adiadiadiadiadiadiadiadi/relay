import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Currency } from '../utils/currencyConversion';
import Logo from './Logo';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { userCurrency, setUserCurrency } = useCurrency();
  const navigate = useNavigate();
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  
  const currencies: Currency[] = ['USDC', 'EURC', 'GBPC', 'CHFC'];
  
  // Generate a display name from email (first part before @)
  const getUserDisplayName = () => {
    if (!currentUser?.email) return 'User';
    return currentUser.email.split('@')[0];
  };

  // Fetch notifications
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`http://localhost:3002/api/users/${currentUser.id}/notifications`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setHasUnreadNotifications(data.some((notif: any) => notif.read === 0 || notif.read === false));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
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
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false);
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
    setShowNotificationDropdown(false);
  };

  const handleNotificationToggle = () => {
    setShowNotificationDropdown(!showNotificationDropdown);
    setShowCurrencyDropdown(false);
    setShowUserDropdown(false);
    
    // Mark notifications as read when dropdown is opened
    if (!showNotificationDropdown && hasUnreadNotifications) {
      markNotificationsAsRead();
    }
  };

  const markNotificationsAsRead = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`http://localhost:3002/api/users/${currentUser.id}/notifications/read`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        setHasUnreadNotifications(false);
        setNotifications(prev => prev.map(notif => ({ ...notif, read: 1 })));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Close notification dropdown
    setShowNotificationDropdown(false);
    
    // Check if it's a job claim notification
    if (notification.type === 'job_claim' && notification.message.includes('has been claimed')) {
      // Extract job title from the notification message
      const jobTitleMatch = notification.message.match(/"([^"]+)"/);
      const jobTitle = jobTitleMatch ? jobTitleMatch[1] : 'Unknown Job';
      
      try {
        // Fetch job details to get the employee (claimer) information
        const response = await fetch(`http://localhost:3002/api/jobs`);
        if (response.ok) {
          const jobs = await response.json();
          const claimedJob = jobs.find((job: any) => job.title === jobTitle && job.status === 'in_progress');
          
          if (claimedJob && claimedJob.employee_id) {
            // Fetch employee details
            const employeeResponse = await fetch(`http://localhost:3002/api/users/${claimedJob.employee_id}`);
            if (employeeResponse.ok) {
              const employee = await employeeResponse.json();
              
              // Navigate to messages with actual employee info
              navigate('/messages', {
                state: {
                  startConversationWith: {
                    name: employee.name || employee.email?.split('@')[0] || 'Job Claimer',
                    email: employee.email || `${employee.id}@example.com`,
                    jobTitle: jobTitle,
                    notificationType: 'job_claim',
                    employeeId: employee.id
                  }
                }
              });
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching job/employee details:', error);
      }
      
      // Fallback: Navigate with basic info
      navigate('/messages', {
        state: {
          startConversationWith: {
            name: 'Job Claimer',
            email: 'claimer@example.com',
            jobTitle: jobTitle,
            notificationType: 'job_claim'
          }
        }
      });
    }
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
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Logo />
        </Link>
        
        {/* Navigation Links */}
        {currentUser && (
          <nav style={{ display: 'flex', gap: '1.5rem' }}>
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
            {/* Notifications Button */}
            <div ref={notificationDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={handleNotificationToggle}
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
                  height: '36px',
                  position: 'relative'
                }}
                title="Notifications"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {hasUnreadNotifications && (
                  <div style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#ff4444',
                    borderRadius: '50%',
                    border: '2px solid #111111'
                  }} />
                )}
              </button>
              
              {showNotificationDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  minWidth: '300px',
                  maxHeight: '400px',
                  zIndex: 1000,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
                }}>
                  <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid #333333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <h3 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600', margin: 0 }}>
                      notifications
                    </h3>
                    <button
                      onClick={() => setShowNotificationDropdown(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#888888',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      <p style={{ color: '#888888', fontSize: '14px', margin: 0 }}>
                        no notifications
                      </p>
                    </div>
                  ) : (
                    <div 
                      className="notification-scroll-container"
                      style={{
                        maxHeight: '240px', // Height for ~3 notifications (80px each)
                        overflowY: 'auto',
                        scrollbarWidth: 'none', // Firefox
                        msOverflowStyle: 'none' // IE/Edge
                      }}
                    >
                      {notifications.map((notification, index) => (
                        <div
                          key={notification.id || index}
                          onClick={() => handleNotificationClick(notification)}
                          style={{
                            padding: '1rem',
                            borderBottom: '1px solid #333333',
                            backgroundColor: (notification.read === 1 || notification.read === true) ? 'transparent' : '#1a1a1a',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            minHeight: '80px' // Ensure consistent height for scrolling
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#2a2a2a';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = (notification.read === 1 || notification.read === true) ? 'transparent' : '#1a1a1a';
                          }}
                        >
                          <p style={{ 
                            color: '#ffffff', 
                            fontSize: '13px', 
                            margin: '0 0 0.5rem 0',
                            fontWeight: (notification.read === 1 || notification.read === true) ? '400' : '600',
                            lineHeight: '1.3'
                          }}>
                            {notification.message}
                          </p>
                          <p style={{ 
                            color: '#888888', 
                            fontSize: '11px', 
                            margin: 0 
                          }}>
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Custom scrollbar styles */}
                  <style>
                    {`
                      .notification-scroll-container::-webkit-scrollbar {
                        display: none;
                      }
                    `}
                  </style>
                </div>
              )}
            </div>

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
