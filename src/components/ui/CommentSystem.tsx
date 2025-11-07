import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { knowledgeService } from '../../services/knowledgeService';
import { Comment } from '../../types/knowledge';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

interface CommentSystemProps {
  postId: string;
  onCommentAdded?: (isReply?: boolean) => void;
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onReplyAdded: () => void;
  depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, postId, onReplyAdded, depth = 0 }) => {
  const { language, t } = useLanguage();
  useTheme();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateLocale = language === 'vi' ? vi : enUS;

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    try {
      setIsSubmitting(true);
      await knowledgeService.addComment(postId, {
        content: replyContent,
        parent_id: comment.id,
      });
      onReplyAdded();
      setReplyContent('');
      setShowReplyInput(false);
      setShowReplies(true);
    } catch (error) {
      console.error('Failed to add reply:', error);
      alert('Failed to add reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-3' : 'mb-4'}`}>
      <div className="flex space-x-3">
        <img
          src={(comment.author.avatar && comment.author.avatar.trim().length > 0) ? comment.author.avatar : '/figma/icon-user-circle.svg'}
          alt={comment.author.name}
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
        <div className="flex-1">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                {comment.author.name}
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </span>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-line break-words break-all">
              {comment.content}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-1 text-xs">
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="font-medium text-gray-500 hover:text-blue-600"
            >
              {t('knowledgeUi.reply')}
            </button>
            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="font-medium text-gray-500 hover:text-blue-600"
              >
                {showReplies ? t('knowledgeUi.hideReplies', { count: comment.replies.length }) : t('knowledgeUi.viewReplies', { count: comment.replies.length })}
              </button>
            )}
          </div>

          {/* Reply Input */}
          {showReplyInput && (
            <div className="mt-2 flex space-x-2 items-start">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={t('knowledgeUi.writeReply')}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-y"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e as any).shiftKey) {
                    e.preventDefault();
                    setReplyContent(prev => prev + '\n');
                  } else if (e.key === 'Enter' && !isSubmitting && !(e as any).shiftKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
                rows={2}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowReplyInput(false);
                    setReplyContent('');
                  }}
                  className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  {t('knowledgeUi.cancel')}
                </button>
                <button
                  onClick={handleReply}
                  disabled={isSubmitting || !replyContent.trim()}
                  className="px-4 py-1 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                >
                  {t('knowledgeUi.send')}
                </button>
              </div>
            </div>
          )}

          {/* Replies */}
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onReplyAdded={onReplyAdded}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CommentSystem: React.FC<CommentSystemProps> = ({ postId, onCommentAdded }) => {
  const { t } = useLanguage();
  useTheme();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  const fetchComments = async () => {
    try {
      const res = await knowledgeService.getComments(postId, { page: 1, limit: 50 });
      setComments(res.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const normalized = newComment.replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n');
      await knowledgeService.addComment(postId, {
        content: normalized,
      });
      await fetchComments();
      setNewComment('');
      onCommentAdded?.(false);
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rootComments = comments.filter(comment => !(comment as any).parent_id && !comment.parentId);

  return (
    <div>
      {/* Comment Input */}
      <div className="mb-4">
        <div className="flex space-x-3">
          <img
            src={(() => { try { return localStorage.getItem('nexira_user_avatar') || '/figma/icon-user-circle.svg'; } catch { return '/figma/icon-user-circle.svg'; } })()}
            alt="Your avatar"
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('knowledgeUi.writeComment')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 resize-y"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e as any).shiftKey) {
                  e.preventDefault();
                  setNewComment(prev => prev + '\n');
                } else if (e.key === 'Enter' && !isSubmitting && !(e as any).shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            {newComment.trim() && (
              <div className="mt-2 flex justify-end space-x-2">
                <button
                  onClick={() => setNewComment('')}
                  className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  {t('knowledgeUi.cancel')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !newComment.trim()}
                  className="px-4 py-1 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? t('knowledgeUi.sending') : t('knowledgeUi.send')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {rootComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            onReplyAdded={() => {
              fetchComments();
              onCommentAdded?.(true);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default CommentSystem;
