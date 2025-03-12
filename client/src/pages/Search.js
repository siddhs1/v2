// pages/SearchPage.js
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { searchVideos, fetchCategories, fetchTags } from '../services/api';
import VideoList from '../components/video/VideoList';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [limit] = useState(20);
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') ? parseInt(searchParams.get('category')) : null
  );
  const [selectedTag, setSelectedTag] = useState(
    searchParams.get('tag') ? parseInt(searchParams.get('tag')) : null
  );

  // Update query params when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    
    if (selectedCategory) {
      params.set('category', selectedCategory.toString());
    } else {
      params.delete('category');
    }
    
    if (selectedTag) {
      params.set('tag', selectedTag.toString());
    } else {
      params.delete('tag');
    }
    
    setSearchParams(params);
  }, [page, selectedCategory, selectedTag]);

  // Fetch search results
  const { 
    data: searchResults, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery(
    ['search', searchQuery, page, limit, selectedCategory, selectedTag],
    () => searchVideos({ 
      q: searchQuery, 
      page, 
      limit, 
      category: selectedCategory, 
      tag: selectedTag 
    }),
    { 
      keepPreviousData: true,
      enabled: searchQuery.trim().length > 0
    }
  );

  // Fetch categories and tags for filters
  const { data: categories } = useQuery('categories', fetchCategories);
  const { data: tags } = useQuery('tags', fetchTags);

  // Update document title
  useEffect(() => {
    document.title = `Search: ${searchQuery} - SickVault`;
    
    return () => {
      document.title = 'SickVault';
    };
  }, [searchQuery]);

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

  if (!searchQuery.trim()) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Search Videos
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Please enter a search term to find videos
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
        Search Results: "{searchQuery}"
      </h1>
      
      {searchResults?.pagination?.total > 0 && (
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Found {searchResults.pagination.total} video{searchResults.pagination.total !== 1 ? 's' : ''}
        </p>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <select
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
            <select
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

      {/* Results */}
      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : isError ? (
        <ErrorDisplay 
          message={error?.message || 'Failed to load search results'} 
          retry={refetch} 
        />
      ) : (
        <>
          <VideoList 
            videos={searchResults?.videos} 
            emptyMessage={`No videos found matching "${searchQuery}"`}
          />
          
          <Pagination
            currentPage={page}
            totalPages={searchResults?.pagination?.pages || 1}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default SearchPage;