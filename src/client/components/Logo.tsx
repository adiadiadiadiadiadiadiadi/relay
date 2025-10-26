import React from 'react';

const Logo: React.FC = () => {
  return (
    <svg width="120" height="32" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Trapezoid (left shape) */}
      <path d="M8 8 L12 8 L14 16 L6 16 Z" fill="white" />
      
      {/* Triangle (right shape) */}
      <path d="M18 8 L28 12 L18 16 Z" fill="white" />
    </svg>
  );
};

export default Logo;

