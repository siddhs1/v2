// pages/HomePage.js
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { fetchTrendingVideos, fetchCategories } from '../services/api';
import VideoList from '../components/video/VideoList';
import ForYouSection from '../components/video/ForYouSection'; // Import the ForYouSection
import ShowMoreButton from '../components/common/ShowMoreButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';

const HomePage = () => {
  const [period, setPeriod] = useState('week');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const limit = 8; // Limit to 8 videos per section on homepage

  // Fetch trending videos
  const { 
    data: trendingData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery(
    ['homeTrending', limit, period, selectedCategory],
    () => fetchTrendingVideos({ 
      page: 1, 
      limit, 
      category: selectedCategory, 
      period 
    })
  );

  // Fetch categories for filter
  const { data: categories } = useQuery('categories', fetchCategories);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId === 'all' ? null : parseInt(categoryId));
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-indigo-600 text-white rounded-lg p-8 mb-8">
        <h1 className="text-3xl font-bold mb-3">Welcome to SickVault</h1>
        <p className="text-lg opacity-90 mb-6">
          Discover trending videos and explore new content.
        </p>
      </div>

      {/* For You Section */}
      <ForYouSection limit={limit} />

      {/* Trending Section */}
      <div className="mb-10">
        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Trending Videos</h2>
          
          <div className="flex flex-wrap gap-3">
            <div>
              <select
                value={period}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
            
            <div>
              <select
                value={selectedCategory || 'all'}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <VideoList videos={trendingData?.videos} />
            <ShowMoreButton to="/trending" label="View All Trending Videos" />
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;