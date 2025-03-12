// components/video/ForYouSection.js
import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { fetchRecommendedVideos } from '../../services/api';
import VideoList from './VideoList';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorDisplay from '../common/ErrorDisplay';
import ShowMoreButton from '../common/ShowMoreButton';
import { getWatchHistoryIds } from '../../utils/watchHistoryUtil';

const ForYouSection = ({ limit = 8 }) => {
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
  
  // Fetch recommended videos
  const { 
    data: recommendedData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery(
    ['homeRecommended', limit, watchHistory],
    () => fetchRecommendedVideos({ 
      page: 1, 
      limit, 
      watchedIds: watchHistory,
    }),
    { 
      enabled: watchHistory.videoIds.length > 0
    }
  );
  
  // If no watch history or no results, don't show the section
  if ((watchHistory.videoIds.length === 0) || 
      (recommendedData?.videos?.length === 0)) {
    return null;
  }
  
  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">For You</h2>
      </div>
      
      {isLoading ? (
        <LoadingSpinner className="py-10" />
      ) : isError ? (
        <ErrorDisplay 
          message={error?.message || 'Failed to load recommendations'} 
          retry={refetch} 
          className="py-6"
        />
      ) : recommendedData?.videos?.length > 0 ? (
        <>
          <VideoList videos={recommendedData.videos} />
          <ShowMoreButton to="/for-you" label="View All Recommendations" />
        </>
      ) : null}
    </div>
  );
};

export default ForYouSection;