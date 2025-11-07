/**
 * Chat History API Service
 * Handles all communication with backend chat history endpoints
 */
import { ensureStableUserId } from '../utils/userUtils';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';

function safeB64(input: string): string {
  try {
    return btoa(input);
  } catch {
    try {
      // Fallback for Unicode strings
      return btoa(unescape(encodeURIComponent(input)));
    } catch {
      return '';
    }
  }
}

/**
 * Helper to normalize URL and remove trailing slashes
 */
function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, ''); // Remove all trailing slashes
}

export interface ConversationCreate {
  title: string;
}

export interface MessageCreate {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
}

export interface Message {
  message_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  provider?: string;
  model?: string;
}

export interface Conversation {
  _id: string;
  conversation_id?: string;
  user_id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
  archived?: boolean;
}

export interface ConversationListItem {
  _id?: string;
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  archived?: boolean;
}

export interface ConversationListResponse {
  conversations: ConversationListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface SearchResponse {
  query: string;
  results: ConversationListItem[];
  total: number;
}

class ChatHistoryAPI {
  private getHeaders(): HeadersInit {
    // Ensure a stable user id is always present across navigations
    const userId = ensureStableUserId();
    const userName =
      localStorage.getItem('nexira_user_name') ||
      localStorage.getItem('user_name') ||
      localStorage.getItem('user-name') ||
      'User';
    const userAvatar =
      localStorage.getItem('nexira_user_avatar') ||
      localStorage.getItem('user_avatar') ||
      '';
    const loginProvider =
      localStorage.getItem('nexira_login_provider') ||
      localStorage.getItem('login_provider') ||
      'guest';

    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'user-id': userId,
      'user-name-b64': safeB64(userName),
      'user-avatar': userAvatar,
      'login-provider': loginProvider,
    };
  }

  /**
   * Create a new conversation
   */
  async createConversation(title: string = 'New Chat'): Promise<{ conversation_id: string; message: string }> {
    const url = normalizeUrl(`${API_BASE_URL}/chat-history/conversations`);
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let detail = 'Failed to create conversation';
      try { const json = JSON.parse(errorText); detail = json.detail || detail; } catch {}
      throw new Error(`${detail} [POST ${url}] (HTTP ${response.status})`);
    }

