import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  StopCircle,
  MessageSquare,
  User,
  Bot,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Sparkles,
  Plus,
  Menu,
  X
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const GeneralChatPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = resolvedTheme === 'dark';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setInput('');
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isGenerating) return;

    let currentConvId = activeConversationId;

    if (!currentConvId) {
      createNewConversation();
      currentConvId = `conv_${Date.now()}`;
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConvId) {
        const updatedMessages = [...conv.messages, userMessage];
        const newTitle = conv.messages.length === 0 ? input.trim().slice(0, 30) : conv.title;
        return { ...conv, messages: updatedMessages, title: newTitle };
      }
      return conv;
    }));

    setInput('');
    setIsGenerating(true);

    try {
      const response = await fetch('https://be-copilot.sugarredant.xyz/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_id: currentConvId
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: data.response || 'Sorry, I could not generate a response.',
        timestamp: new Date()
      };

      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConvId) {
          return { ...conv, messages: [...conv.messages, assistantMessage] };
        }
        return conv;
      }));
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date()
      };

      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConvId) {
          return { ...conv, messages: [...conv.messages, errorMessage] };
        }
        return conv;
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  };

  const suggestedPrompts = [
    "Explain quantum computing in simple terms",
    "Write a Python function to sort a list",
    "What are the best practices for web development?",
    "Help me plan a trip to Japan"
  ];

  return (
    <div className={`flex h-screen ${isDark ? 'bg-[#001F3F]' : 'bg-[#E6F0FF]'}`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ${isDark ? 'bg-[#001a33] border-r border-[#0B63CE]/30' : 'bg-white border-r border-gray-200'} flex flex-col overflow-hidden`}>
        <div className={`p-4 border-b ${isDark ? 'border-[#0B63CE]/30' : 'border-gray-200'}`}>
          <button
            onClick={createNewConversation}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${isDark ? 'bg-[#0B63CE]/20 hover:bg-[#0B63CE]/30 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => setActiveConversationId(conv.id)}
              className={`group relative p-3 rounded-lg mb-2 cursor-pointer transition-all ${
                activeConversationId === conv.id
                  ? isDark ? 'bg-[#0B63CE]/20' : 'bg-blue-50'
                  : isDark ? 'hover:bg-[#0B63CE]/10' : 'hover:bg-gray-100'
              }`}
            >
              <div className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                {conv.title}
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {conv.messages.length} messages
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>

        <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <button
            onClick={onBack}
            className={`w-full px-4 py-2 rounded-lg text-sm transition-all ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            ← Back to Marketplace
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-[#0B63CE]/30 bg-[#001a33]' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-[#0B63CE]/20' : 'hover:bg-gray-100'}`}
            >
              <Menu className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-xl bg-white">
                <img
                  src="/assets/icon11.png"
                  alt="General Chat Agent"
                  className="w-12 h-12 object-cover rounded-lg"
                />
              </div>
              <div>
                <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  General Chat Agent
                </h1>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Your AI Assistant
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="p-4 bg-gradient-to-br from-[#0B63CE] to-[#3399FF] rounded-2xl mb-6">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                How can I help you today?
              </h2>
              <p className={`text-center mb-8 max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Start a conversation or try one of these examples
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl w-full">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(prompt);
                      if (!activeConversationId) {
                        createNewConversation();
                      }
                    }}
                    className={`p-4 rounded-xl text-left transition-all ${isDark ? 'bg-[#0B63CE]/10 hover:bg-[#0B63CE]/20 text-gray-300 border border-[#0B63CE]/30' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'}`}
                  >
                    <MessageSquare className="w-5 h-5 mb-2 text-[#0B63CE]" />
                    <p className="text-sm">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full py-8 px-4">
              {activeConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-8 ${message.role === 'user' ? 'flex justify-end' : ''}`}
                >
                  <div className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''} max-w-full`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-[#0B63CE]'
                        : 'bg-gradient-to-br from-[#0B63CE] to-[#3399FF]'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold mb-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {message.role === 'user' ? 'You' : 'Assistant'}
                      </div>
                      <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''} ${
                        message.role === 'user'
                          ? isDark ? 'text-gray-200' : 'text-gray-800'
                          : isDark ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {message.role === 'assistant' ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => copyToClipboard(message.content)}
                            className={`p-1.5 rounded transition-all ${isDark ? 'hover:bg-[#0B63CE]/20' : 'hover:bg-gray-100'}`}
                            title="Copy"
                          >
                            <Copy className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                          </button>
                          <button
                            className={`p-1.5 rounded transition-all ${isDark ? 'hover:bg-[#0B63CE]/20' : 'hover:bg-gray-100'}`}
                            title="Good response"
                          >
                            <ThumbsUp className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                          </button>
                          <button
                            className={`p-1.5 rounded transition-all ${isDark ? 'hover:bg-[#0B63CE]/20' : 'hover:bg-gray-100'}`}
                            title="Bad response"
                          >
                            <ThumbsDown className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                          </button>
                          <button
                            className={`p-1.5 rounded transition-all ${isDark ? 'hover:bg-[#0B63CE]/20' : 'hover:bg-gray-100'}`}
                            title="Regenerate"
                          >
                            <RotateCcw className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="mb-8">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#0B63CE] to-[#3399FF] flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold mb-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Assistant
                      </div>
                      <div className="flex gap-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-[#0B63CE]' : 'bg-gray-400'}`} />
                        <div className={`w-2 h-2 rounded-full animate-pulse delay-75 ${isDark ? 'bg-[#0B63CE]' : 'bg-gray-400'}`} />
                        <div className={`w-2 h-2 rounded-full animate-pulse delay-150 ${isDark ? 'bg-[#0B63CE]' : 'bg-gray-400'}`} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`border-t ${isDark ? 'border-[#0B63CE]/30 bg-[#001a33]' : 'border-gray-200 bg-white'}`}>
          <div className="max-w-4xl mx-auto w-full p-4">
            <div className={`relative rounded-2xl ${isDark ? 'bg-[#0B63CE]/10 border border-[#0B63CE]/30' : 'bg-gray-50 border border-gray-200'}`}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message General Chat Agent..."
                disabled={isGenerating}
                className={`w-full px-4 py-3 pr-12 rounded-2xl resize-none focus:outline-none ${
                  isDark
                    ? 'bg-transparent text-white placeholder-gray-500'
                    : 'bg-transparent text-gray-900 placeholder-gray-400'
                } disabled:opacity-50`}
                rows={1}
                style={{ maxHeight: '200px' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isGenerating}
                className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all ${
                  input.trim() && !isGenerating
                    ? 'bg-[#0B63CE] hover:bg-[#3399FF] text-white'
                    : isDark
                    ? 'bg-[#0B63CE]/20 text-gray-500'
                    : 'bg-gray-200 text-gray-400'
                } disabled:cursor-not-allowed`}
              >
                {isGenerating ? (
                  <StopCircle className="w-5 h-5" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className={`text-xs text-center mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              General Chat Agent can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralChatPage;
