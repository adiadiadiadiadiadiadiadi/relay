import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface Wallet {
  id: string;
  address: string;
  label: string;
}

interface ConfirmationAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onMessageSeller: () => void;
  onConfirm?: (selectedWallet?: Wallet) => void;
  jobTitle: string;
  jobPrice: string;
}

const ConfirmationAlert: React.FC<ConfirmationAlertProps> = ({
  isOpen,
  onClose,
  onMessageSeller,
  onConfirm,
  jobTitle,
  jobPrice
}) => {
  const { currentUser, userData } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState<'confirm' | 'wallet' | 'success'>('confirm');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [loadingWallets, setLoadingWallets] = useState(false);

  // Reset to confirm step when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setSelectedWallet(null);
    }
  }, [isOpen]);

  // Auto-select first wallet when wallets are loaded
  React.useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(wallets[0]);
    }
  }, [wallets, selectedWallet]);

  // Fetch user wallets when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      fetchWallets();
    }
  }, [isOpen, currentUser]);

  const fetchWallets = async () => {
    if (!currentUser) return;
    
    try {
      setLoadingWallets(true);
      const response = await fetch(`http://localhost:3002/api/users/${userData?.id}/wallets`);
      if (response.ok) {
        const data = await response.json();
        setWallets(data);
      } else {
        console.error('Failed to fetch wallets');
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoadingWallets(false);
    }
  };

  // Redirect to login if modal opens for non-authenticated user
  React.useEffect(() => {
    if (isOpen && !currentUser) {
      onClose();
    }
  }, [isOpen, currentUser, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    // Check if user is logged in
    if (!currentUser) {
      onClose();
      return;
    }
    
    // Check if user has wallets
    if (wallets.length === 0) {
      showToast('You need to add a wallet before claiming jobs. Please add a wallet first.', 'error');
      onClose();
      return;
    }
    
    // Always show wallet selection step
    setStep('wallet');
  };

  const handleWalletSelect = (wallet: Wallet) => {
    setSelectedWallet(wallet);
  };

  const handleProceedWithWallet = () => {
    if (selectedWallet && onConfirm) {
      onConfirm(selectedWallet);
    }
    setStep('success');
  };

  const handleMessageSeller = () => {
    setStep('confirm');
    onMessageSeller();
  };

  const handleClose = () => {
    setStep('confirm');
    setSelectedWallet(null);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: '#111111',
        border: '1px solid #333333',
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: '#888888',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0.5rem',
            lineHeight: 1
          }}
        >
          ×
        </button>

        {/* Content */}
        <div style={{ marginBottom: '2rem' }}>
          {step === 'confirm' ? (
            <>
              <h2 style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem'
              }}>
                are you sure you want to claim this job?
              </h2>
              <p style={{
                color: '#cccccc',
                fontSize: '16px',
                marginBottom: '1rem',
                lineHeight: 1.5
              }}>
                you are about to claim this job:
              </p>
              <div style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333333',
                borderRadius: '4px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  color: '#ffffff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  {jobTitle}
                </h3>
                <p style={{
                  color: '#4c1d95',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  margin: 0
                }}>
                  {jobPrice}
                </p>
              </div>
              <p style={{
                color: '#cccccc',
                fontSize: '14px',
                marginBottom: '1.5rem'
              }}>
                once claimed, you will be able to start working on this project and communicate with the employer.
              </p>
            </>
          ) : step === 'wallet' ? (
            <>
              <h2 style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem'
              }}>
                select wallet
              </h2>
              <p style={{
                color: '#cccccc',
                fontSize: '16px',
                marginBottom: '1.5rem',
                lineHeight: 1.5
              }}>
                choose which wallet to use for this transaction:
              </p>
              
              {loadingWallets ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#888888'
                }}>
                  loading wallets...
                </div>
              ) : (
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  marginBottom: '1.5rem'
                }}>
                  {wallets.map(wallet => (
                    <div
                      key={wallet.id}
                      onClick={() => handleWalletSelect(wallet)}
                      style={{
                        backgroundColor: selectedWallet?.id === wallet.id ? '#4c1d95' : '#1a1a1a',
                        border: `1px solid ${selectedWallet?.id === wallet.id ? '#4c1d95' : '#333333'}`,
                        borderRadius: '4px',
                        padding: '1rem',
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedWallet?.id !== wallet.id) {
                          e.currentTarget.style.backgroundColor = '#2a2a2a';
                          e.currentTarget.style.borderColor = '#4c1d95';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedWallet?.id !== wallet.id) {
                          e.currentTarget.style.backgroundColor = '#1a1a1a';
                          e.currentTarget.style.borderColor = '#333333';
                        }
                      }}
                    >
                      <h4 style={{
                        color: '#ffffff',
                        fontSize: '1rem',
                        fontWeight: '600',
                        margin: '0 0 0.25rem 0'
                      }}>
                        {wallet.label}
                      </h4>
                      <p style={{
                        color: '#888888',
                        fontSize: '12px',
                        margin: 0,
                        fontFamily: 'monospace'
                      }}>
                        {wallet.address}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h2 style={{
                color: '#16a34a',
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem'
              }}>
                claimed successfully!
              </h2>
              <p style={{
                color: '#cccccc',
                fontSize: '16px',
                marginBottom: '1rem',
                lineHeight: 1.5
              }}>
                you have successfully claimed this job:
              </p>
              <div style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333333',
                borderRadius: '4px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  color: '#ffffff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  {jobTitle}
                </h3>
                <p style={{
                  color: '#4c1d95',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  margin: 0
                }}>
                  {jobPrice}
                </p>
              </div>
              <p style={{
                color: '#cccccc',
                fontSize: '14px',
                marginBottom: '1.5rem'
              }}>
                you can now start working on this project and communicate with the employer.
              </p>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          {step === 'confirm' ? (
            <>
              <button
                onClick={handleClose}
                style={{
                  backgroundColor: 'transparent',
                  color: '#888888',
                  border: '1px solid #333333',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                cancel
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  backgroundColor: '#4c1d95',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                yes, claim it
              </button>
            </>
          ) : step === 'wallet' ? (
            <>
              <button
                onClick={() => setStep('confirm')}
                style={{
                  backgroundColor: 'transparent',
                  color: '#888888',
                  border: '1px solid #333333',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                back
              </button>
              <button
                onClick={handleProceedWithWallet}
                disabled={!selectedWallet}
                style={{
                  backgroundColor: selectedWallet ? '#4c1d95' : '#333333',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: selectedWallet ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                proceed with wallet
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleClose}
                style={{
                  backgroundColor: 'transparent',
                  color: '#888888',
                  border: '1px solid #333333',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                close
              </button>
              <button
                onClick={handleMessageSeller}
                style={{
                  backgroundColor: '#4c1d95',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                message seller
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmationAlert;