    return response.json();
  }

  /**
   * Get all conversations for current user
   */
  async getConversations(limit: number = 20, offset: number = 0): Promise<ConversationListResponse> {
    // Build URL without trailing slash to avoid 307 redirect
    const baseUrl = normalizeUrl(`${API_BASE_URL}/chat-history/conversations`);
    const url = new URL(baseUrl);
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('offset', offset.toString());
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let detail = 'Failed to fetch conversations';
      try { const json = JSON.parse(errorText); detail = json.detail || detail; } catch {}
      throw new Error(`${detail} [GET ${url}] (HTTP ${response.status})`);
    }

    const data = await response.json();

    // Normalize IDs that may come as ObjectId objects or different fields
    const normId = (raw: any): string => {
      if (!raw) return '';
      if (typeof raw === 'string') return raw;
      if (typeof raw === 'object') {
        const cand = (raw.$oid ?? raw.oid ?? raw.$id ?? raw.value ?? null);
        return cand ? String(cand) : String(raw);
      }
      return String(raw);
    };

    const conversations = (data.conversations || []).map((c: any) => {
      const id = normId(c.conversation_id ?? c._id ?? c.id);
      return {
        ...c,
        conversation_id: id,
        _id: id,
      };
    });

    const result = {
      conversations,
      total: data.total ?? conversations.length,
      limit: data.limit ?? limit,
      offset: data.offset ?? offset,
    };
    return result;
  }

  /**
   * Get a single conversation with all messages
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    const url = normalizeUrl(`${API_BASE_URL}/chat-history/conversations/${conversationId}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let detail = 'Failed to fetch conversation';
      try { const json = JSON.parse(errorText); detail = json.detail || detail; } catch {}
      throw new Error(`${detail} [GET ${url}] (HTTP ${response.status})`);
    }

    const data = await response.json();
    const normId = (raw: any): string => {
      if (!raw) return '';
      if (typeof raw === 'string') return raw;
      if (typeof raw === 'object') {
        const cand = (raw.$oid ?? raw.oid ?? raw.$id ?? raw.value ?? null);
        return cand ? String(cand) : String(raw);
      }
      return String(raw);
    };

    const id = normId(data.conversation_id ?? data._id ?? data.id);
    const messages = Array.isArray(data.messages) ? data.messages.map((m: any) => ({
      ...m,
      timestamp: typeof m.timestamp === 'string' ? m.timestamp : (m.timestamp?.$date || m.timestamp) || new Date().toISOString(),
    })) : [];

    const result = {
      ...data,
      _id: id,
      conversation_id: id,
      messages,
    };
    return result;
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<{ message: string }> {
    const url = normalizeUrl(`${API_BASE_URL}/chat-history/conversations/${conversationId}`);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let detail = 'Failed to delete conversation';
      try { const json = JSON.parse(errorText); detail = json.detail || detail; } catch {}
      throw new Error(`${detail} [DELETE ${url}] (HTTP ${response.status})`);
    }

    return response.json();
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    provider?: string,
    model?: string
  ): Promise<{ message_id: string; message: string }> {
    const url = normalizeUrl(`${API_BASE_URL}/chat-history/conversations/${conversationId}/messages`);
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ role, content, provider, model }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let detail = 'Failed to add message';
      try { const json = JSON.parse(errorText); detail = json.detail || detail; } catch {}
      throw new Error(`${detail} [POST ${url}] (HTTP ${response.status})`);
    }

    return response.json();
  }

  /**
   * Search conversations
   */
  async searchConversations(query: string): Promise<SearchResponse> {
    // Build URL without trailing slash to avoid 307 redirect
    const baseUrl = normalizeUrl(`${API_BASE_URL}/chat-history/search`);
    const url = new URL(baseUrl);
    url.searchParams.set('query', query);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let detail = 'Failed to search conversations';
      try { const json = JSON.parse(errorText); detail = json.detail || detail; } catch {}
      throw new Error(`${detail} [GET ${url}] (HTTP ${response.status})`);
    }

    return response.json();
  }

  /**
   * Add title embedding for semantic search
   */
  async addTitleEmbedding(conversationId: string): Promise<{ message: string }> {
    const url = normalizeUrl(`${API_BASE_URL}/chat-history/conversations/${conversationId}/embedding`);
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let detail = 'Failed to add embedding';
      try { const json = JSON.parse(errorText); detail = json.detail || detail; } catch {}
      throw new Error(`${detail} [POST ${url}] (HTTP ${response.status})`);
    }

    return response.json();
  }

  /**
   * Update conversation title
   */
  async updateTitle(conversationId: string, title: string): Promise<{ message: string; title: string }> {
    const url = normalizeUrl(`${API_BASE_URL}/chat-history/conversations/${conversationId}/title`);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let detail = 'Failed to update title';
      try { const json = JSON.parse(errorText); detail = json.detail || detail; } catch {}
      throw new Error(`${detail} [PATCH ${url}] (HTTP ${response.status})`);
    }

    return response.json();
  }

  /**
   * Ask backend (GPT) to suggest and set a title
   */
  async suggestTitle(conversationId: string): Promise<{ title: string; updated: boolean }> {
    const url = normalizeUrl(`${API_BASE_URL}/chat-history/conversations/${conversationId}/title/suggest`);
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let detail = 'Failed to suggest title';
      try { const json = JSON.parse(errorText); detail = json.detail || detail; } catch {}
      throw new Error(`${detail} [POST ${url}] (HTTP ${response.status})`);
    }
    return response.json();
  }
}

export const chatHistoryApi = new ChatHistoryAPI();
