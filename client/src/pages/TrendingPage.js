// pages/TrendingPage.js
import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { fetchTrendingVideos, fetchCategories } from '../services/api';
import VideoList from '../components/video/VideoList';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';

const TrendingPage = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [period, setPeriod] = useState('week');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch trending videos
  const { 
    data: trendingData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery(
    ['trending', page, limit, period, selectedCategory],
    () => fetchTrendingVideos({ 
      page, 
      limit, 
      category: selectedCategory, 
      period 
    }),
    { keepPreviousData: true }
  );

  // Fetch categories for filter
  const { data: categories } = useQuery('categories', fetchCategories);

  // Update document title
  useEffect(() => {
    document.title = 'Trending Videos - SickVault';
    
    return () => {
      document.title = 'SickVault';
    };
  }, []);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setPage(1); // Reset to first page when changing period
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId === 'all' ? null : parseInt(categoryId));
    setPage(1); // Reset to first page when changing category
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Trending Videos</h1>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Filter Videos</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="period-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Period
            </label>
            <select
              id="period-filter"
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              id="category-filter"
              value={selectedCategory || 'all'}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories?.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : isError ? (
        <ErrorDisplay 
          message={error?.message || 'Failed to load trending videos'} 
          retry={refetch} 
        />
      ) : (
        <>
          <VideoList 
            videos={trendingData?.videos} 
            emptyMessage="No trending videos found with the selected filters"
          />
          
          <Pagination
            currentPage={page}
            totalPages={trendingData?.pagination?.pages || 1}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default TrendingPage;