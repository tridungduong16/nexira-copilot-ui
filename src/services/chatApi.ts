import { ChatRequest, ChatResponse, ApiError, ModelsConfig } from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ChatAPI {
  private abortController: AbortController | null = null;

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Cancel any existing request
    if (this.abortController) {
      this.abortController.abort();
    }

    // Create new abort controller for this request
    this.abortController = new AbortController();

    try {
      const response = await fetch(`${API_BASE_URL}/chat/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: this.abortController.signal,
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createApiError(response.status, errorData.detail || response.statusText);
      }

      const data = await response.json();
      return data as ChatResponse;

    } catch (error) {
      // Handle aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createApiError(0, 'Request cancelled');
      }

      // Handle network errors
      if (error instanceof Error) {
        throw this.createApiError(0, error.message);
      }

      throw error;
    } finally {
      this.abortController = null;
    }
  }

  async getModels(): Promise<ModelsConfig> {
    try {
      // For now, return fallback config since backend doesn't have /models endpoint yet
      return this.getFallbackModels();
    } catch (error) {
      // If fallback fails, return minimal config
      return this.getMinimalModelsConfig();
    }
  }

  private createApiError(status: number, message: string): ApiError {
    return {
      status,
      message,
    };
  }

  private getFallbackModels(): ModelsConfig {
    return {
      version: '1.0.0',
      providers: {
        openai: {
          displayName: 'OpenAI',
          models: [
            { name: 'openai/gpt-4.1-mini', alias: 'gpt-4.1-mini' },
            { name: 'openai/gpt-4o-mini', alias: 'gpt-4o-mini' },
            { name: 'openai/gpt-4.1', alias: 'gpt-4.1' },
            { name: 'openai/gpt-4.1-nano', alias: 'gpt-4.1-nano' },
            { name: 'openai/gpt-4o', alias: 'gpt-4o' },
            { name: 'openai/gpt-5-nano', alias: 'gpt-5-nano' },
            { name: 'openai/o4-mini', alias: 'o4-mini' },
          ],
        },
        anthropic: {
          displayName: 'Anthropic',
          models: [
            { name: 'anthropic/claude-sonnet-4-5-20250929', alias: 'claude-sonnet-4-5-20250929' },
            { name: 'anthropic/claude-sonnet-4-20250514', alias: 'claude-sonnet-4-20250514' },
            { name: 'anthropic/claude-3-7-sonnet-20250219', alias: 'claude-3-7-sonnet-20250219' },
            { name: 'anthropic/claude-3-5-haiku-20241022', alias: 'claude-3-5-haiku-20241022' },
          ],
        },
      },
    };
  }

  private getMinimalModelsConfig(): ModelsConfig {
    return {
      version: '1.0.0',
      providers: {
        openai: {
          displayName: 'OpenAI',
          models: [{ name: 'gpt-4o', alias: 'GPT-4o' }],
        },
      },
    };
  }

  cancelCurrentRequest(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

export const chatApi = new ChatAPI();