// pages/ForYouPage.js
import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { fetchRecommendedVideos } from '../services/api';
import VideoList from '../components/video/VideoList';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';
import { getWatchHistoryIds } from '../utils/watchHistoryUtil';

const ForYouPage = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  
  // Get watch history data for recommendations
  const [watchHistory, setWatchHistory] = useState({
    videoIds: [],
    categoryIds: [],
    tagIds: []
  });
  
  // Load watch history on component mount
  useEffect(() => {
    setWatchHistory({
      videoIds: getWatchHistoryIds()
    });
  }, []);

  console.log('watchHistory', watchHistory);
  
  // Fetch recommended videos
  const { 
    data: recommendedData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery(
    ['recommended', page, limit, watchHistory],
    () => fetchRecommendedVideos({ 
      page, 
      limit, 
      watchedIds: watchHistory,
    }),
    { 
      keepPreviousData: true,
      enabled: watchHistory.videoIds?.length > 0
    }
  );
  
  // Update document title
  useEffect(() => {
    document.title = 'For You - SickVault';
    
    return () => {
      document.title = 'SickVault';
    };
  }, []);
  
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };
  
  // If no watch history, show a message
  if (watchHistory.videoIds?.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">For You</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            No Watch History Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Watch some videos to get personalized recommendations.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">For You</h1>
      
      {/* Content */}
      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : isError ? (
        <ErrorDisplay 
          message={error?.message || 'Failed to load recommended videos'} 
          retry={refetch} 
        />
      ) : (
        <>
          <VideoList 
            videos={recommendedData?.videos} 
            title="Recommended Videos"
            emptyMessage="No recommendations found. Try watching more videos."
          />
          
          <Pagination
            currentPage={page}
            totalPages={recommendedData?.pagination?.pages || 1}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default ForYouPage;