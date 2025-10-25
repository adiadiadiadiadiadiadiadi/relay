import React from 'react';

interface ConfirmationAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onMessageSeller: () => void;
  jobTitle: string;
  jobPrice: string;
}

const ConfirmationAlert: React.FC<ConfirmationAlertProps> = ({
  isOpen,
  onClose,
  onMessageSeller,
  jobTitle,
  jobPrice
}) => {
  if (!isOpen) return null;

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
          onClick={onClose}
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
          <h2 style={{
            color: '#ffffff',
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '1rem'
          }}>
            claim confirmation
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
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
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
            onClick={onMessageSeller}
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
        </div>
      </div>
    </div>
  );
};

export default ConfirmationAlert;
