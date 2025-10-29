import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';
import { Currency } from '../utils/currencyConversion';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const PostJob: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const { userCurrency, setUserCurrency } = useCurrency();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState<Currency>('USDC');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showFormCurrencyDropdown, setShowFormCurrencyDropdown] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [wallets, setWallets] = useState<{id: string, address: string, label: string}[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [loadingWallets, setLoadingWallets] = useState(false);
  
  const availableTags = ['development', 'design', 'marketing', 'writing', 'blockchain', 'video', 'music', 'photography', 'consulting'];
  const currencies: Currency[] = ['USDC', 'EURC', 'GBPC', 'CHFC'];
  
  // Initialize form currency from user's preferred currency
  useEffect(() => {
    setCurrency(userCurrency);
  }, [userCurrency]);

  const fetchWallets = useCallback(async () => {
    if (!userData) return;
    
    try {
      setLoadingWallets(true);
      console.log('Fetching wallets for user:', userData?.id);
      const response = await fetch(`http://localhost:3002/api/users/${userData?.id}/wallets`);
      console.log('Wallets response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Wallets data:', data);
        setWallets(data);
        // Auto-select first wallet if available
        if (data.length > 0) {
          setSelectedWalletId(data[0].id);
          console.log('Selected wallet ID:', data[0].id);
        } else {
          console.warn('No wallets found for user');
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch wallets:', errorData);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoadingWallets(false);
    }
  }, [currentUser]);

  // Fetch user wallets
  useEffect(() => {
    if (currentUser) {
      fetchWallets();
    }
  }, [currentUser, fetchWallets]);



  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!selectedTags.includes(newTag)) {
        setSelectedTags(prev => [...prev, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTags.length === 0) {
      showToast('Please select at least one tag', 'error');
      return;
    }

    if (!currentUser) {
      showToast('You must be logged in to post a job', 'error');
      navigate('/login');
      return;
    }

    if (!selectedWalletId) {
      showToast('Please select a wallet to use for this job', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:3002/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employer_id: userData?.id,
          title,
          description,
          price: budget,
          currency,
          tags: selectedTags,
          name: userData?.name || currentUser?.email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post job');
      }

      const data = await response.json();
      console.log('Job posted successfully:', data);
      
      // Show success message
      showToast('Job posted successfully!', 'success');
      
      // Redirect to employer dashboard
      navigate(`/employer/${userData?.id}`);
      
    } catch (error: any) {
      console.error('Error posting job:', error);
      showToast(error.message || 'Failed to post job. Please try again.', 'error');
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
      <section style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ color: '#ffffff', fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>
          post a job
        </h2>
        <p style={{ color: '#888888', fontSize: '1rem', marginBottom: '2rem' }}>
          create a new job listing to find the perfect freelancer for your project
        </p>

        <form onSubmit={handleSubmit} style={{
          backgroundColor: '#111111',
          border: '1px solid #333333',
          borderRadius: '4px',
          padding: '2rem'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              color: '#cccccc', 
              fontSize: '14px', 
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              job title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., need a react developer"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333333',
                borderRadius: '2px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              color: '#cccccc', 
              fontSize: '14px', 
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              currency
            </label>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowFormCurrencyDropdown(!showFormCurrencyDropdown)}
                style={{
                  width: '100%',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333333',
                  color: '#ffffff',
                  padding: '12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>{currency}</span>
                <span style={{ fontSize: '10px' }}>▼</span>
              </button>
              {showFormCurrencyDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '0.25rem',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  zIndex: 1000,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
                }}>
                  {currencies.map(curr => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => {
                        setCurrency(curr);
                        setUserCurrency(curr);
                        setShowFormCurrencyDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: curr === currency ? '#4c1d95' : 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderBottom: '1px solid #333333'
                      }}
                      onMouseEnter={(e) => {
                        if (curr !== currency) {
                          e.currentTarget.style.backgroundColor = '#2a2a2a';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (curr !== currency) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              color: '#cccccc', 
              fontSize: '14px', 
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              select wallet
            </label>
            {loadingWallets ? (
              <div style={{
                padding: '12px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333333',
                borderRadius: '2px',
                color: '#888888',
                fontSize: '14px'
              }}>
                loading wallets...
              </div>
            ) : wallets.length === 0 ? (
              <div style={{
                padding: '12px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333333',
                borderRadius: '2px',
                color: '#888888',
                fontSize: '14px'
              }}>
                no wallets found. please add a wallet first.
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333333',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>
                    {wallets.find(w => w.id === selectedWalletId)?.label || 'Select wallet'} - {wallets.find(w => w.id === selectedWalletId)?.address.substring(0, 8) || ''}...
                  </span>
                  <span style={{ fontSize: '10px' }}>▼</span>
                </button>
                {showWalletDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.25rem',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333333',
                    borderRadius: '4px',
                    zIndex: 1000,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
                  }}>
                    {wallets.map(wallet => (
                      <button
                        key={wallet.id}
                        type="button"
                        onClick={() => {
                          setSelectedWalletId(wallet.id);
                          setShowWalletDropdown(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          backgroundColor: wallet.id === selectedWalletId ? '#4c1d95' : 'transparent',
                          border: 'none',
                          color: '#ffffff',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          borderBottom: '1px solid #333333'
                        }}
                        onMouseEnter={(e) => {
                          if (wallet.id !== selectedWalletId) {
                            e.currentTarget.style.backgroundColor = '#2a2a2a';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (wallet.id !== selectedWalletId) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {wallet.label} - {wallet.address.substring(0, 8)}...
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              color: '#cccccc', 
              fontSize: '14px', 
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              tags (select existing or type your own)
            </label>
            
            {/* Selected Tags with Inline Input */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              padding: '0.75rem',
              backgroundColor: '#0a0a0a',
              borderRadius: '4px',
              border: '1px solid #333333',
              minHeight: '50px',
              alignItems: 'center'
            }}>
              {selectedTags.map(tag => (
                <div
                  key={tag}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    backgroundColor: '#4c1d95',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '16px',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      outline: 'none'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              
              {/* Inline Tag Input */}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInput}
                placeholder={selectedTags.length === 0 ? "type a tag and press enter" : ""}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '6px 10px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Available Tags */}
            <div style={{ 
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid #1a1a1a'
            }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              {availableTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  disabled={selectedTags.includes(tag)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: '2px solid #333333',
                    backgroundColor: selectedTags.includes(tag) ? '#333333' : 'transparent',
                    color: selectedTags.includes(tag) ? '#888888' : '#cccccc',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: selectedTags.includes(tag) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none',
                    opacity: selectedTags.includes(tag) ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedTags.includes(tag)) {
                      e.currentTarget.style.borderColor = '#5a2ba5';
                      e.currentTarget.style.backgroundColor = '#1a1a1a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedTags.includes(tag)) {
                      e.currentTarget.style.borderColor = '#333333';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  + {tag}
                </button>
              ))}
            </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              color: '#cccccc', 
              fontSize: '14px', 
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              budget (in {currency.toLowerCase()})
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
              placeholder="e.g., 50"
              min="1"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333333',
                borderRadius: '2px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              color: '#cccccc', 
              fontSize: '14px', 
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={8}
              placeholder="describe your project, requirements, and any specific details..."
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333333',
                borderRadius: '2px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              backgroundColor: '#4c1d95',
              color: 'white',
              border: 'none',
              padding: '14px 24px',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5a2ba5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4c1d95';
            }}
          >
            post job
          </button>
        </form>
      </section>
    </div>
  );
};

export default PostJob;
