// pages/VideoPage.js
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { fetchVideoById } from '../services/api';
import VideoPlayer from '../components/video/VideoPlayer';
import VideoList from '../components/video/VideoList';
import CommentSection from '../components/comments/CommentSection';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';
import { formatDistanceToNow } from 'date-fns';
import { addToWatchHistory } from '../utils/watchHistoryUtil';

const formatDuration = (seconds) => {
  if (isNaN(seconds) && !!seconds) return seconds;
  if (!seconds) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const VideoPage = () => {
  const { id } = useParams();
  
  const { 
    data: video, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery(
    ['video', id],
    () => fetchVideoById(parseInt(id))
  );

  // Update page title
  useEffect(() => {
    if (video?.title) {
      document.title = `${video.title} - SickVault`;
    }
    
    return () => {
      document.title = 'SickVault';
    };
  }, [video]);

  // Add video to watch history when loaded
  useEffect(() => {
    if (video && video.video_id) {
      const watchHistoryEntry = {
        video_id: video.video_id,
        title: video.title,
        image_src: video.image_src,
        duration: video.duration,
        views: video.views,
        added: video.added,
        categories: video.category_details || [],
        tags: video.tag_details || [],
        timestamp: new Date().toISOString(),
      };
      
      addToWatchHistory(watchHistoryEntry);
    }
  }, [video]);

  // Prepare video sources
  const prepareSources = () => {
    if (!video?.video_src || video.video_src.length === 0) return [];
    console.log('video.video_src', video.video_src);
    const res = Array.isArray(video.video_src)
      ? video.video_src[0]
      : video.video_src;

    console.log('res', res);
    return res;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorDisplay 
        message={error?.message || 'Failed to load video'} 
        retry={refetch} 
        className="my-10"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        {/* Video player */}
        <VideoPlayer 
          src={prepareSources()} 
          poster={video.image_src} 
          title={video.title}
        />
        
        {/* Video info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
            {video.title}
          </h1>
          
          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-4">
            <span className="mr-4">{video.views ? `${video.views.toLocaleString()} views` : 'No views'}</span>
            {video.added && (
              <span>Added {formatDistanceToNow(new Date(video.added), { addSuffix: true })}</span>
            )}
          </div>
          
          {/* Categories and Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {video.category_details?.map(category => (
              <Link 
                key={`cat-${category.id}`}
                to={`/category/${category.id}`}
                className="text-xs bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 px-3 py-1 rounded-full text-indigo-700 dark:text-indigo-300"
              >
                {category.name}
              </Link>
            ))}
            
            {video.tag_details?.map(tag => (
              <Link 
                key={`tag-${tag.id}`}
                to={`/tag/${tag.id}`}
                className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1 rounded-full text-gray-700 dark:text-gray-300"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
          
          {/* Description */}
          {video.description && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                Description
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {video.description}
              </p>
            </div>
          )}
        </div>
        
        {/* Comments section */}
        <CommentSection videoId={parseInt(id)} />
      </div>
      
      {/* Related videos sidebar */}
      <div className="lg:col-span-1">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Related Videos
        </h2>
        
        {video.related_videos?.length > 0 ? (
          <div className="space-y-4">
            {video.related_videos.map(relatedVideo => (
              <Link key={relatedVideo.video_id} to={`/video/${relatedVideo.video_id}`} className="block">
                <div className="flex-row bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
                  <div className="w-full h-full flex-shrink-0 relative">
                    <img 
                      src={relatedVideo.image_src || '/placeholder-image.jpg'} 
                      alt={relatedVideo.title}
                      className="w-full h-full object-cover"
                    />
                    {relatedVideo.duration && (
                      <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black bg-opacity-70 text-white text-xs rounded">
                        {formatDuration(relatedVideo.duration)}
                      </span>
                    )}
                  </div>
                  <div className="p-3 overflow-hidden">
                    <h3 className="text-sm font-medium text-gray-800 dark:text-white line-clamp-2 mb-1">
                      {relatedVideo.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {relatedVideo.views ? `${relatedVideo.views.toLocaleString()} views` : 'No views'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-10">
            No related videos found
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoPage;