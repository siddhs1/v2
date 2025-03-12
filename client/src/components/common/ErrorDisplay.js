// components/common/ErrorDisplay.js
import React from 'react';

const ErrorDisplay = ({ message, retry, className = '' }) => {
  return (
    <div className={`rounded-lg bg-red-50 dark:bg-red-900/20 p-6 text-center ${className}`}>
      <p className="text-red-600 dark:text-red-400 mb-4">{message || 'An error occurred while loading data.'}</p>
      
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-200"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;