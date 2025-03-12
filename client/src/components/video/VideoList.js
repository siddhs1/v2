// components/video/VideoList.js
import React from 'react';
import VideoCard from './VideoCard';

const VideoList = ({ videos, title, className = '', emptyMessage = 'No videos found' }) => {
  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{title}</h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map((video) => (
          <VideoCard key={video.video_id} video={video} />
        ))}
      </div>
    </div>
  );
};

export default VideoList;