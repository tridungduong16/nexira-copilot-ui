const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface DocumentUploadRequest {
  session_id: string;
  filename: string;
  content: string;
  document_type: string;
  metadata?: any;
}

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  chunks_created: number;
  success: boolean;
  message: string;
}

export interface ChatRequest {
  session_id: string;
  message: string;
  tool_type: string;
  role_level: string;
  job_type: string;
  language: string;
}

export interface DocumentReference {
  document_id: string;
  chunk_id: string;
  relevance_score: number;
  text_snippet: string;
}

export interface ChatResponse {
  message_id: string;
  content: string;
  context_snippets: string[];
  metadata: {
    tool_type: string;
    language: string;
    role_level: string;
    job_type: string;
  };
}

export interface ChatSession {
  session_id: string;
  user_id?: string;
  tool_type: string;
  created_at?: string;
  updated_at?: string;
  document_ids: string[];
  message_count: number;
  settings?: any;
}

export class HRChatService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // Note: Direct file upload not supported - use uploadDocumentText with extracted content

  async uploadDocumentText(request: DocumentUploadRequest): Promise<DocumentUploadResponse> {
    return this.request<DocumentUploadResponse>('/hr/chat/upload-document-text', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/hr/chat/message', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async createSession(toolType: string = 'cv_analysis', userId?: string): Promise<ChatSession> {
    return this.request<ChatSession>(`/hr/chat/create-session?tool_type=${toolType}${userId ? `&user_id=${userId}` : ''}`, {
      method: 'POST',
    });
  }

  async getSessionDocuments(sessionId: string): Promise<any> {
    return this.request<any>(`/hr/chat/session-documents?session_id=${sessionId}`, {
      method: 'GET',
    });
  }

  async deleteDocument(sessionId: string, documentId: string): Promise<any> {
    return this.request<any>(`/hr/chat/delete-document?session_id=${sessionId}&document_id=${documentId}`, {
      method: 'DELETE',
    });
  }

  async cleanupSession(sessionId: string, userId?: string): Promise<any> {
    const url = `/hr/chat/cleanup-session?session_id=${sessionId}${userId ? `&user_id=${userId}` : ''}`;
    return this.request<any>(url, {
      method: 'DELETE',
    });
  }
}

export const hrChatService = new HRChatService();