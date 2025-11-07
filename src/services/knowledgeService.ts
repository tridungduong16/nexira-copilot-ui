import { Post, Comment, PostFileReq, PostPresignUploadResponse, PostPresignDownloadResponse, PostAttachmentCreate } from '../types/knowledge';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// API response interfaces
interface PaginatedResponse<T> {
  items?: T[];
  posts?: T[];
  comments?: T[];
  total: number;
  page: number;
  size?: number;
  limit?: number;
  total_pages?: number;
  has_next: boolean;
  has_prev?: boolean;
}

interface PostCreateRequest {
  content: string;
  attachments?: Array<{
    type: 'image' | 'video' | 'document' | 'link';
    s3_key: string;
    filename: string;
    mime: string;
    size_bytes: number;
    sha256?: string;
  }>;
  tags?: string[];
  category?: string;
}

interface CommentCreateRequest {
  content: string;
  post_id: string;
  parent_id?: string;
}

class KnowledgeService {
  // Normalize timestamps to ISO string with timezone (default to UTC if missing)
  private normalizeTs(ts: any): string {
    let iso: string;
    if (typeof ts === 'string') {
      iso = ts;
    } else {
      try { iso = new Date(ts).toISOString(); } catch { iso = new Date().toISOString(); }
    }
    if (typeof iso === 'string' && !/[Zz]|[+-]\d{2}:?\d{2}$/.test(iso)) {
      iso += 'Z';
    }
    return iso;
  }

  private mapPostFromBackend(data: any): Post {

    return {
      id: data._id,
      title: data.title || '',
      content: data.content || '',
      author: {
        id: data.author?.user_id || data.author?.id || '',
        name: data.author?.name || data.author?.username || '',
        // Prefer explicit avatar, otherwise use avatar_url, else empty string
        avatar: (data.author?.avatar ?? data.author?.avatar_url ?? '') || '',
      },
      tags: data.tags || [],
      attachments: (data.attachments || []).map((att: any) => ({
        type: att.type,
        s3_key: att.s3_key,
        filename: att.filename,
        url: att.url,
        mime: att.mime,
        size_bytes: att.size_bytes,
        sha256: att.sha256,
        // Legacy fields for backward compatibility
        name: att.filename,  // alias for filename
        size: att.size_bytes // alias for size_bytes
      })),
      reactions: [],
      reaction_count: 0,
      comment_count: data.comments_count || 0,
  
      created_at: this.normalizeTs(data.created_at),
      updated_at: data.updated_at ? this.normalizeTs(data.updated_at) : '',
      is_deleted: data.is_deleted || false,
    };
  }

  private mapCommentFromBackend(data: any): Comment {
    return {
      id: data.id || data._id,
      post_id: data.post_id,
      content: data.content,
      author: {
        id: data.author?.user_id || data.author?.id || '',
        name: data.author?.name || data.author?.username || '',
        avatar: (data.author?.avatar ?? data.author?.avatar_url ?? '') || '',
      },
      parentId: data.parent_id || undefined,
      replies: (data.replies || []).map((r: any) => this.mapCommentFromBackend(r)),
      reactions: [],
      reaction_count: 0,
      created_at: this.normalizeTs(data.created_at),
      updated_at: data.updated_at ? this.normalizeTs(data.updated_at) : '',
      is_deleted: data.is_deleted || false,
    };
  }
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      // inject user identity headers from localStorage if present
      const userId = localStorage.getItem('nexira_user_id') || '';
      const userName = localStorage.getItem('nexira_user_name') || '';
      const userAvatar = localStorage.getItem('nexira_user_avatar') || '';
      const loginProvider = localStorage.getItem('nexira_login_provider') || 'guest';

