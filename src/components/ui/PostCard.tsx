import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Post, Comment } from '../../types/knowledge';
import { knowledgeService } from '../../services/knowledgeService';
import CommentSystem from './CommentSystem';
import ShareSystem from './ShareSystem';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

interface PostCardProps {
  post: Post;
  onPostUpdated: (post: Post) => void;
  onPostDeleted: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdated, onPostDeleted }) => {
  const { language, t } = useLanguage();
  useTheme();
  const [showComments, setShowComments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [starred, setStarred] = useState<boolean>(false);
  const [recentComments, setRecentComments] = useState<Comment[]>([]);
  const [rootCommentTotal, setRootCommentTotal] = useState<number | null>(null);
  const [totalCommentCount, setTotalCommentCount] = useState<number | null>(post.comment_count ?? null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const dateLocale = language === 'vi' ? vi : enUS;

  const handleDelete = async () => {
    if (window.confirm(t('knowledgeUi.deleteConfirm'))) {
      try {
        setIsDeleting(true);
        await knowledgeService.deletePost(post.id);
        onPostDeleted(post.id);
      } catch (error) {
        console.error('Failed to delete post:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEdit = async () => {
    try {
      const updatedPost = await knowledgeService.updatePost(post.id, {
        content: editedContent,
      });
      onPostUpdated(updatedPost);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(post.content);
    setIsEditing(false);
  };

  const handleShare = async () => {
    try {
      // No backend share count; keep UI-only share actions
      onPostUpdated(post);
    } catch (e) {
      console.error('Share failed', e);
    }
  };

  useEffect(() => {
    let mounted = true;
    // load current user id from local storage
    try {
      const uid = localStorage.getItem('nexira_user_id') || '';
      if (mounted) setCurrentUserId(uid);
    } catch {}
    knowledgeService.isStarred(post.id).then((s) => {
      if (mounted) setStarred(s);
    }).catch(() => {});
    setTotalCommentCount(post.comment_count);
    knowledgeService.getComments(post.id, { page: 1, limit: 5 }).then(res => {
      if (mounted) {
        const items: Comment[] = (res.comments || []) as any;
        setRootCommentTotal(typeof res.total === 'number' ? res.total : items.length);
        setRecentComments(items.slice(Math.max(0, items.length - 2)));
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, [post.id]);

  const handleToggleStar = async () => {
    try {
      const res = await knowledgeService.toggleStar(post.id);
      setStarred(res.starred);
    } catch (e) {
      console.error('Toggle star failed', e);
    }
  };

  const handleDownloadAttachment = async (attachment: any) => {
    try {
      let downloadUrl: string;
      
      if (attachment.s3_key) {
        // New S3 format - get presigned URL
        const { url } = await knowledgeService.getPresignedDownload(attachment.s3_key, attachment.filename);
        downloadUrl = url;
      } else if (attachment.url) {
        // Old format - use direct URL
        downloadUrl = attachment.url;
      } else {
        throw new Error('No valid URL or S3 key found for attachment');
      }
      
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Failed to download attachment:', error);
      alert('Failed to download file');
    }
  };


  const renderAttachments = () => {
    if (!post.attachments || post.attachments.length === 0) return null;

    return (
      <div className="mt-4 space-y-3">
        {post.attachments.map((attachment, index) => {
          const attachmentKey = `${post.id}-${index}`;
          
          // Render images inline
          if (attachment.type === 'image') {
            return (
              <div key={index} className="relative">
                <ImageAttachment 
                  attachment={attachment}
                  postId={post.id}
                  index={index}
                />
              </div>
            );
          }
          
          // Render other files as downloadable items
          return (
            <div key={index} className="relative">
              <button
                onClick={() => handleDownloadAttachment(attachment)}
                className="flex items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-full text-left"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold">
                    {attachment.type === 'video' ? '🎬' : '📄'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {attachment.filename || 'File'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {attachment.size_bytes ? `${(attachment.size_bytes / 1024 / 1024).toFixed(1)} MB` : 'Click to download'}
                  </p>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // Component for rendering image attachments
  const ImageAttachment: React.FC<{attachment: any, postId: string, index: number}> = ({attachment, postId, index}) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      const loadImageUrl = async () => {
        // Check if we have s3_key (new format) or url (old format)
        if (attachment.s3_key) {
          // New S3 format - get presigned URL
          try {
            const { url } = await knowledgeService.getPresignedDownload(
              attachment.s3_key, 
              attachment.filename, 
              true // inline = true for images
            );
            setImageUrl(url);
          } catch (err) {
            setError(true);
          } finally {
            setLoading(false);
          }
        } else if (attachment.url) {
          // Old format - use direct URL
          setImageUrl(attachment.url);
          setLoading(false);
        } else {
          setError(true);
          setLoading(false);
        }
      };

      loadImageUrl();
    }, [attachment.s3_key, attachment.filename, attachment.url]);

    if (loading) {
      return (
        <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error || !imageUrl) {
      return (
        <button
          onClick={() => handleDownloadAttachment(attachment)}
          className="flex items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-full text-left"
        >
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold">📷</span>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {attachment.filename || 'Image'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click to download
            </p>
          </div>
        </button>
      );
    }

    return (
      <div className="relative">
        <img
          src={imageUrl}
          alt={attachment.filename || 'Attachment'}
          className="w-full max-w-lg rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => window.open(imageUrl, '_blank')}
          onError={() => setError(true)}
        />
        {attachment.filename && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {attachment.filename}
          </p>
        )}
      </div>
    );
  };

  const displayCommentCount = totalCommentCount !== null
    ? totalCommentCount
    : (rootCommentTotal !== null ? rootCommentTotal : post.comment_count);

  const handleCommentAdded = (isReply?: boolean) => {
    setTotalCommentCount((prev) => (prev !== null ? prev + 1 : ((rootCommentTotal ?? post.comment_count ?? 0) + 1)));
    if (!isReply) {
      setRootCommentTotal((prev) => (prev !== null ? prev + 1 : 1));
    }
  };

  // Only consider ownership when both ids are present and match
  const isOwner = Boolean(currentUserId && post.author?.id && post.author.id === currentUserId);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-white/10">
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <img
              src={(post.author.avatar && post.author.avatar.trim().length > 0) ? post.author.avatar : '/figma/icon-user-circle.svg'}
              alt={post.author.name}
              className="w-10 h-10 rounded-full mr-3"
            />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {post.author.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </p>
            </div>
          </div>
          
          {/* Post Actions */}
          <div className="flex items-center space-x-2">
            {isOwner && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            <button
              onClick={handleToggleStar}
              className={`${starred ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-500`}
              title={starred ? 'Unstar' : 'Star'}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill={starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
            </button>
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="mt-4">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={4}
                placeholder={t('knowledgeUi.editContent')}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {t('knowledgeUi.save')}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  {t('knowledgeUi.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words break-all">
                {post.content}
              </p>
            </>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Attachments */}
        {renderAttachments()}

        {/* Post Stats */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>{displayCommentCount} {t('knowledgeUi.comments')}</span>
            {/* Share count removed */}
          </div>
        </div>
        {!showComments && recentComments.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {recentComments.map((c) => (
              <div key={c.id} className="flex items-start space-x-2">
                <img
                  src={(c.author?.avatar && c.author.avatar.trim().length > 0) ? c.author.avatar : '/figma/icon-user-circle.svg'}
                  alt={c.author?.name || 'User'}
                  className="w-6 h-6 rounded-full"
                />
                <div className="bg-gray-100/70 dark:bg-gray-800/60 border border-gray-200 dark:border-white/10 rounded-md px-2 py-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{c.author?.name || 'User'}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: dateLocale })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{c.content}</p>
                </div>
              </div>
            ))}
            {(rootCommentTotal ?? 0) > recentComments.length && (
              <button
                className="text-xs text-blue-500 hover:underline"
                onClick={() => setShowComments(true)}
              >
                {t('knowledgeUi.viewAllComments')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Post Actions */}
      <div className="p-2">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{t('knowledgeUi.comment')}</span>
          </button>
          <ShareSystem
            postId={post.id}
            postTitle={post.title}
            postContent={post.content}
            onShare={handleShare}
          />
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <>
          <hr className="border-gray-200 dark:border-gray-700" />
          <div className="p-4">
            <CommentSystem postId={post.id} onCommentAdded={handleCommentAdded} />
          </div>
        </>
      )}
    </div>
  );
};

export default PostCard;
