export type Provider = 'openai' | 'anthropic' | string;

export interface ChatRequest {
  userRequest: string;
  provider: Provider;
  model?: string;
}

export interface ChatResponse {
  provider: Provider;
  model: string | null;
  response: string;
}

export interface ModelsConfig {
  version: string;
  providers: Record<string, {
    displayName?: string;
    models: Array<{
      name: string;
      alias: string;
    }>;
    aliases?: Record<string, string>;
  }>;
}

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status?: 'ok' | 'pending' | 'error';
  provider?: Provider;
  model?: string;
  error?: string;
}

export interface ChatState {
  messages: Message[];
  input: string;
  isSending: boolean;
  error: ApiError | null;
  typingIndicator: boolean;
  selectedProvider: Provider;
  selectedModel: string | null;
  availableProviders: ModelsConfig | null;
  abortController: AbortController | null;
}

export interface ChatActions {
  setInput: (input: string) => void;
  sendMessage: (text: string, provider: Provider, model?: string) => Promise<void>;
  sendStreamingMessage: (text: string, provider: Provider, model?: string) => Promise<{ content: string | null }>;
  cancelSend: () => void;
  retryMessage: (messageId: string) => Promise<void>;
  clearMessages: () => void;
  setSelectedProvider: (provider: Provider) => void;
  setSelectedModel: (model: string | null) => void;
  clearError: () => void;
  setMessagesFromHistory: (messages: Array<{ role: MessageRole; content: string; timestamp?: string | Date; provider?: Provider; model?: string }>) => void;
}

export interface ModelOption {
  name: string;
  alias: string;
  provider: Provider;
}

export interface ProviderOption {
  name: Provider;
  displayName?: string;
  models: ModelOption[];
}
