// pages/CategoryPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { fetchCategoryVideos } from '../services/api';
import VideoList from '../components/video/VideoList';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';

const CategoryPage = () => {
  const { id } = useParams();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Fetch category videos
  const { 
    data: categoryData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery(
    ['category', id, page, limit],
    () => fetchCategoryVideos(parseInt(id), { page, limit }),
    { keepPreviousData: true }
  );

  // Update document title
  useEffect(() => {
    if (categoryData?.category?.name) {
      document.title = `${categoryData.category.name} Videos - SickVault`;
    }
    
    return () => {
      document.title = 'SickVault';
    };
  }, [categoryData]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div>
      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : isError ? (
        <ErrorDisplay 
          message={error?.message || 'Failed to load category videos'} 
          retry={refetch} 
        />
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              {categoryData?.category?.name || 'Category'} Videos
            </h1>
            {categoryData?.category?.description && (
              <p className="text-gray-600 dark:text-gray-400">
                {categoryData.category.description}
              </p>
            )}
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {categoryData?.pagination?.total} video{categoryData?.pagination?.total !== 1 ? 's' : ''} in this category
            </p>
          </div>
          
          <VideoList 
            videos={categoryData?.videos} 
            emptyMessage="No videos found in this category"
          />
          
          <Pagination
            currentPage={page}
            totalPages={categoryData?.pagination?.pages || 1}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default CategoryPage;