// src/components/common/ShowMoreButton.js
import React from 'react';
import { Link } from 'react-router-dom';

const ShowMoreButton = ({ to, label = "Show More", className = "" }) => {
  return (
    <div className={`flex justify-center mt-6 mb-8 ${className}`}>
      <Link 
        to={to} 
        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-200 flex items-center"
      >
        <span>{label}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 ml-2" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
            clipRule="evenodd" 
          />
        </svg>
      </Link>
    </div>
  );
};

export default ShowMoreButton;