      // Header values must be ASCII-only. Encode non-ASCII display names.
      let nameB64 = '';
      if (userName) {
        try {
          nameB64 = btoa(unescape(encodeURIComponent(userName)));
        } catch (e) {
          // ignore encoding errors; fallback to empty
          nameB64 = '';
        }
      }
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'user-id': userId } : {}),
          ...(nameB64 ? { 'user-name-b64': nameB64 } : {}),
          ...(userAvatar ? { 'user-avatar': userAvatar } : {}),
          'login-provider': loginProvider || 'guest',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        // Try to parse JSON error, but handle HTML responses gracefully
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, it's likely an HTML error page
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('text/html')) {
            errorMessage = 'Knowledge base API endpoint not available. Please check backend configuration.';
          }
        }
        throw new Error(errorMessage);
      }

      // Try to parse as JSON, handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        throw new Error('Server returned non-JSON response. API may not be configured correctly.');
      }
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Post methods
  async createPost(postData: { content: string; tags?: string[]; category?: string; attachments?: PostAttachmentCreate[] }): Promise<Post> {
    const createRes = await this.makeRequest<{ post_id: string; message: string }>('/knowledge/posts/', {
      method: 'POST',
      body: JSON.stringify({
        content: postData.content,
        tags: postData.tags || [],
        category: postData.category || 'general',
        attachments: postData.attachments || [],
      } as PostCreateRequest),
    });
    const created = await this.getPost(createRes.post_id);
    return created;
  }

  async getPosts(params: {
    page?: number;
    limit?: number; // mapped to size
    category?: string;
  } = {}): Promise<PaginatedResponse<Post>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('size', params.limit.toString());
    if (params.category) searchParams.append('category', params.category);
    // search and sort removed

    const queryString = searchParams.toString();
    const endpoint = `/knowledge/posts/${queryString ? `?${queryString}` : ''}`;
    
    const res = await this.makeRequest<any>(endpoint);
    return {
      posts: (res.posts || []).map((p: any) => this.mapPostFromBackend(p)),
      total: res.total,
      page: res.page,
      size: res.size,
      has_next: res.has_next,
    } as PaginatedResponse<Post>;
  }

  async getPost(postId: string): Promise<Post> {
    const raw = await this.makeRequest<any>(`/knowledge/posts/${postId}`);
    return this.mapPostFromBackend(raw);
  }

  async updatePost(postId: string, updateData: { content?: string; tags?: string[]; category?: string }): Promise<Post> {
    await this.makeRequest<{ message: string }>(`/knowledge/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    const updated = await this.getPost(postId);
    return updated;
  }

  async deletePost(postId: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`/knowledge/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // Share endpoint removed on backend; keep method unused

  // Stars
  async toggleStar(postId: string): Promise<{ starred: boolean }> {
    return this.makeRequest<{ starred: boolean }>(`/knowledge/posts/${postId}/star`, {
      method: 'POST',
    });
  }

  async isStarred(postId: string): Promise<boolean> {
    const res = await this.makeRequest<{ starred: boolean }>(`/knowledge/posts/${postId}/star`);
    return res.starred;
  }

  async getMyStarred(params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Post>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', String(params.page));
    if (params.limit) searchParams.append('size', String(params.limit));
    const endpoint = `/knowledge/users/me/starred${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const res = await this.makeRequest<any>(endpoint);
    return {
      posts: (res.posts || []).map((p: any) => this.mapPostFromBackend(p)),
      total: res.total,
      page: res.page,
      size: res.size,
      has_next: res.has_next,
    } as PaginatedResponse<Post>;
  }

  async searchPosts(params: { query: string; page?: number; limit?: number; min_score?: number } = { query: '' }): Promise<PaginatedResponse<Post>> {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.append('query', params.query);
    if (params.page) searchParams.append('page', String(params.page));
    if (params.limit) searchParams.append('size', String(params.limit));
    if (typeof params.min_score === 'number') searchParams.append('min_score', String(params.min_score));
    const endpoint = `/knowledge/search${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const res = await this.makeRequest<any>(endpoint);
    return {
      posts: (res.posts || []).map((p: any) => this.mapPostFromBackend(p)),
      total: res.total,
      page: res.page,
      size: res.size,
      has_next: res.has_next,
    } as PaginatedResponse<Post>;
  }

  // Comment methods
  async addComment(postId: string, data: { content: string; parent_id?: string }): Promise<Post> {
    await this.makeRequest<{ comment_id: string; message: string }>(`/knowledge/comments/`, {
      method: 'POST',
      body: JSON.stringify({
        content: data.content,
        post_id: postId,
        parent_id: data.parent_id,
      } as CommentCreateRequest),
    });
    return this.getPost(postId);
  }

  async getComments(postId: string, params: {
    page?: number;
    limit?: number; // mapped to size
  } = {}): Promise<PaginatedResponse<Comment>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('size', params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = `/knowledge/posts/${postId}/comments${queryString ? `?${queryString}` : ''}`;
    
    const res = await this.makeRequest<any>(endpoint);
    return {
      comments: (res.comments || []).map((c: any) => this.mapCommentFromBackend(c)),
      total: res.total,
      page: res.page,
      size: res.size,
      has_next: res.has_next,
    } as PaginatedResponse<Comment>;
  }

  async updateComment(commentId: string, content: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`/knowledge/comments/${commentId}?content=${encodeURIComponent(content)}`, {
      method: 'PUT',
    });
  }

  async deleteComment(commentId: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`/knowledge/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // S3 file upload methods
  async getPresignedUpload(files: PostFileReq[]): Promise<PostPresignUploadResponse> {
    return this.makeRequest<PostPresignUploadResponse>('/knowledge/posts/file_presign_upload', {
      method: 'POST',
      body: JSON.stringify({ files }),
    });
  }

  async uploadToS3(file: File, presignedPost: { url: string; fields: Record<string, string> }): Promise<void> {
    const formData = new FormData();
    // Add all presigned fields first
    Object.entries(presignedPost.fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    // Add file last
    formData.append('file', file);

    const response = await fetch(presignedPost.url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('S3 upload failed');
    }
  }

  async getPresignedDownload(s3Key: string, filename?: string, inline: boolean = false): Promise<PostPresignDownloadResponse> {
    const requestBody = {
      s3_key: s3Key,
      filename,
      inline,
    };
    
    return await this.makeRequest<PostPresignDownloadResponse>('/knowledge/posts/file_presign_download', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

}

export const knowledgeService = new KnowledgeService();
export default knowledgeService;
