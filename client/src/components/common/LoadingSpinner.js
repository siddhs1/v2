// components/common/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`${sizeClasses[size]} border-4 border-t-indigo-600 border-r-indigo-200 border-b-indigo-400 border-l-indigo-100 rounded-full animate-spin`}></div>
    </div>
  );
};

export default LoadingSpinner;