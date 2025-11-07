import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Upload, Archive, Trash2, Image as ImageIcon } from 'lucide-react';
import type { ProviderKey } from '../../data/modelConfig';

interface ModelOption {
  name: string;
  alias: string;
}

interface ChatTopBarProps {
  provider: ProviderKey;
  onChangeProvider: (p: ProviderKey) => void;
  model: string;
  onChangeModel: (m: string) => void;
  availableProviders: ProviderKey[];
  availableModels: ModelOption[] | string[];
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onShare?: () => void;
  onBack?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onImages?: () => void;
  actionsOnly?: boolean; // when true, hide provider/model selectors
  showActions?: boolean; // when false, hide right-side actions (Share, menu)
}

const ChatTopBar: React.FC<ChatTopBarProps> = ({ provider, onChangeProvider, model, onChangeModel, availableProviders, availableModels, sidebarOpen = true, onToggleSidebar, onShare, onBack, onArchive, onDelete, onImages, actionsOnly = false, showActions = true }) => {
  const { isDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  const containerJustify = actionsOnly ? 'justify-end' : 'justify-between';
  return (
    <div className={`py-2 flex items-center ${containerJustify} w-full`}>
      {/* Left section: can be hidden in actions-only mode */}
      {!actionsOnly && (
      <div className="flex items-center gap-3">
        {onImages && (
          <button
            onClick={onImages}
            className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
              isDark ? 'text-gray-200 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Images"
            aria-label="Images"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        )}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
              isDark ? 'text-gray-200 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
            }`}
            title={sidebarOpen ? 'Hide history' : 'Show history'}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
        <div className="relative">
          <select
            value={provider}
            onChange={(e) => onChangeProvider(e.target.value as ProviderKey)}
            className={`appearance-none bg-transparent border-0 pl-0 pr-7 py-0 focus:outline-none mr-1 text-lg md:text-xl font-semibold ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}
          >
            {availableProviders.map((p) => (
              <option key={p} value={p} className={isDark ? 'bg-[#14171B]' : ''}>{p}</option>
            ))}
          </select>
          <ChevronDown className={`pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>
        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>·</span>
        <div className="relative ml-1">
          <select
            value={model}
            onChange={(e) => onChangeModel(e.target.value)}
            className={`appearance-none bg-transparent border-0 pl-0 pr-7 py-0 focus:outline-none text-lg md:text-xl font-semibold ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}
          >
            {availableModels.map((m) => {
              const isObject = typeof m === 'object' && m !== null;
              const modelName = isObject ? m.name : m;
              const modelAlias = isObject ? m.alias : m;
              return (
                <option key={modelName} value={modelName} className={isDark ? 'bg-[#14171B]' : ''}>
                  {modelAlias}
                </option>
              );
            })}
          </select>
          <ChevronDown className={`pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>
      </div>
      )}

      {/* Right: Share + menu */}
      {showActions && (
      <div className="flex items-center gap-2 ml-2 sm:ml-3 md:ml-4" ref={menuRef}>
        {typeof onShare === 'function' && (
          <button
            onClick={onShare}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${
              isDark ? 'text-gray-100 hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'
            }`}
            title="Share"
          >
            <Upload className="w-4 h-4" />
            <span className="text-base md:text-lg font-medium">Share</span>
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-colors ${
              isDark ? 'text-gray-100 border-white/10 bg-white/5 hover:bg-white/10' : 'text-gray-800 border-gray-200 bg-white hover:bg-gray-50'
            }`}
            title="More"
            aria-label="More"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {menuOpen && (
            <div className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-lg p-2 ${
              isDark ? 'bg-[#1B1F24] border-white/10' : 'bg-white border-gray-200'
            }`}>
              <button
                onClick={() => { setMenuOpen(false); onArchive && onArchive(); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left ${
                  isDark ? 'text-gray-100 hover:bg-white/5' : 'text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Archive className="w-4 h-4" />
                <span className="text-base">Archive</span>
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete && onDelete(); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left ${
                  isDark ? 'text-red-300 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-base">Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default ChatTopBar;
