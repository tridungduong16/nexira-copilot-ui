import { useState, useEffect, useCallback } from 'react';
import { chatHistoryApi, ConversationListItem, Conversation } from '../services/chatHistoryApi';

export interface UseChatHistoryReturn {
  // State
  conversations: ConversationListItem[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<string>;
  loadConversation: (conversationId: string) => Promise<Conversation | null>;
  deleteConversation: (conversationId: string) => Promise<void>;
  addUserMessage: (conversationId: string, content: string) => Promise<void>;
  addAssistantMessage: (conversationId: string, content: string, provider: string, model: string) => Promise<void>;
  searchConversations: (query: string) => Promise<ConversationListItem[]>;
  clearError: () => void;
  touchConversation: (conversationId: string, patch?: Partial<ConversationListItem>) => void;
  updateTitle: (conversationId: string, title: string) => Promise<void>;
  suggestTitle: (conversationId: string) => Promise<string | null>;
}

/**
 * Custom hook for managing chat history
 * Handles all operations: create, read, update, delete conversations and messages
 */
export function useChatHistory(): UseChatHistoryReturn {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all conversations for current user
   */
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await chatHistoryApi.getConversations(20, 0);
      // Normalize items to always include conversation_id for consistent handling
      const normalized = response.conversations.map((c: any) => ({
        ...c,
        conversation_id: c.conversation_id || c._id,
      }));
      // Non-destructive update: if API returns empty unexpectedly, keep current list
      setConversations(prev => (normalized.length > 0 || prev.length === 0) ? normalized : prev);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(message);
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new conversation
   * Returns conversation_id
   */
  const createConversation = useCallback(async (title: string = 'New Chat'): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await chatHistoryApi.createConversation(title);
      
      // Add to conversations list
      const newConv: ConversationListItem = {
        conversation_id: response.conversation_id,
        _id: response.conversation_id, // mirror for UI fallbacks
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        archived: false,
      };
      setConversations(prev => [newConv, ...prev]);
      
      return response.conversation_id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load a single conversation with all messages
   */
  const loadConversation = useCallback(async (conversationId: string): Promise<Conversation | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const conversation = await chatHistoryApi.getConversation(conversationId);
      setCurrentConversation(conversation);
      return conversation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load conversation';
      setError(message);
      console.error('Failed to load conversation:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      if (!conversationId) {
        throw new Error('Invalid conversation id');
      }
      await chatHistoryApi.deleteConversation(conversationId);
      
      // Remove from local state
      setConversations(prev => prev.filter(c => c.conversation_id !== conversationId && (c as any)._id !== conversationId));
      
      // Clear current conversation if it was deleted
      if (currentConversation?._id === conversationId || currentConversation?.conversation_id === conversationId) {
        setCurrentConversation(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete conversation';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation]);

  /**
   * Add a user message to a conversation
   */
  const addUserMessage = useCallback(async (conversationId: string, content: string) => {
    try {
      setError(null);
      await chatHistoryApi.addMessage(conversationId, 'user', content);
      
      // Reload conversation to get updated messages
      if (currentConversation?._id === conversationId || currentConversation?.conversation_id === conversationId) {
        await loadConversation(conversationId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add message';
      setError(message);
      throw err;
    }
  }, [currentConversation, loadConversation]);

  /**
   * Add an assistant message to a conversation
   */
  const addAssistantMessage = useCallback(async (
    conversationId: string,
    content: string,
    provider: string,
    model: string
  ) => {
    try {
      setError(null);
      await chatHistoryApi.addMessage(conversationId, 'assistant', content, provider, model);
      
      // Reload conversation to get updated messages
      if (currentConversation?._id === conversationId || currentConversation?.conversation_id === conversationId) {
        await loadConversation(conversationId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add message';
      setError(message);
      throw err;
    }
  }, [currentConversation, loadConversation]);

  // Locally bump a conversation's updated_at and move it to the top
  const touchConversation = useCallback((conversationId: string, patch?: Partial<ConversationListItem>) => {
    setConversations(prev => {
      const idx = prev.findIndex(c => c.conversation_id === conversationId || (c as any)._id === conversationId);
      const nowIso = new Date().toISOString();
      if (idx === -1) return prev; // nothing to update
      const updated = { ...prev[idx], updated_at: nowIso, ...(patch || {}) } as ConversationListItem;
      const next = [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
      return next;
    });
  }, []);

  /**
   * Search conversations
   */
  const searchConversations = useCallback(async (query: string): Promise<ConversationListItem[]> => {
    try {
      setError(null);
      const response = await chatHistoryApi.searchConversations(query);
      return response.results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search conversations';
      setError(message);
      console.error('Failed to search:', err);
      return [];
    }
  }, []);

  /** Update conversation title and locally patch list */
  const updateTitle = useCallback(async (conversationId: string, title: string) => {
    try {
      setError(null);
      await chatHistoryApi.updateTitle(conversationId, title);
      // Patch list optimistically
      touchConversation(conversationId, { title });
      // Also update currentConversation if it matches
      setCurrentConversation(prev => {
        if (!prev) return prev;
        const id = (prev as any).conversation_id || (prev as any)._id;
        if (id === conversationId) {
          return { ...prev, title } as any;
        }
        return prev;
      });
      // Optionally re-add embedding (already handled server-side)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update title';
      setError(message);
      throw err;
    }
  }, [touchConversation]);

  /** Ask backend (GPT) to suggest and set a title; patch local state */
  const suggestTitle = useCallback(async (conversationId: string): Promise<string | null> => {
    try {
      const res = await chatHistoryApi.suggestTitle(conversationId);
      const title = res?.title || null;
      if (title) {
        touchConversation(conversationId, { title });
        setCurrentConversation(prev => {
          if (!prev) return prev;
          const id = (prev as any).conversation_id || (prev as any)._id;
          if (id === conversationId) {
            return { ...prev, title } as any;
          }
          return prev;
        });
      }
      return title;
    } catch (err) {
      // non-fatal
      return null;
    }
  }, [touchConversation]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Reload when login-related storage changes (e.g., guest -> email)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      const keys = new Set([
        'nexira_user_id',
        'nexira_user_email',
        'nexira_login_provider'
      ]);
      if (!e || (e.key && !keys.has(e.key))) return;
      loadConversations();
    };
    const reload = () => loadConversations();
    window.addEventListener('storage', handler);
    try { window.addEventListener('nexira-login', reload as any); } catch {}
    return () => {
      window.removeEventListener('storage', handler);
      try { window.removeEventListener('nexira-login', reload as any); } catch {}
    };
  }, [loadConversations]);

  return {
    conversations,
    currentConversation,
    isLoading,
    error,
    loadConversations,
    createConversation,
    loadConversation,
    deleteConversation,
    addUserMessage,
    addAssistantMessage,
    searchConversations,
    clearError,
    touchConversation,
    updateTitle,
    suggestTitle,
  };
}
