// services/api.js
const API_BASE_URL = 'http://localhost:3001/api';

// Helper function for API requests
const fetchAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Video API endpoints
export const fetchVideoById = async (id) => {
  return fetchAPI(`/videos/${id}`);
};

export const fetchExploreVideos = async ({ page = 1, limit = 20, category, tag }) => {
  let query = `?page=${page}&limit=${limit}`;
  
  if (category) query += `&category=${category}`;
  if (tag) query += `&tag=${tag}`;
  
  return fetchAPI(`/explore${query}`);
};

export const fetchTrendingVideos = async ({ page = 1, limit = 20, category, tag, period = 'week' }) => {
  let query = `?page=${page}&limit=${limit}&period=${period}`;
  
  if (category) query += `&category=${category}`;
  if (tag) query += `&tag=${tag}`;
  
  return fetchAPI(`/trending${query}`);
};

// New endpoint for "For You" recommendations
export const fetchRecommendedVideos = async ({ 
  page = 1, 
  limit = 20, 
  watchedIds = [], 
  categoryIds = [], 
  tagIds = [] 
}) => {
  const query = new URLSearchParams();
  query.append('page', page);
  query.append('limit', limit);
  
  // Add watched video IDs to exclude them from results
  console.log('watchedIds', watchedIds);
  if (watchedIds && watchedIds.videoIds.length > 0) {
    watchedIds.videoIds.forEach(id => query.append('watched', id));
  }
  
  // // Add category IDs for recommendation
  // if (categoryIds && categoryIds.length > 0) {
  //   categoryIds.forEach(id => query.append('category', id));
  // }
  
  // // Add tag IDs for recommendation
  // if (tagIds && tagIds.length > 0) {
  //   tagIds.forEach(id => query.append('tag', id));
  // }
  
  return fetchAPI(`/recommended?${query.toString()}`);
};

export const searchVideos = async ({ q, page = 1, limit = 20, category, tag }) => {
  let query = `?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`;
  
  if (category) query += `&category=${category}`;
  if (tag) query += `&tag=${tag}`;
  
  return fetchAPI(`/search${query}`);
};

// Categories and Tags API endpoints
export const fetchCategories = async () => {
  return fetchAPI('/categories');
};

export const fetchTags = async () => {
  return fetchAPI('/tags');
};

export const fetchCategoryVideos = async (categoryId, { page = 1, limit = 20 }) => {
  const query = `?page=${page}&limit=${limit}`;
  return fetchAPI(`/categories/${categoryId}/videos${query}`);
};

export const fetchTagVideos = async (tagId, { page = 1, limit = 20 }) => {
  const query = `?page=${page}&limit=${limit}`;
  return fetchAPI(`/tags/${tagId}/videos${query}`);
};


// Comments API endpoints
export const fetchVideoComments = async (videoId, page = 1, limit = 20, sort = 'newest') => {
  const response = await fetch(`${API_BASE_URL}/videos/${videoId}/comments?page=${page}&limit=${limit}&sort=${sort}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch comments');
  }
  
  return response.json();
};

export const addComment = async (commentData) => {
  const response = await fetch(`${API_BASE_URL}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commentData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add comment');
  }
  
  return response.json();
};

export const updateComment = async (commentId, commentText) => {
  const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment_text: commentText }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update comment');
  }
  
  return response.json();
};

export const deleteComment = async (commentId) => {
  const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete comment');
  }
  
  return response.json();
};

export const voteOnComment = async (commentId, vote) => {
  const response = await fetch(`${API_BASE_URL}/comments/${commentId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ vote }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to vote on comment');
  }
  
  return response.json();
};

export const fetchCommentReplies = async (commentId) => {
  const response = await fetch(`${API_BASE_URL}/comments/${commentId}/replies`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch comment replies');
  }
  
  return response.json();
};