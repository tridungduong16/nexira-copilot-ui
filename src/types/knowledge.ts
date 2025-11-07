export interface Author {
  id: string;
  name: string;
  avatar?: string;
}

export interface Attachment {
  type: 'image' | 'video' | 'document' | 'link';
  s3_key?: string;     // S3 key for new posts
  filename: string;
  mime?: string;
  size_bytes?: number;
  sha256?: string;
  // Backward compatibility fields
  url?: string;        // Direct URL for old posts
  name?: string;       // Alias for filename
  size?: number;       // Alias for size_bytes
}

// Payload type for creating post attachments that supports both legacy URL-based
// and new S3-presigned formats. This keeps the service API flexible while
// remaining type-safe.
export type PostAttachmentCreate = {
  type: 'image' | 'video' | 'document' | 'link';
  // New S3 fields
  s3_key?: string;
  filename?: string;
  mime?: string;
  size_bytes?: number;
  sha256?: string;
  // Legacy fields
  url?: string;
  name?: string;
  size?: number;
  mime_type?: string;
};

export interface Reaction {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  reaction_type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | 'care';
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: Author;
  tags: string[];
  attachments: Attachment[];
  reactions: Reaction[];
  reaction_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  content: string;
  author: Author;
  parentId?: string;
  replies: Comment[];
  reactions: Reaction[];
  reaction_count: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface ReactionType {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PostsResponse extends PaginationInfo {
  posts: Post[];
}

export interface CommentsResponse extends PaginationInfo {
  comments: Comment[];
}

// Form interfaces for creating/updating
export interface CreatePostForm {
  title: string;
  content: string;
  tags: string[];
  attachments: File[];
}

export interface CreateCommentForm {
  content: string;
  parentId?: string;
}

export interface UpdatePostForm {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface UpdateCommentForm {
  content: string;
}

// API Error interface
export interface ApiError {
  detail: string;
  status_code?: number;
}

// Search and filter interfaces
export interface PostFilters {
  author_id?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export interface CommentFilters {
  page?: number;
  limit?: number;
}

// Analytics interface
export interface PostAnalytics {
  views: number;
  unique_views: number;
  reaction_breakdown: {
    [key in Reaction['reaction_type']]: number;
  };
  comment_count: number;
  share_count: number;
  engagement_rate: number;
  top_comments: Comment[];
}

// User activity interface
export interface UserActivity {
  user_id: string;
  posts_count: number;
  comments_count: number;
  reactions_given: number;
  reactions_received: number;
  recent_posts: Post[];
  recent_comments: Comment[];
}

// Notification interface
export interface Notification {
  id: string;
  type: 'post_reaction' | 'comment_reaction' | 'new_comment' | 'comment_reply';
  message: string;
  read: boolean;
  created_at: string;
  related_post_id?: string;
  related_comment_id?: string;
  triggered_by_user: Author;
}

// S3 interfaces for post file uploads
export interface PostFileReq {
  filename: string;
  mime: string;
  post_id?: string;
}

export interface PostPresignUploadResponse {
  uploads: {
    key: string;
    filename: string;
    mime: string;
    post: {
      url: string;
      fields: Record<string, string>;
    };
  }[];
}

export interface PostPresignDownloadResponse {
  url: string;
  expires_in: number;
}
