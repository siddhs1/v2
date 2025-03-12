// components/layout/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white dark:bg-gray-800 shadow-md mt-10">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="text-indigo-600 dark:text-indigo-400 font-bold text-xl">
              SickVault
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Your go-to platform for streaming videos
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center space-x-4">
            <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">
              Home
            </Link>
            <Link to="/explore" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">
              Explore
            </Link>
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">
              Terms
            </a>
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">
              Privacy
            </a>
          </div>
        </div>
        
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {currentYear} SickVault. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;