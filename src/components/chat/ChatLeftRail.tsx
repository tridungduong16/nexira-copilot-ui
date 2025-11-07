import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { LayoutPanelLeft, PencilLine, Search, Home } from 'lucide-react';

interface ChatLeftRailProps {
  onToggleHistory?: () => void;
  onNewChat?: () => void;
  onSearch?: () => void;
  onBackHome?: () => void;
}

const RailButton: React.FC<{ title: string; onClick?: () => void; children: React.ReactNode; dark: boolean }>
  = ({ title, onClick, children, dark }) => (
    <button
      title={title}
      onClick={onClick}
      className={`h-12 w-12 rounded-xl border flex items-center justify-center transition-colors ${
        dark ? 'text-gray-100 border-white/10 bg-white/5 hover:bg-white/10' : 'text-gray-800 border-gray-200 bg-white hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );

const ChatLeftRail: React.FC<ChatLeftRailProps> = ({ onToggleHistory, onNewChat, onSearch, onBackHome }) => {
  const { isDark } = useTheme();
  return (
    <div className={`hidden md:flex fixed left-0 top-20 z-40 w-14 pl-2`}>
      <div className="flex flex-col gap-3 items-center">
        <RailButton title="Back to Home" onClick={onBackHome} dark={isDark}>
          <Home className="w-6 h-6" />
        </RailButton>
        <RailButton title="Show history" onClick={onToggleHistory} dark={isDark}>
          <LayoutPanelLeft className="w-6 h-6" />
        </RailButton>
        <RailButton title="New chat" onClick={onNewChat} dark={isDark}>
          <PencilLine className="w-6 h-6" />
        </RailButton>
        <RailButton title="Search" onClick={onSearch} dark={isDark}>
          <Search className="w-6 h-6" />
        </RailButton>
      </div>
    </div>
  );
};

export default ChatLeftRail;
