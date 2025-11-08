import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Send, Paperclip, Image as ImageIcon, Mic, Plus, Settings, RotateCcw, Copy } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import ChatSidebar, { ConversationItem } from './chat/ChatSidebar';
import ChatLeftRail from './chat/ChatLeftRail';
import LoadingOverlay from './ui/LoadingOverlay';
import ChatTopBar from './chat/ChatTopBar';
import { useNavigate } from 'react-router-dom';
 
import { useChat } from '../hooks/useChat';
import { useChatHistory } from '../hooks/useChatHistory';
import LoginModal from './ui/LoginModal';
import { isUserAuthenticated, ensureStableUserId } from '../utils/userUtils';

interface ChatPageProps {
  initialPrompt?: string;
  launchFrom?: 'home' | 'direct';
}

const ChatPage: React.FC<ChatPageProps> = ({ initialPrompt }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const listEndRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
 

  // Use our custom chat hook
  const chat = useChat();
  
  // Use chat history hook
  const chatHistory = useChatHistory();
  
  // Convert backend conversations to UI format
  const conversations = useMemo<ConversationItem[]>(() => {
    const list = chatHistory.conversations
      .map(conv => {
        const rawId = (conv as any).conversation_id || (conv as any)._id || (conv as any).id;
        const id = typeof rawId === 'object' ? (rawId?.$oid || rawId?.oid || rawId?.$id || String(rawId)) : rawId;
        if (!id) return null;
        return {
          id: String(id),
          title: conv.title || 'Untitled',
          archived: Boolean((conv as any).archived),
        } as ConversationItem;
      })
      .filter((v): v is ConversationItem => Boolean(v));

    // Deduplicate by id to avoid React key collisions
    const seen = new Set<string>();
    const unique: ConversationItem[] = [];
    for (const item of list) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      unique.push(item);
    }
    if (unique.length === 0 && chatHistory.currentConversation) {
      const cv: any = chatHistory.currentConversation;
      const id = String((cv.conversation_id || cv._id || ''));
      if (id) {
        unique.push({ id, title: cv.title || 'Untitled', archived: Boolean(cv.archived) });
      }
    }
    return unique;
  }, [chatHistory.conversations, chatHistory.currentConversation]);
  
  const [activeConv, setActiveConv] = useState<string>('');
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [showSidebarSearch, setShowSidebarSearch] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [showAttach, setShowAttach] = useState<boolean>(false);
  const attachInputRef = useRef<HTMLInputElement | null>(null);
  const attachContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isNavigatingHome, setIsNavigatingHome] = useState<boolean>(false);
  const [requireLogin, setRequireLogin] = useState<boolean>(false);
  // reserved for future: currently always enable hover for composer

  const placeholder = useMemo(() => t('chat.inputPlaceholder') || 'Send a message...', [t]);

  // Persist and restore last active conversation id between navigations
  useEffect(() => {
    if (activeConv) {
      try { localStorage.setItem('chat-active-conv', activeConv); } catch {}
    }
  }, [activeConv]);

  useEffect(() => {
    if (requireLogin) return;
    if (activeConv) return;
    if (!conversations.length) return;
    let idToOpen: string | null = null;
    try {
      const saved = localStorage.getItem('chat-active-conv');
      if (saved && conversations.some(c => c.id === saved)) {
        idToOpen = saved;
      }
    } catch {}
    if (!idToOpen) {
      idToOpen = conversations[0]?.id || null;
    }
    if (idToOpen) {
      setActiveConv(idToOpen);
      chatHistory.loadConversation(idToOpen).then(conv => {
        if (conv && Array.isArray((conv as any).messages)) {
          const msgs = (conv as any).messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp || conv.updated_at || conv.created_at,
            provider: m.provider,
            model: m.model,
          }));
          if (msgs.length) {
            chat.setMessagesFromHistory(msgs as any);
          }
        }
      }).catch(() => {});
    }
  }, [conversations, activeConv, requireLogin, chatHistory.loadConversation, chat.setMessagesFromHistory]);

  // Get provider options for UI
  const providerOptions = useMemo(() => chat.getProviderOptions(), [chat.getProviderOptions]);
  const availableProviders = useMemo(() => providerOptions.map(p => p.name), [providerOptions]);
  const availableModels = useMemo(() => {
    const currentProvider = providerOptions.find(p => p.name === chat.selectedProvider);
    return currentProvider?.models || [];
  }, [providerOptions, chat.selectedProvider]);

  // If launched with a prompt, prefill composer
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      chat.setInput(initialPrompt.trim());
    }
  }, [initialPrompt, chat.setInput]);

  // Require authentication to use Chat
  useEffect(() => {
    // Ensure we always have a stable user id before any fetches
    try { ensureStableUserId(); } catch {}
    const authed = isUserAuthenticated();
    setRequireLogin(!authed);
    if (!authed) {
      chat.clearMessages();
    }
  }, []);

  // After authentication becomes true, refresh conversations from backend
  // Use stable function ref in deps to avoid infinite re-fetch loops
  useEffect(() => {
    if (!requireLogin) {
      chatHistory.loadConversations().catch(() => {});
    }
  }, [requireLogin, chatHistory.loadConversations]);

  // Listen for cross-component login changes and reload conversations
  // Depend only on stable loadConversations to prevent repeated effect setup
  useEffect(() => {
    const onStorage = () => {
      const authed = isUserAuthenticated();
      setRequireLogin(!authed);
      if (authed) {
        chatHistory.loadConversations().catch(() => {});
      }
    };
    window.addEventListener('storage', onStorage);
    try { window.addEventListener('nexira-login', onStorage as any); } catch {}
    return () => {
      window.removeEventListener('storage', onStorage);
      try { window.removeEventListener('nexira-login', onStorage as any); } catch {}
    };
  }, [chatHistory.loadConversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages.length]);

  // Close attachment popover when clicking outside
  useEffect(() => {
    if (!showAttach) return;
    const handleClickOutside = (e: MouseEvent) => {
      const container = attachContainerRef.current;
      if (!container) return;
      if (!container.contains(e.target as Node)) {
        setShowAttach(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAttach]);

  // Auto-select default model per provider (OpenAI -> gpt-4o-mini)
  const prevProviderRef = useRef<string | null>(null);
  // When provider changes, or when there's no selected model on mount, pick a sensible default
  useEffect(() => {
    if (availableModels.length === 0) return;

    const providerChanged = prevProviderRef.current !== chat.selectedProvider;

    // Only auto-set when provider actually changed, or when there's no model selected yet
    if (!chat.selectedModel || providerChanged) {
      if (chat.selectedProvider === 'openai') {
        const preferred = availableModels.find(m => m.name === 'openai/gpt-4o-mini')
          || availableModels.find(m => m.name === 'openai/o4-mini')
          || availableModels.find(m => m.name === 'openai/gpt-4o');
        chat.setSelectedModel((preferred || availableModels[0]).name);
      } else if (chat.selectedProvider === 'anthropic') {
        const preferred = availableModels.find(m => m.name === 'anthropic/claude-3-5-haiku-20241022')
          || availableModels.find(m => m.name === 'anthropic/claude-sonnet-4-5-20250929')
          || availableModels.find(m => m.name === 'anthropic/claude-sonnet-4-20250514')
          || availableModels.find(m => m.name === 'anthropic/claude-3-7-sonnet-20250219');
        chat.setSelectedModel((preferred || availableModels[0]).name);
      } else {
        const firstModel = availableModels[0];
        chat.setSelectedModel(firstModel.name);
      }
    }

    prevProviderRef.current = chat.selectedProvider;
  }, [availableModels, chat.selectedModel, chat.setSelectedModel, chat.selectedProvider]);

  const send = useCallback(async () => {
    if (requireLogin) return; // block send when not authenticated
    if (!chat.input.trim() || chat.isSending) return;

    // Capture and clear input immediately for better UX
    const text = chat.input;
    chat.setInput('');
    // Reset composer height/expanded state
    setTimeout(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = 'auto';
      }
      setIsExpanded(false);
    }, 0);

    try {
      // Create new conversation if none active
      let conversationId = activeConv;
      if (!conversationId) {
        const newConvId = await chatHistory.createConversation('New Chat');
        conversationId = newConvId;
        setActiveConv(newConvId);
      }

      // Save user message to backend
      await chatHistory.addUserMessage(conversationId, text);

      // Send message to LLM and get response
      const result = await chat.sendStreamingMessage(
        text,
        chat.selectedProvider,
        chat.selectedModel || undefined
      );

      // Save assistant response to backend
      const assistantContent = result?.content || '';
      if (assistantContent) {
        await chatHistory.addAssistantMessage(
          conversationId,
          assistantContent,
          chat.selectedProvider,
          chat.selectedModel || ''
        );
      }

      // Keep sidebar stable; locally bump this conversation to top
      chatHistory.touchConversation(conversationId);
      // Refresh the opened conversation to keep chat view in sync
      await chatHistory.loadConversation(conversationId);

      // Auto-title (frontend-only): when conversation still has default title
      try {
        const existing = conversations.find(c => c.id === conversationId)?.title || 'New Chat';
        if (!existing || existing === 'New Chat') {
          const maxLen = 48;
          const raw = (text || '').replace(/\s+/g, ' ').trim();
          const firstLine = raw.split(/[.!?\n]/)[0] || raw;
          let title = firstLine.slice(0, maxLen);
          if (title.length < raw.length) title = title.trimEnd() + '…';
          // Capitalize first letter
          title = title.charAt(0).toUpperCase() + title.slice(1);
          if (title && title !== existing) {
            // Frontend-only: patch local list; backend persistence will be added later
            chatHistory.touchConversation(conversationId, { title });
          }
        }
      } catch (e) { /* ignore title errors */ }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [chat, chatHistory, activeConv, requireLogin, conversations]);

  // Hydrate chat view when selecting a conversation from the sidebar
  useEffect(() => {
    const conv = chatHistory.currentConversation;
    if (!conv) return;
    // Only hydrate if this conversation is the active one
    const convId = (conv as any).conversation_id || (conv as any)._id;
    if (!convId || convId !== activeConv) return;
    const messages = (conv.messages || []).map((m: any) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp || conv.updated_at || conv.created_at,
      provider: m.provider,
      model: m.model,
    }));
    if (messages.length) {
      chat.setMessagesFromHistory(messages as any);
    }
    // Do not clear UI when backend has no messages; keep local state (e.g., during streaming)
  }, [chatHistory.currentConversation, activeConv]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const IconButton: React.FC<{ title: string; onClick?: () => void; children: React.ReactNode }> = ({ title, onClick, children }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors border ${
        isDark
          ? 'bg-white/10 border-white/10 text-white/80 hover:bg-white/20'
          : 'bg-gray-900/5 border-black/10 text-gray-700 hover:bg-gray-900/10'
      }`}
    >
      {children}
    </button>
  );

  const resizeComposer = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const h = Math.min(el.scrollHeight, 320);
    el.style.height = h + 'px';
    setIsExpanded(h > 56);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    // let Shift+Enter create newline and expand
    if (e.key === 'Enter' && e.shiftKey) {
      setTimeout(resizeComposer, 0);
    }
  };

  const MessageActions: React.FC<{ message: any }> = ({ message }) => (
    <div className={`flex gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      <IconButton
        title="Copy"
        onClick={() => copyToClipboard(message.content)}
      >
        <Copy className="w-3 h-3" />
      </IconButton>
      {message.status === 'error' && (
        <IconButton
          title="Retry"
          onClick={() => chat.retryMessage(message.id)}
        >
          <RotateCcw className="w-3 h-3" />
        </IconButton>
      )}
    </div>
  );

  // Convert common math wrappers to KaTeX-friendly syntax
  const toDisplayMath = (text: string) => {
    if (!text) return text;
    let out = text;
    // Support \\[…\\] and \\(...\\) forms
    out = out.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
    out = out.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
    // Heuristic: [ ... ] that contains a backslash (LaTeX command) → $$ ... $$
    out = out.replace(/\[(?=[^\]]*\\)([^\]]+)\]/gs, (_, inner) => `$$${inner}$$`);
    return out;
  };

  // No quick suggestions per latest request


  return (
    <div className={`${isDark ? 'bg-[#001F3F] text-gray-200' : 'bg-[#E6F0FF] text-gray-900'} fixed inset-0 overflow-hidden`}> 
      <div className="w-full h-full px-0 opacity-0 animate-[fadeIn_400ms_ease-out_forwards]">
        <div className="relative flex items-start h-full">
          {/* Force login modal when not authenticated */}
          <LoginModal
            open={requireLogin}
            dismissible={false}
            hideGuest
            onSelect={() => {
              // After successful login selection, close modal and refresh conversations
              setRequireLogin(false);
              chatHistory.loadConversations().catch(() => {});
            }}
          />
          {/* Sidebar overlays (like ChatGPT) and doesn't push content */}
          {/* Left icon rail (ChatGPT-like) */}
          <ChatLeftRail
            onToggleHistory={() => setSidebarOpen((v) => { const nv = !v; if (nv) { setShowSidebarSearch(false); setSearch(''); } return nv; })}
            onNewChat={async () => { 
              // Explicitly create a fresh conversation and focus it
              if (requireLogin) { setRequireLogin(true); return; }
              chat.clearMessages();
              try {
                const newConvId = await chatHistory.createConversation('New Chat');
                setActiveConv(newConvId);
                const conv = await chatHistory.loadConversation(newConvId);
                if (conv) {
                  const msgs = (conv.messages || []).map((m: any) => ({
                    role: m.role,
                    content: m.content,
                    timestamp: m.timestamp || conv.updated_at || conv.created_at,
                    provider: m.provider,
                    model: m.model,
                  }));
                  if (msgs.length) chat.setMessagesFromHistory(msgs as any);
                }
              } catch (e) {
                console.error('Failed to create conversation:', e);
              }
            }}
            onSearch={() => { setSidebarOpen(true); setShowSidebarSearch(true); setTimeout(() => searchInputRef.current?.focus(), 0); }}
            onBackHome={() => { 
              setIsNavigatingHome(true);
              // Use SPA navigation to avoid white flash
              setTimeout(() => navigate('/home'), 75);
            }}
          />

          {/* Provider/Model selectors above history (left column) */}
          <div className="hidden md:flex absolute left-16 top-4 items-center gap-3 z-40">
            <div className={`relative`}> 
              <select
                value={chat.selectedProvider as any}
                onChange={(e) => chat.setSelectedProvider(e.target.value as any)}
                className={`appearance-none bg-transparent border rounded-xl px-4 py-2 text-xl font-semibold text-center capitalize ${isDark ? 'text-gray-100 border-[#0B63CE]/30 bg-[#0B63CE]/10' : 'text-[#0B63CE] border-[#0B63CE]/30 bg-white'}`}
              >
                {availableProviders.map((p) => (
                  <option key={p} value={p} className={`capitalize ${isDark ? 'bg-[#14171B]' : ''}`}>{p}</option>
                ))}
              </select>
            </div>
            <div className={`relative`}>
              <select
                value={chat.selectedModel || ''}
                onChange={(e) => chat.setSelectedModel(e.target.value)}
                className={`appearance-none bg-transparent border rounded-xl px-4 py-2 text-xl font-semibold text-center ${isDark ? 'text-gray-100 border-[#0B63CE]/30 bg-[#0B63CE]/10' : 'text-[#0B63CE] border-[#0B63CE]/30 bg-white'}`}
              >
                {availableModels.map((m) => (
                  <option key={m.name} value={m.name} className={isDark ? 'bg-[#14171B]' : ''}>{m.alias}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={`hidden md:block absolute left-16 top-24 bottom-6 w-72 md:w-80 transition-all duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'}`}>
            <ChatSidebar
              conversations={conversations}
              activeId={activeConv}
              showSearch={showSidebarSearch}
              onSelect={async (id) => {
                // Clear current view to avoid mixing messages between threads
                if (requireLogin) { setRequireLogin(true); return; }
                chat.clearMessages();
                setActiveConv(id);
                const conv = await chatHistory.loadConversation(id);
                if (conv && Array.isArray((conv as any).messages)) {
                  const msgs = (conv as any).messages.map((m: any) => ({
                    role: m.role,
                    content: m.content,
                    timestamp: m.timestamp || conv.updated_at || conv.created_at,
                    provider: m.provider,
                    model: m.model,
                  }));
                  if (msgs.length) {
                    chat.setMessagesFromHistory(msgs as any);
                  }
                }
              }}
              onNewChat={() => {
                // Mirror left-rail behavior
                (async () => {
                  if (requireLogin) { setRequireLogin(true); return; }
                  chat.clearMessages();
                  try {
                    const newConvId = await chatHistory.createConversation('New Chat');
                    setActiveConv(newConvId);
                    const conv = await chatHistory.loadConversation(newConvId);
                    if (conv) {
                      const msgs = (conv.messages || []).map((m: any) => ({
                        role: m.role,
                        content: m.content,
                        timestamp: m.timestamp || conv.updated_at || conv.created_at,
                        provider: m.provider,
                        model: m.model,
                      }));
                      if (msgs.length) chat.setMessagesFromHistory(msgs as any);
                    }
                  } catch (e) {
                    console.error('Failed to create conversation:', e);
                  }
                })();
              }}
              searchValue={search}
              onSearchChange={setSearch}
              searchInputRef={searchInputRef as any}
              showNewChat={false}
              onDelete={async (id) => {
                if (requireLogin) { setRequireLogin(true); return; }
                await chatHistory.deleteConversation(id);
                if (activeConv === id) {
                  const next = conversations.find(c => c.id !== id && !c.archived)?.id;
                  if (next) {
                    setActiveConv(next);
                    await chatHistory.loadConversation(next);
                  } else {
                    setActiveConv('');
                    chat.clearMessages();
                  }
                }
              }}
              onRename={(id, title) => {
                if (requireLogin) { setRequireLogin(true); return; }
                // Frontend-only: patch local list title for now
                chatHistory.touchConversation(id, { title });
              }}
              onArchive={async (id) => {
                // TODO: Add backend endpoint for archive
                console.log('Archive not implemented yet:', id);
              }}
              onShare={(id) => {
                try {
                  const payload = {
                    provider: chat.selectedProvider,
                    model: chat.selectedModel,
                    messages: chat.messages,
                    conversationId: id,
                  };
                  const text = encodeURIComponent(JSON.stringify(payload, null, 2));
                  const shareUrl = `${location.origin}${location.pathname}#share=${text}`;
                  navigator.clipboard?.writeText(shareUrl);
                  alert('Share link copied to clipboard');
                } catch {}
              }}
            />
          </div>

          {/* Always offset by left rail (md:ml-16). When sidebar opens, increase to md:ml-96. */}
          <div className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-500 pr-4 ${sidebarOpen ? 'md:ml-96' : 'md:ml-16'}`}>
            <ChatTopBar
              provider={chat.selectedProvider}
              onChangeProvider={chat.setSelectedProvider}
              model={chat.selectedModel || ''}
              onChangeModel={chat.setSelectedModel}
              availableProviders={availableProviders}
              availableModels={availableModels}
              // Hide topbar sidebar toggle since we use left rail
              onToggleSidebar={undefined}
              onShare={undefined}
              // no toggle controls here
              actionsOnly
              showActions={false}
            />
            {/* image picker handled elsewhere if needed */}

            {/* Messages scrollable - even wider column */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pt-2 pb-48 max-w-7xl 2xl:max-w-[90rem] mx-auto w-full px-2 sm:px-3 md:px-4">
            {/* Error banner */}
            {chat.error && (
              <div className={`rounded-lg p-3 border ${isDark ? 'bg-red-900/20 border-red-500/30 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{chat.error.message}</span>
                  <IconButton title="Dismiss" onClick={chat.clearError}>
                    <span className="text-sm">×</span>
                  </IconButton>
                </div>
              </div>
            )}

            {/* ChatGPT-style empty state */}
            {chat.messages.length === 0 && !chat.isSending && (
              <div className="flex flex-col items-center justify-center h-full space-y-8 pt-20">
                <div className="text-center space-y-4">
                  <div className={`text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Nexira AI
                  </div>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('chat.startMessage') || 'How can I help you today?'}
                  </p>
                </div>

                {/* Model Selection Card */}
                <div className={`w-full max-w-2xl rounded-2xl border p-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('chat.selectProvider') || 'AI Provider'}
                      </label>
                      <select
                        value={chat.selectedProvider}
                        onChange={(e) => chat.setSelectedProvider(e.target.value)}
                        className={`w-full rounded-lg px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-[#0B63CE]/50 transition-all text-base ${isDark ? 'bg-white/5 border-white/10 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                      >
                        {availableProviders.map((provider) => (
                          <option key={provider} value={provider}>
                            {provider}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('chat.selectModel') || 'Model'}
                      </label>
                      <select
                        value={chat.selectedModel}
                        onChange={(e) => chat.setSelectedModel(e.target.value)}
                        className={`w-full rounded-lg px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-[#0B63CE]/50 transition-all text-base ${isDark ? 'bg-white/5 border-white/10 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                      >
                        {availableModels.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Quick starter suggestions */}
                <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { title: t('chat.suggestion1') || 'Help me write something', icon: '✍️' },
                    { title: t('chat.suggestion2') || 'Explain a concept', icon: '💡' },
                    { title: t('chat.suggestion3') || 'Code assistance', icon: '💻' },
                    { title: t('chat.suggestion4') || 'Creative ideas', icon: '🎨' },
                  ].map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => chat.setInput(suggestion.title)}
                      className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-200' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md text-gray-900'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{suggestion.icon}</span>
                        <span className="text-sm font-medium">{suggestion.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chat.messages.map((m) => (
              <div key={m.id} className="flex w-full">
                <div className={`w-full flex items-start ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="flex flex-col gap-1 max-w-full">
                    <div
                      className={`rounded-2xl px-4 py-3 text-lg md:text-xl leading-relaxed border ${
                        isDark
                          ? (m.role === 'user'
                              ? 'bg-white/10 border-white/10 text-white'
                              : m.status === 'error'
                                ? 'bg-red-900/20 border-red-500/30 text-red-200'
                                : m.status === 'pending'
                                  ? 'bg-white/5 border-white/10 text-gray-100'
                                  : 'bg-[#111418] border-white/10 text-gray-100')
                          : (m.role === 'user'
                              ? 'bg-gray-900/5 border-black/10 text-gray-900'
                              : m.status === 'error'
                                ? 'bg-red-50 border-red-200 text-red-800'
                                : m.status === 'pending'
                                  ? 'bg-gray-50 border-gray-200 text-gray-500'
                                  : 'bg-white border-gray-200 text-gray-900')
                      }`}
                    >
                      {m.status === 'pending' && (
                        m.role === 'assistant' && m.content?.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={{
                                a: ({node, ...props}) => (<a target="_blank" rel="noreferrer" {...props} />),
                                p: ({children}) => (<p className={`my-3 leading-7 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{children}</p>),
                                ul: ({children}) => (<ul className="my-3 pl-6 list-disc space-y-1">{children}</ul>),
                                ol: ({children}) => (<ol className="my-3 pl-6 list-decimal space-y-1">{children}</ol>),
                                li: ({children}) => (<li className="leading-7">{children}</li>),
                                h1: ({children}) => (<h1 className={`mt-4 mb-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{children}</h1>),
                                h2: ({children}) => (<h2 className={`mt-4 mb-2 text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{children}</h2>),
                                h3: ({children}) => (<h3 className={`mt-3 mb-1 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{children}</h3>),
                                blockquote: ({children}) => (<blockquote className={`border-l-4 pl-4 my-3 ${isDark ? 'border-white/20 text-gray-200' : 'border-gray-300 text-gray-700'}`}>{children}</blockquote>),
                              }}
                            >
                               {toDisplayMath(m.content)}
                             </ReactMarkdown>
                            <div className="flex items-center gap-1 opacity-70">
                              <div className="flex gap-1">
                                <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '0ms' }} />
                                <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '150ms' }} />
                                <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '300ms' }} />
                              </div>
                              <span className="text-xs">{t('chat.replying') || 'Replying...'}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <div className="flex gap-1">
                              <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '0ms' }} />
                              <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '150ms' }} />
                              <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-xs">{t('chat.replying') || 'Replying...'}</span>
                          </div>
                        )
                      )}
                      {m.status === 'error' && (
                        <div>
                          <p className="text-sm">{typeof m.error === 'string' ? m.error : 'Failed to get response'}</p>
                        </div>
                      )}
                      {m.status === 'ok' && (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            a: ({node, ...props}) => (<a target="_blank" rel="noreferrer" {...props} />),
                            p: ({children}) => (<p className={`my-3 leading-7 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{children}</p>),
                            ul: ({children}) => (<ul className="my-3 pl-6 list-disc space-y-1">{children}</ul>),
                            ol: ({children}) => (<ol className="my-3 pl-6 list-decimal space-y-1">{children}</ol>),
                            li: ({children}) => (<li className="leading-7">{children}</li>),
                            h1: ({children}) => (<h1 className={`mt-4 mb-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{children}</h1>),
                            h2: ({children}) => (<h2 className={`mt-4 mb-2 text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{children}</h2>),
                            h3: ({children}) => (<h3 className={`mt-3 mb-1 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{children}</h3>),
                            blockquote: ({children}) => (<blockquote className={`border-l-4 pl-4 my-3 ${isDark ? 'border-white/20 text-gray-200' : 'border-gray-300 text-gray-700'}`}>{children}</blockquote>),
                          }}
                        >
                          {toDisplayMath(m.content)}
                        </ReactMarkdown>
                      )}
                    </div>
                    {m.role === 'assistant' && <MessageActions message={m} />}
                  </div>
                </div>
              </div>
            ))}
            <div ref={listEndRef} />
            </div>

            {/* Loader overlay for navigating home */}
            <LoadingOverlay show={isNavigatingHome} />

            {/* Composer (fixed overall) - simplified pill with plus to add files */}
            <div className="fixed inset-x-0 bottom-6 z-50 pb-[env(safe-area-inset-bottom)]">
              <div className="max-w-3xl mx-auto px-3 sm:px-4">
                <div className="relative" ref={attachContainerRef}>
                  {showAttach && (
                    <div className={`absolute left-0 -top-16 w-72 rounded-2xl border shadow-lg px-4 py-3 ${
                      isDark ? 'bg-[#262A30] border-white/10 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
                    }`}>
                      <button
                        type="button"
                        onClick={() => attachInputRef.current?.click()}
                        className="w-full flex items-center gap-3"
                        title="Add photos & files"
                      >
                        <Paperclip className="w-5 h-5" />
                        <span className="text-lg">Add photos & files</span>
                      </button>
                      <input ref={attachInputRef} type="file" multiple className="hidden" />
                    </div>
                  )}

                  <div className={`flex ${isExpanded ? 'items-start' : 'items-center'} gap-3 rounded-${isExpanded ? '2xl' : 'full'} border shadow-sm px-4 ${isExpanded ? 'py-4' : 'py-3'} ${
                    isDark ? 'bg-[#1B2127] border-white/10 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setShowAttach((s) => !s)}
                      className={`${isDark ? 'text-gray-100' : 'text-gray-800'} h-9 w-9 rounded-full flex items-center justify-center hover:bg-white/10`}
                      title="Add"
                      aria-label="Add"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <textarea
                      ref={textareaRef}
                      value={chat.input}
                      onChange={(e) => { chat.setInput(e.target.value); resizeComposer(); }}
                      onKeyDown={onKeyDown}
                      placeholder={t('chat.inputPlaceholder') || 'Ask anything'}
                      disabled={chat.isSending || requireLogin}
                      rows={1}
                      className={`flex-1 resize-none bg-transparent outline-none placeholder-gray-400 text-base md:text-lg max-h-80 overflow-y-auto ${
                        chat.isSending ? 'opacity-50' : ''
                      }`}
                    />
                    <button
                      onClick={send}
                      className="px-3 py-2 rounded-xl transition-colors disabled:opacity-50 border-0 text-white"
                      style={{
                        background: !chat.input.trim() || chat.isSending || requireLogin ? 'rgba(11, 99, 206, 0.3)' : 'linear-gradient(90deg, #0B63CE, #3399FF)'
                      }}
                      disabled={!chat.input.trim() || chat.isSending || requireLogin}
                      aria-label="Send"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ChatPage;
