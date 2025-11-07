import React, { useState, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { streamingService, StreamingToolType, StreamingRequest, StreamingCallbacks } from '../services/streamingService';

interface StreamingAgentExampleProps {
  agentType: StreamingToolType;
  metadata?: Record<string, any>;
}

/**
 * Example component showing how to use streaming for any agent
 * This can be used as a template for Marketing, QA/QC, Data, Design, Game Dev, L&D agents
 */
const StreamingAgentExample: React.FC<StreamingAgentExampleProps> = ({ 
  agentType, 
  metadata = {} 
}) => {
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
  }>>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create session on mount
  React.useEffect(() => {
    const initSession = async () => {
      try {
        const session = await streamingService.createSession(agentType);
        setSessionId(session.session_id);
      } catch (error) {
        console.error('Failed to create session:', error);
        // Fallback session ID
        setSessionId(`${agentType}_${Date.now()}`);
      }
    };
    initSession();

    // Cleanup on unmount
    return () => {
      if (sessionId) {
        streamingService.cleanupSession(sessionId, agentType).catch(console.error);
      }
    };
  }, [agentType]);

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming || !sessionId) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsStreaming(true);

    // Create placeholder for assistant message
    const assistantMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    // Create abort controller for this stream
    abortControllerRef.current = new AbortController();

    const request: StreamingRequest = {
      tool_type: agentType,
      session_id: sessionId,
      message: userMessage,
      language: 'english', // or 'vietnamese'
      metadata: metadata // Pass any agent-specific metadata
    };

    const callbacks: StreamingCallbacks = {
      onChunk: (chunk: string) => {
        // Update assistant message with streaming chunks
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[assistantMessageIndex]) {
            newMessages[assistantMessageIndex].content += chunk;
          }
          return newMessages;
        });
      },
      onComplete: (data) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        console.log('Streaming completed:', data);
      },
      onError: (error: string) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        console.error('Streaming error:', error);
        // Show error message
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[assistantMessageIndex]) {
            newMessages[assistantMessageIndex].content = `Error: ${error}`;
          }
          return newMessages;
        });
      }
    };

    try {
      await streamingService.streamChat(
        request,
        callbacks,
        abortControllerRef.current.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to stream:', err);
        setIsStreaming(false);
      }
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  // Get agent-specific configuration
  const getAgentConfig = () => {
    switch (agentType) {
      case StreamingToolType.MARKETING:
        return {
          title: 'Marketing Assistant',
          placeholder: 'Ask about social media content, email campaigns, SEO...',
          color: 'purple'
        };
      case StreamingToolType.QA_QC:
        return {
          title: 'QA/QC Assistant',
          placeholder: 'Ask about test cases, quality checks, bug analysis...',
          color: 'orange'
        };
      case StreamingToolType.DATA:
        return {
          title: 'Data Analysis Assistant',
          placeholder: 'Ask about SQL queries, data analysis, reports...',
          color: 'blue'
        };
      case StreamingToolType.DESIGN:
        return {
          title: 'Design Assistant',
          placeholder: 'Ask about UI/UX, color palettes, layouts...',
          color: 'pink'
        };
      case StreamingToolType.GAME_DEV:
        return {
          title: 'Game Dev Assistant',
          placeholder: 'Ask about game mechanics, level design, optimization...',
          color: 'green'
        };
      case StreamingToolType.LD:
        return {
          title: 'L&D Assistant',
          placeholder: 'Ask about course creation, learning objectives, assessments...',
          color: 'indigo'
        };
      default:
        return {
          title: 'AI Assistant',
          placeholder: 'Ask me anything...',
          color: 'gray'
        };
    }
  };

  const config = getAgentConfig();

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className={`bg-${config.color}-600 text-white p-4 rounded-t-lg`}>
        <h2 className="text-xl font-bold">{config.title}</h2>
        <p className="text-sm opacity-90">Streaming Response Enabled</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? `bg-${config.color}-500 text-white`
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.role === 'assistant' && isStreaming && index === messages.length - 1 && (
                <div className="mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-xs opacity-70">Typing...</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder={config.placeholder}
            disabled={isStreaming}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className={`px-4 py-2 bg-${config.color}-600 text-white rounded-lg hover:bg-${config.color}-700 disabled:opacity-50`}
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamingAgentExample;

// Example usage for different agents:
// <StreamingAgentExample agentType={StreamingToolType.MARKETING} metadata={{ style: 'professional', platform: 'linkedin' }} />
// <StreamingAgentExample agentType={StreamingToolType.QA_QC} metadata={{ test_type: 'unit', priority: 'high' }} />
// <StreamingAgentExample agentType={StreamingToolType.DATA} metadata={{ db_type: 'postgresql' }} />
// <StreamingAgentExample agentType={StreamingToolType.DESIGN} metadata={{ style: 'modern', design_type: 'web' }} />
