// pages/TagPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { fetchTagVideos } from '../services/api';
import VideoList from '../components/video/VideoList';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';

const TagPage = () => {
  const { id } = useParams();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Fetch tag videos
  const { 
    data: tagData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery(
    ['tag', id, page, limit],
    () => fetchTagVideos(parseInt(id), { page, limit }),
    { keepPreviousData: true }
  );

  // Update document title
  useEffect(() => {
    if (tagData?.tag?.name) {
      document.title = `#${tagData.tag.name} Videos - SickVault`;
    }
    
    return () => {
      document.title = 'SickVault';
    };
  }, [tagData]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div>
      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : isError ? (
        <ErrorDisplay 
          message={error?.message || 'Failed to load tag videos'} 
          retry={refetch} 
        />
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              #{tagData?.tag?.name || 'Tag'} Videos
            </h1>
            {tagData?.tag?.description && (
              <p className="text-gray-600 dark:text-gray-400">
                {tagData.tag.description}
              </p>
            )}
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {tagData?.pagination?.total} video{tagData?.pagination?.total !== 1 ? 's' : ''} with this tag
            </p>
          </div>
          
          <VideoList 
            videos={tagData?.videos} 
            emptyMessage="No videos found with this tag"
          />
          
          <Pagination
            currentPage={page}
            totalPages={tagData?.pagination?.pages || 1}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default TagPage;