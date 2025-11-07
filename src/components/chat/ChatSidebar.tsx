import React from 'react';
import { Plus } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import SidebarSearch from './SidebarSearch';
import ConversationItem from './ConversationItem';

export interface ConversationItem {
  id: string;
  title: string;
  archived?: boolean;
}

interface ChatSidebarProps {
  conversations: ConversationItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, title: string) => void;
  onArchive?: (id: string) => void;
  onShare?: (id: string) => void;
  searchInputRef?: React.Ref<HTMLInputElement>;
  showNewChat?: boolean;
  showSearch?: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ conversations, activeId, onSelect, onNewChat, searchValue, onSearchChange, onDelete, onRename, onArchive, onShare, searchInputRef, showNewChat = true, showSearch = true }) => {
  // Flat list like ChatGPT: single scrollable list, newest first
  const q = searchValue.trim().toLowerCase();
  const visible = conversations.filter((c) => !c.archived);
  const filtered = q ? visible.filter((c) => c.title.toLowerCase().includes(q)) : visible;

  const { isDark } = useTheme();
  return (
    <aside className="hidden md:flex md:flex-col md:col-span-3 lg:col-span-3 gap-3 pl-4 pr-3">
      {showNewChat && (
        <button
          onClick={onNewChat}
          className={`relative w-full rounded-xl px-4 py-3 text-left flex items-center gap-3 border transition-colors ${
            isDark ? 'bg-[#1B2127] border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
            isDark ? 'bg-white/10 text-white' : 'bg-gray-900/5 text-gray-700'
          }`}>
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-medium text-base">New chat</span>
        </button>
      )}

      <div className={`rounded-2xl p-3 border ${isDark ? 'bg-[#1B2127] border-white/10' : 'bg-white border-gray-200'}`}>
        {showSearch && (
          <SidebarSearch ref={searchInputRef} value={searchValue} onChange={onSearchChange} />
        )}
        <div className="max-h-[calc(100vh-220px)] overflow-auto pr-1 space-y-1" data-chat-scroll>
          <div className={`px-1 py-1 text-[11px] uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Chats</div>
          {filtered.map((c) => (
            <ConversationItem
              key={c.id}
              id={c.id}
              title={c.title}
              active={activeId === c.id}
              onClick={() => onSelect(c.id)}
              onDelete={onDelete}
              onRename={onRename}
              onArchive={onArchive}
              onShare={onShare}
            />
          ))}
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;
