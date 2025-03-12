// src/utils/watchHistoryUtil.js

const WATCH_HISTORY_KEY = 'sickvault_watch_history';
const MAX_HISTORY_ITEMS = 20; // Maximum number of videos to store in history

/**
 * Add a video to watch history in local storage
 * @param {Object} video - The video object to add to history
 */
export const addToWatchHistory = (video) => {
  try {
    // Get current history
    const history = getWatchHistory();
    
    // Remove the video if it already exists (to avoid duplicates)
    const filteredHistory = history.filter(item => item.video_id !== video.video_id);
    
    // Add the new video to the beginning of the array
    const updatedHistory = [video.video_id, ...filteredHistory];
    
    // Limit the history to MAX_HISTORY_ITEMS
    const limitedHistory = updatedHistory.slice(0, MAX_HISTORY_ITEMS);
    
    // Save to local storage
    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(limitedHistory));
    
    return limitedHistory;
  } catch (error) {
    console.error('Error adding to watch history:', error);
    return [];
  }
};

/**
 * Get the watch history from local storage
 * @returns {Array} The array of watched videos
 */
export const getWatchHistory = () => {
  try {
    const history = localStorage.getItem(WATCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error retrieving watch history:', error);
    return [];
  }
};

/**
 * Clear the watch history from local storage
 */
export const clearWatchHistory = () => {
  try {
    localStorage.removeItem(WATCH_HISTORY_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing watch history:', error);
    return false;
  }
};

/**
 * Get video IDs from watch history for recommendations
 * @returns {Array} Array of video IDs from watch history
 */
export const getWatchHistoryIds = () => {
  const history = getWatchHistory();
  return history.map(video => video);
};

// /**
//  * Get category IDs from watch history for recommendations
//  * @returns {Array} Array of unique category IDs from watch history
//  */
// export const getWatchHistoryCategoryIds = () => {
//   const history = getWatchHistory();
//   // Flatten the array of category arrays and get unique IDs
//   const categoryIds = history.flatMap(video => 
//     video.categories?.map(cat => typeof cat === 'object' ? cat.id : cat) || []
//   );
//   return [...new Set(categoryIds)]; // Remove duplicates
// };

// /**
//  * Get tag IDs from watch history for recommendations
//  * @returns {Array} Array of unique tag IDs from watch history
//  */
// export const getWatchHistoryTagIds = () => {
//   const history = getWatchHistory();
//   // Flatten the array of tag arrays and get unique IDs
//   const tagIds = history.flatMap(video => 
//     video.tags?.map(tag => typeof tag === 'object' ? tag.id : tag) || []
//   );
//   return [...new Set(tagIds)]; // Remove duplicates
// };