import React, { useState } from 'react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => void;
  personName: string;
  role: 'employer' | 'employee';
  jobTitle: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  personName, 
  role,
  jobTitle 
}) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    setSubmitting(true);
    await onSubmit(rating);
    setSubmitting(false);
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
      zIndex: 1000,
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#111111',
        border: '1px solid #333333',
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* X button in top right */}
        <button
          type="button"
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
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1a1a1a';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#888888';
          }}
        >
          ×
        </button>

        <h2 style={{ 
          color: '#ffffff', 
          fontSize: '1.5rem', 
          fontWeight: '800', 
          marginBottom: '1.5rem',
          textTransform: 'lowercase',
          paddingRight: '2rem'
        }}>
          rate {personName}
        </h2>

        {/* Star Rating */}
        <div style={{ 
          marginBottom: '1.5rem', 
          display: 'flex', 
          gap: '0.5rem',
          justifyContent: 'center'
        }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '2.5rem',
                color: star <= (hover || rating) ? '#fbbf24' : '#333333',
                transition: 'color 0.2s'
              }}
            >
              ★
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={rating === 0 || submitting}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: rating === 0 ? '#1a1a1a' : '#4c1d95',
              color: rating === 0 ? '#444444' : 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: rating === 0 ? 'not-allowed' : 'pointer',
              textTransform: 'lowercase',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (rating > 0) {
                e.currentTarget.style.backgroundColor = '#5b21b6';
              }
            }}
            onMouseLeave={(e) => {
              if (rating > 0) {
                e.currentTarget.style.backgroundColor = '#4c1d95';
              }
            }}
          >
            {submitting ? 'submitting...' : 'submit review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;

