import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ChatState,
  ChatActions,
  Message,
  Provider,
  ApiError,
  ModelsConfig,
  ModelOption,
  ProviderOption
} from '../types/chat';
import { chatApi } from '../services/chatApi';

const STORAGE_KEYS = {
  SELECTED_PROVIDER: 'chat-selected-provider',
  SELECTED_MODEL: 'chat-selected-model',
} as const;

const INITIAL_STATE: ChatState = {
  messages: [],
  input: '',
  isSending: false,
  error: null,
  typingIndicator: false,
  selectedProvider: 'openai',
  selectedModel: null,
  availableProviders: null,
  abortController: null,
};

export function useChat(): ChatState & ChatActions {
  const [state, setState] = useState<ChatState>(INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Update state ref when state changes
  const updateState = useCallback((updates: Partial<ChatState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Load saved settings on mount (provider/model only)
  useEffect(() => {
    const savedProvider = localStorage.getItem(STORAGE_KEYS.SELECTED_PROVIDER);
    const savedModel = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);

    if (savedProvider) {
      updateState({ selectedProvider: savedProvider as Provider });
    }
    if (savedModel) {
      updateState({ selectedModel: savedModel });
    }

    // Load available models
    loadModels();
  }, [updateState]);

  // Save provider/model selection
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_PROVIDER, state.selectedProvider);
  }, [state.selectedProvider]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, state.selectedModel || '');
  }, [state.selectedModel]);

  const loadModels = useCallback(async () => {
    try {
      const modelsConfig = await chatApi.getModels();
      updateState({ availableProviders: modelsConfig });
    } catch (error) {
      console.error('Failed to load models:', error);
      updateState({
        error: {
          status: 0,
          message: 'Failed to load available models',
          details: error,
        }
      });
    }
  }, [updateState]);

  const createMessage = useCallback((
    role: Message['role'],
    content: string,
    provider?: Provider,
    model?: string,
    status?: Message['status']
  ): Message => {
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
      status,
      provider,
      model,
    };
  }, []);

  const sendMessage = useCallback(async (
    text: string,
    provider: Provider,
    model?: string
  ) => {
    if (!text.trim()) return;

    const abortController = new AbortController();
    updateState({
      isSending: true,
      typingIndicator: true,
      error: null,
      abortController
    });

    // Add user message and pending assistant message together to avoid
    // race conditions with consecutive state updates.
    const userMessage = createMessage('user', text, provider, model, 'ok');
    const pendingMessage = createMessage('assistant', '', provider, model, 'pending');
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage, pendingMessage],
    }));

    try {
      const response = await chatApi.chat({
        userRequest: text,
        provider,
        model,
      });

      // Update pending message with response
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === pendingMessage.id
            ? {
                ...msg,
                content: response.response,
                status: 'ok',
                provider: response.provider,
                model: response.model || model,
              }
            : msg
        ),
        isSending: false,
        typingIndicator: false,
      }));

    } catch (error) {
      const apiError = error as ApiError;

      // Update pending message with error
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === pendingMessage.id
            ? {
                ...msg,
                status: 'error',
                error: apiError.message,
              }
            : msg
        ),
        isSending: false,
        typingIndicator: false,
        error: apiError,
      }));
    }
  }, [createMessage, updateState]);

  const sendStreamingMessage = useCallback(async (
    text: string,
    provider: Provider,
    model?: string,
  ): Promise<{ content: string | null }> => {
    if (!text.trim() || stateRef.current.isSending) return;

    const abortController = new AbortController();
    updateState({
      isSending: true,
      typingIndicator: true,
      error: null,
      abortController
    });

    // Create user + pending assistant messages
    const userMessage = createMessage('user', text, provider, model, 'ok');
    const pendingMessage = createMessage('assistant', '', provider, model, 'pending');
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage, pendingMessage],
    }));

    try {
      const response = await fetch((import.meta as any).env.VITE_API_URL + '/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          userRequest: text,
          provider,
          model
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${response.statusText} ${errorText}`.trim());
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const decoder = new TextDecoder();
      let buffer = '';
      let finalContent: string | null = null;
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6);

          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'assistant_chunk') {
              const chunk: string = event.content || '';
              accumulated += chunk;
              setState(prev => ({
                ...prev,
                messages: prev.messages.map(msg =>
                  msg.id === pendingMessage.id
                    ? { ...msg, content: (msg.content || '') + chunk }
                    : msg
                )
              }));
            } else if (event.type === 'assistant') {
              const content: string = event.content || '';
              setState(prev => ({
                ...prev,
                messages: prev.messages.map(msg =>
                  msg.id === pendingMessage.id
                    ? { ...msg, content, status: 'ok' }
                    : msg
                )
              }));
              finalContent = content;
            } else if (event.type === 'complete') {
              // Mark pending assistant message as completed if still pending
              setState(prev => ({
                ...prev,
                messages: prev.messages.map(msg =>
                  msg.id === pendingMessage.id && msg.status === 'pending'
                    ? { ...msg, status: 'ok' }
                    : msg
                )
              }));
              updateState({ isSending: false, typingIndicator: false, abortController: null });
              if (!finalContent) {
                finalContent = accumulated;
              }
            } else if (event.type === 'error') {
              const errMsg: string = event.content || 'Unknown error';
              setState(prev => ({
                ...prev,
                messages: prev.messages.map(msg =>
                  msg.id === pendingMessage.id
                    ? { ...msg, status: 'error', error: errMsg }
                    : msg
                )
              }));
              updateState({ isSending: false, typingIndicator: false, abortController: null, error: { status: 0, message: errMsg } });
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', e, jsonStr);
          }
        }
      }
      return { content: finalContent };
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        // Mark as cancelled
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === pendingMessage.id
              ? { ...msg, status: 'error', error: 'Request cancelled' }
              : msg
          )
        }));
      } else {
        const errMsg = error?.message || 'Streaming failed';
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === pendingMessage.id
              ? { ...msg, status: 'error', error: errMsg }
              : msg
          )
        }));
        updateState({ error: { status: 0, message: errMsg } });
      }
      updateState({ isSending: false, typingIndicator: false, abortController: null });
      return { content: null };
    }
  }, [createMessage, updateState]);

  const cancelSend = useCallback(() => {
    if (state.abortController) {
      state.abortController.abort();
      updateState({
        isSending: false,
        typingIndicator: false,
        abortController: null
      });
    }
  }, [state.abortController, updateState]);

  const retryMessage = useCallback(async (messageId: string) => {
    const message = stateRef.current.messages.find(msg => msg.id === messageId);
    if (!message || message.role !== 'assistant' || message.status !== 'error') return;

    // Find the user message before this assistant message
    const messageIndex = stateRef.current.messages.findIndex(msg => msg.id === messageId);
    const userMessage = stateRef.current.messages
      .slice(0, messageIndex)
      .reverse()
      .find(msg => msg.role === 'user');

    if (!userMessage || !message.provider) return;

    // Remove the failed message and retry
    setState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.id !== messageId),
    }));

    await sendMessage(userMessage.content, message.provider, message.model);
  }, [sendMessage]);

  const clearMessages = useCallback(() => {
    updateState({ messages: [] });
  }, [updateState]);

  const setMessagesFromHistory = useCallback((messages: Array<{ role: Message['role']; content: string; timestamp?: string | Date; provider?: Provider; model?: string }>) => {
    const normalized = messages.map((m) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      status: 'ok' as const,
      provider: m.provider,
      model: m.model,
    }));
    updateState({ messages: normalized });
  }, [updateState]);

  const setInput = useCallback((input: string) => {
    updateState({ input });
  }, [updateState]);

  const setSelectedProvider = useCallback((provider: Provider) => {
    updateState({ selectedProvider: provider });
  }, [updateState]);

  const setSelectedModel = useCallback((model: string | null) => {
    updateState({ selectedModel: model });
  }, [updateState]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Helper to get provider options for UI
  const getProviderOptions = useCallback((): ProviderOption[] => {
    if (!state.availableProviders) return [];

    return Object.entries(state.availableProviders.providers).map(([key, provider]) => ({
      name: key,
      displayName: provider.displayName || key,
      models: provider.models.map(model => ({
        name: model.name,
        alias: model.alias,
        provider: key,
      })),
    }));
  }, [state.availableProviders]);

  // Helper to resolve alias to model name
  const resolveModelAlias = useCallback((provider: Provider, input: string): string => {
    if (!state.availableProviders) return input;

    const providerConfig = state.availableProviders.providers[provider];
    if (!providerConfig) return input;

    // Check if input matches an alias
    const model = providerConfig.models.find(m => m.alias === input);
    return model?.name || input;
  }, [state.availableProviders]);

  return {
    ...state,
    setInput,
    sendMessage,
    sendStreamingMessage,
    cancelSend,
    retryMessage,
    clearMessages,
    setSelectedProvider,
    setSelectedModel,
    clearError,
    getProviderOptions,
    resolveModelAlias,
    setMessagesFromHistory,
  };
}
