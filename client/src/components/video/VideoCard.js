// components/video/VideoCard.js
import React, {useState} from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

// Helper function to format duration (e.g., "1:30")
const formatDuration = (seconds) => {
  if (isNaN(seconds) && !!seconds) return seconds;
  if (!seconds) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Helper to format view count
const formatViews = (count) => {
  if (!count) return '0 views';
  
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  }
  
  return `${count} views`;
};

const VideoCard = ({ video, className = '' }) => {
  const [intervalId, setIntervalId] = useState(null);

  const timeAgo = video.added 
    ? formatDistanceToNow(new Date(video.added), { addSuffix: true }) 
    : 'Unknown time';

    // const handleMouseEnter = (e) => {
    //   let currentIndex = parseInt(video.image_src.match(/(\d+)\.jpg$/)?.[1]) || 0;
    //   const thumbnailCount = video.type === "xrares" ? 20 : 8;
  
    //   const newIntervalId = setInterval(() => {
    //     if (currentIndex >= thumbnailCount) {
    //       currentIndex = 0;
    //     }
    //     currentIndex += 1;
    //     e.target.src = video.image_src.replace(/(\d+)\.jpg$/, `${currentIndex}.jpg`);
    //   }, 350);
  
    //   setIntervalId(newIntervalId);
    // };

    
    // const handleMouseLeave = (e) => {
    //   clearInterval(intervalId);
    //   setIntervalId(null);
    //   e.target.src = video.image_src; // Reset to original image
    // };
    
    const thumbnailCount = video.type === "xrares" ? 20 : 8;
    const handleMouseOver = (e) => {
      let currentIndex = parseInt(video.image_src.match(/(\d+)\.jpg$/)?.[1]) || 0;
      const newIntervalId = setInterval(() => {
        if (currentIndex >= thumbnailCount) {
          currentIndex = 0;
        }
        currentIndex += 1;
        e.target.src = video.image_src.replace(/(\d+)\.jpg$/, `${currentIndex}.jpg`);
      }, 350);
      setIntervalId(newIntervalId);
      console.log('handleMouseOver');
    };

    const handleMouseOut = (e) => {
      clearInterval(intervalId);
      setIntervalId(null);
      e.target.src = video.image_src; // Reset to original image
      console.log('handleMouseOut');
    };
  
  return (
    <div className={`flex flex-col rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 transition-transform duration-200 hover:scale-105 ${className}`}>
      <Link to={`/video/${video.video_id}`} className="block relative">
        <img 
          src={video.image_src || '/placeholder-image.jpg'} 
          alt={video.title} 
          className="w-full h-48 object-cover transition-opacity duration-200 hover:opacity-90"
          // onMouseEnter={handleMouseEnter}
          // onMouseLeave={handleMouseLeave}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          // onError={(e) => { e.target.src = '/placeholder-image.jpg' }}
        />
        {video.duration && (
          <span className="absolute bottom-2 right-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded">
            {formatDuration(video.duration)}
          </span>
        )}
      </Link>
      
      <div className="p-4 flex-grow">
        <Link to={`/video/${video.video_id}`}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 mb-1 line-clamp-2">
            {video.title}
          </h3>
        </Link>
        
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
          <span className="mr-3">{formatViews(video.views)}</span>
          <span>{timeAgo}</span>
        </div>
        
        {video.categories && video.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {video.categories.slice(0, 2).map(category => (
              <Link 
                key={`category-${category.id}`}
                to={`/category/${category.id}`}
                className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCard;