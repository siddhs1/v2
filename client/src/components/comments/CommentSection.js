// components/comments/CommentSection.js
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { fetchVideoComments } from '../../services/api';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorDisplay from '../common/ErrorDisplay';

const CommentSection = ({ videoId }) => {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const COMMENTS_PER_PAGE = 10;
  
  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery(
    ['videoComments', videoId, page, sort],
    () => fetchVideoComments(videoId, page, COMMENTS_PER_PAGE, sort),
    {
      keepPreviousData: true
    }
  );
  
  const handleSortChange = (e) => {
    setSort(e.target.value);
    setPage(1); // Reset to first page when changing sort
  };
  
  const handleLoadMore = () => {
    if (data?.pagination && page < data.pagination.pages) {
      setPage(prev => prev + 1);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
        Comments
      </h2>
      
      {/* Comment form */}
      <CommentForm videoId={videoId} />
      
      {/* Sort options */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {data?.pagination?.total || 0} comments
        </div>
        <select
          value={sort}
          onChange={handleSortChange}
          className="px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="most_points">Most Liked</option>
        </select>
      </div>
      
      {/* Comments list */}
      {isLoading && page === 1 ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <ErrorDisplay 
          message={error?.message || 'Failed to load comments'} 
          retry={refetch} 
        />
      ) : data?.comments?.length > 0 ? (
        <>
          <div className="space-y-4">
            {data.comments
              .map(comment => (
                <CommentItem 
                  key={comment.comment_id} 
                  comment={comment} 
                  videoId={videoId} 
                />
              ))}
          </div>
          
          {/* Pagination */}
          {data.pagination && page < data.pagination.pages && (
            <div className="mt-6 text-center">
              <button 
                onClick={handleLoadMore}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Loading...</span>
                  </span>
                ) : (
                  'Load More Comments'
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-center py-10 text-gray-500 dark:text-gray-400">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
};

export default CommentSection;