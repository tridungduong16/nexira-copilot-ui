const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface MarketingRequest {
  user_request: string;
  marketing_tool: 'social_media' | 'email_marketing' | 'advertisement' | 'seo_content';
  language: 'vietnamese' | 'english';
  style: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'creative' | 'humorous';
  goal: 'brand_awareness' | 'lead_generation' | 'conversion' | 'engagement' | 'traffic' | 'loyalty';
  platform?: 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'youtube' | 'website' | 'email' | 'google' | 'twitter';
}

export interface MarketingResponse {
  main_draft: string;
  creative_version: string;
  simple_version: string;
}

export interface GeneratedContent {
  id: string;
  title: string;
  content: string;
  type: string;
  timestamp: string;
  rating: number;
}

class MarketingAPIService {
  private getEndpoint(toolType: string): string {
    const endpointMap: Record<string, string> = {
      'social': `${API_BASE_URL}/marketing/social-media`,
      'email': `${API_BASE_URL}/marketing/email-marketing`,
      'ads': `${API_BASE_URL}/marketing/advertisement`,
      'seo': `${API_BASE_URL}/marketing/seo-content`,
    };
    return endpointMap[toolType] || endpointMap['social'];
  }

  private mapFrontendToBackend(frontendType: string): string {
    const mapping: Record<string, string> = {
      'social': 'social_media',
      'email': 'email_marketing',
      'ads': 'advertisement',
      'seo': 'seo_content',
    };
    return mapping[frontendType] || 'social_media';
  }

  private mapFrontendStyleToBackend(style: string): string {
    const mapping: Record<string, string> = {
      'friendly': 'friendly',
      'professional': 'professional',
      'humorous': 'humorous',
      'creative': 'creative',
      'casual': 'casual',
      'urgent': 'authoritative',
    };
    return mapping[style] || 'professional';
  }

  private mapFrontendGoalToBackend(goal: string): string {
    const mapping: Record<string, string> = {
      'awareness': 'brand_awareness',
      'conversion': 'conversion',
      'product': 'brand_awareness',
      'engagement': 'engagement',
      'traffic': 'traffic',
      'loyalty': 'loyalty',
    };
    return mapping[goal] || 'brand_awareness';
  }

  async generateMarketingContent(
    frontendType: string,
    userRequest: string,
    language: string = 'vietnamese',
    style: string = 'professional',
    goal: string = 'brand_awareness',
    platform?: string
  ): Promise<MarketingResponse> {
    try {
      const backendToolType = this.mapFrontendToBackend(frontendType);
      const backendStyle = this.mapFrontendStyleToBackend(style);
      const backendGoal = this.mapFrontendGoalToBackend(goal);

      const requestBody: MarketingRequest = {
        user_request: userRequest,
        marketing_tool: backendToolType as any,
        language: language as any,
        style: backendStyle as any,
        goal: backendGoal as any,
        platform: platform as any,
      };

      const response = await fetch(this.getEndpoint(frontendType), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  formatMarketingResponse(response: MarketingResponse, frontendType: string): GeneratedContent[] {
    return [
      {
        id: '1',
        title: 'Standard',
        content: response.main_draft,
        type: frontendType,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rating: 0,
      },
      {
        id: '2',
        title: 'Creative',
        content: response.creative_version,
        type: frontendType,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rating: 0,
      },
      {
        id: '3',
        title: 'Concise',
        content: response.simple_version,
        type: frontendType,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rating: 0,
      },
    ];
  }
}

export const marketingAPI = new MarketingAPIService();
export default marketingAPI;

// Knowledge Base API Service
export interface KnowledgePost {
  _id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: {
    user_id: string;
    name: string;
    avatar: string;
  };
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  is_deleted: boolean;
  stars_count: number;
  comments_count: number;
}

export interface KnowledgeComment {
  _id: string;
  content: string;
  author: {
    user_id: string;
    name: string;
    avatar: string;
  };
  post_id: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  is_deleted: boolean;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export interface CreateCommentRequest {
  post_id: string;
  content: string;
}

export interface PaginatedResponse<T> {
  posts: T[];
  total: number;
  page: number;
  size: number;
  has_next: boolean;
}

class KnowledgeAPIService {
  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add user info from localStorage if available
    const userId = localStorage.getItem('user-id');
    const userName = localStorage.getItem('user-name');
    const userAvatar = localStorage.getItem('user-avatar');
    
    if (userId) headers['user-id'] = userId;
    if (userName) {
      const encodedName = btoa(userName);
      headers['user-name-b64'] = encodedName;
    }
    if (userAvatar) headers['user-avatar'] = userAvatar;
    
    return headers;
  }

  async createPost(postData: CreatePostRequest): Promise<{ post_id: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/knowledge/posts/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(postData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async getPosts(page: number = 1, size: number = 10, category?: string): Promise<PaginatedResponse<KnowledgePost>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (category) {
      params.append('category', category);
    }
    
    const response = await fetch(`${API_BASE_URL}/knowledge/posts/?${params}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async getPost(postId: string): Promise<KnowledgePost> {
    const response = await fetch(`${API_BASE_URL}/knowledge/posts/${postId}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async updatePost(postId: string, updateData: Partial<CreatePostRequest>): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/knowledge/posts/${postId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async deletePost(postId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/knowledge/posts/${postId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async createComment(commentData: CreateCommentRequest): Promise<{ comment_id: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/knowledge/comments/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(commentData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async getPostComments(postId: string, page: number = 1, size: number = 20): Promise<PaginatedResponse<KnowledgeComment>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    const response = await fetch(`${API_BASE_URL}/knowledge/posts/${postId}/comments?${params}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async toggleStar(postId: string): Promise<{ starred: boolean; stars_count: number }> {
    const response = await fetch(`${API_BASE_URL}/knowledge/posts/${postId}/star`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async isStarred(postId: string): Promise<{ starred: boolean }> {
    const response = await fetch(`${API_BASE_URL}/knowledge/posts/${postId}/star`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async getMyStarredPosts(page: number = 1, size: number = 10): Promise<PaginatedResponse<KnowledgePost>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    const response = await fetch(`${API_BASE_URL}/knowledge/users/me/starred?${params}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async searchPosts(query: string, page: number = 1, size: number = 10): Promise<PaginatedResponse<KnowledgePost>> {
    const params = new URLSearchParams({
      query: query,
      page: page.toString(),
      size: size.toString(),
    });
    
    const response = await fetch(`${API_BASE_URL}/knowledge/search?${params}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
}

export const knowledgeAPI = new KnowledgeAPIService();