// pages/ExplorePage.js
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { fetchExploreVideos, fetchCategories, fetchTags } from '../services/api';
import VideoList from '../components/video/VideoList';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';

const ExplorePage = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);

  // Fetch explore videos
  const { 
    data: exploreData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery(
    ['explore', page, limit, selectedCategory, selectedTag],
    () => fetchExploreVideos({ 
      page, 
      limit, 
      category: selectedCategory, 
      tag: selectedTag 
    }),
    { keepPreviousData: true }
  );

  // Fetch categories and tags for filters
  const { data: categories } = useQuery('categories', fetchCategories);
  const { data: tags } = useQuery('tags', fetchTags);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId === 'all' ? null : parseInt(categoryId));
    setPage(1); // Reset to first page when changing category
  };

  const handleTagChange = (tagId) => {
    setSelectedTag(tagId === 'all' ? null : parseInt(tagId));
    setPage(1); // Reset to first page when changing tag
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Explore Videos</h1>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Filter Videos</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          
          <div>
            <label htmlFor="tag-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tag
            </label>
            <select
              id="tag-filter"
              value={selectedTag || 'all'}
              onChange={(e) => handleTagChange(e.target.value)}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Tags</option>
              {tags?.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
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
          message={error?.message || 'Failed to load videos'} 
          retry={refetch} 
        />
      ) : (
        <>
          <VideoList 
            videos={exploreData?.videos} 
            title="Latest Videos"
            emptyMessage="No videos found with the selected filters"
          />
          
          <Pagination
            currentPage={page}
            totalPages={exploreData?.pagination?.pages || 1}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default ExplorePage;