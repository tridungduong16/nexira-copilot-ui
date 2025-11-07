/**
 * SSE Streaming Service for AI Tools
 * Handles Server-Sent Events communication with backend streaming API
 */

export enum StreamEventType {
  TOOL_CALL = 'tool_call',
  TOOL_RESULT = 'tool_result',
  ASSISTANT_CHUNK = 'assistant_chunk',
  ASSISTANT = 'assistant',
  STRUCTURED_RESULT = 'structured_result',
  COMPLETE = 'complete',
  ERROR = 'error'
}

export enum StreamingToolType {
  HR = 'hr',
  MARKETING = 'marketing',
  GAME_DEV = 'game_dev',
  QA_QC = 'qa_qc',
  LD = 'ld',
  DESIGN = 'design',
  DATA = 'data',
  GENERAL = 'general'
}

export interface StreamingRequest {
  tool_type: StreamingToolType;
  session_id: string;
  message: string;
  language?: string;
  role_level?: string;
  job_type?: string;
  metadata?: Record<string, any>;
}

export interface StreamEvent {
  type: StreamEventType;
  content?: string;
  response_time?: string;
  message_id?: string;
  fields?: any;
}

export interface StreamingCallbacks {
  onChunk?: (chunk: string) => void;
  onComplete?: (data: { response_time?: string; message_id?: string }) => void;
  onError?: (error: string) => void;
  onToolCall?: (data: any) => void;
  onToolResult?: (data: any) => void;
  onStructuredResult?: (fields: any) => void;
}

class StreamingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  }

  /**
   * Create a streaming session
   */
  async createSession(toolType: StreamingToolType, userId?: string): Promise<{ session_id: string }> {
    const url = `${this.baseUrl}/streaming/create-session`;
    const params = new URLSearchParams({ tool_type: toolType });
    if (userId) params.append('user_id', userId);

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Cleanup a streaming session
   */
  async cleanupSession(
    sessionId: string,
    toolType: StreamingToolType,
    userId?: string
  ): Promise<{ success: boolean; message: string }> {
    const url = `${this.baseUrl}/streaming/cleanup-session`;
    const params = new URLSearchParams({
      session_id: sessionId,
      tool_type: toolType
    });
    if (userId) params.append('user_id', userId);

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      // Try to read response body for better error diagnostics
      let errorDetails = response.statusText;
      try {
        const errorBody = await response.text();
        if (errorBody) {
          errorDetails = `${response.statusText}: ${errorBody}`;
        }
      } catch (e) {
        // If reading body fails, use status text only
      }
      throw new Error(`Failed to cleanup session: ${errorDetails}`);
    }

    return response.json();
  }

  /**
   * Stream chat response using Server-Sent Events
   */
  async streamChat(
    request: StreamingRequest,
    callbacks: StreamingCallbacks,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const url = `${this.baseUrl}/streaming/chat`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(request),
        signal: abortSignal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');

        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6); // Remove 'data: ' prefix

            try {
              const event: StreamEvent = JSON.parse(jsonStr);

              switch (event.type) {
                case StreamEventType.ASSISTANT_CHUNK:
                  if (event.content && callbacks.onChunk) {
                    callbacks.onChunk(event.content);
                  }
                  break;

                case StreamEventType.STRUCTURED_RESULT:
                  if (callbacks.onStructuredResult) {
                    callbacks.onStructuredResult(event.fields);
                  }
                  break;

                case StreamEventType.COMPLETE:
                  if (callbacks.onComplete) {
                    callbacks.onComplete({
                      response_time: event.response_time,
                      message_id: event.message_id
                    });
                  }
                  break;

                case StreamEventType.ERROR:
                  if (callbacks.onError) {
                    callbacks.onError(event.content || 'Unknown error');
                  }
                  break;

                case StreamEventType.TOOL_CALL:
                  if (callbacks.onToolCall) {
                    callbacks.onToolCall(event);
                  }
                  break;

                case StreamEventType.TOOL_RESULT:
                  if (callbacks.onToolResult) {
                    callbacks.onToolResult(event);
                  }
                  break;

                default:
                  console.warn('Unknown event type:', event.type);
              }
            } catch (err) {
              console.error('Failed to parse SSE event:', err, jsonStr);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else if (callbacks.onError) {
        callbacks.onError(error.message || 'Streaming failed');
      } else {
        throw error;
      }
    }
  }
}

export const streamingService = new StreamingService();
