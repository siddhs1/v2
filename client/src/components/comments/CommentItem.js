// components/comments/CommentItem.js
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { formatDistanceToNow } from 'date-fns';
import { voteOnComment, deleteComment, fetchCommentReplies } from '../../services/api';
import { useQuery } from 'react-query';
import CommentForm from './CommentForm';

const CommentItem = ({ comment, videoId }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  
  // Fetch replies if this is a parent comment
  const {
    data: replies,
    isLoading: repliesLoading,
    isError: repliesError
  } = useQuery(
    ['commentReplies', comment.comment_id],
    () => fetchCommentReplies(comment.comment_id),
    {
      // Don't fetch replies if this is already a reply
      enabled: !comment.original_comment_id
    }
  );
  
  const handleVote = async (vote) => {
    try {
      await voteOnComment(comment.comment_id, vote);
      // Invalidate queries to refetch data
      queryClient.invalidateQueries(['videoComments', videoId]);
      if (comment.original_comment_id) {
        queryClient.invalidateQueries(['commentReplies', comment.original_comment_id]);
      }
    } catch (err) {
      setError('Failed to vote on comment');
    }
  };
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      await deleteComment(comment.comment_id);
      // Invalidate queries to refetch data
      queryClient.invalidateQueries(['videoComments', videoId]);
      if (comment.original_comment_id) {
        queryClient.invalidateQueries(['commentReplies', comment.original_comment_id]);
      }
    } catch (err) {
      setError('Failed to delete comment');
      setIsDeleting(false);
    }
  };
  
  const handleReplySubmit = () => {
    setIsReplying(false);
  };
  
  // If the comment was deleted
  if (isDeleting) {
    return null;
  }
  
  return (
    <div className="mb-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="flex justify-between mb-2">
          <div className="font-medium text-gray-900 dark:text-white">
            {comment.username}
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {formatDistanceToNow(new Date(comment.posted_date), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => handleVote(1)}
              className="text-gray-500 hover:text-green-500 focus:outline-none"
              aria-label="Upvote"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-sm font-medium">{comment.points}</span>
            <button 
              onClick={() => handleVote(-1)}
              className="text-gray-500 hover:text-red-500 focus:outline-none"
              aria-label="Downvote"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 10-2 0v-3.586L7.707 10.707a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 9.414V13z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
              onClick={handleDelete}
              className="text-gray-500 hover:text-red-500 focus:outline-none ml-4"
              aria-label="Delete comment"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {comment.comment_text}
        </p>
        
        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}
        
        <div className="mt-3 flex gap-3">
          <button 
            onClick={() => setIsReplying(!isReplying)}
            className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {isReplying ? 'Cancel' : 'Reply'}
          </button>
        </div>
        
        {isReplying && (
          <div className="mt-4 ml-6">
            <CommentForm 
              videoId={videoId} 
              originalCommentId={comment.comment_id}
              onSuccess={handleReplySubmit}
              placeholder="Write a reply..."
            />
          </div>
        )}
      </div>
      
      {/* Show replies */}
      {!comment.original_comment_id && replies && replies.length > 0 && (
        <div className="ml-8 mt-2 space-y-2">
          {replies.map(reply => (
            <CommentItem 
              key={reply.comment_id} 
              comment={reply} 
              videoId={videoId} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;