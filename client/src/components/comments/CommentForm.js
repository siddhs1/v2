// components/comments/CommentForm.js
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { addComment } from '../../services/api';

const CommentForm = ({ videoId, onSuccess, originalCommentId = null, placeholder = "Add a comment..." }) => {
  const [commentText, setCommentText] = useState('');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const queryClient = useQueryClient();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      setError('Comment cannot be empty');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const newComment = await addComment({
        video_id: videoId,
        username: username.trim() || 'Anonymous',
        comment_text: commentText.trim(),
        is_guest: true,
        original_comment_id: originalCommentId
      });
      
      // Clear form
      setCommentText('');
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries(['videoComments', videoId]);
      if (originalCommentId) {
        queryClient.invalidateQueries(['commentReplies', originalCommentId]);
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(newComment);
      }
    } catch (err) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Your name (optional)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
      <div className="mb-2">
        <textarea
          rows="3"
          placeholder={placeholder}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          disabled={isSubmitting}
        ></textarea>
      </div>
      {error && (
        <div className="text-red-500 text-sm mb-2">{error}</div>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;