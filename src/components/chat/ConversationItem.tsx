import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { MoreHorizontal, Share, Pencil, Archive, Trash2 } from 'lucide-react';

interface ConversationItemProps {
  id: string;
  title: string;
  active: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, title: string) => void;
  onArchive?: (id: string) => void;
  onShare?: (id: string) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ id, title, active, onClick, onDelete, onRename, onArchive, onShare }) => {
  const { isDark } = useTheme();
  const [openMenu, setOpenMenu] = useState(false);
  const [placement, setPlacement] = useState<'above' | 'below'>('below');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [coords, setCoords] = useState<{top: number; left: number}>({ top: 0, left: 0 });

  useEffect(() => {
    if (!openMenu) return;
    const close = (e: MouseEvent) => {
      const el = containerRef.current;
      const anchor = anchorRef.current;
      const menu = menuRef.current;
      const target = e.target as Node;
      if (menu && menu.contains(target)) return;
      if (anchor && anchor.contains(target)) return;
      if (el && !el.contains(target)) setOpenMenu(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openMenu]);

  useEffect(() => {
    if (!openMenu) return;
    const compute = () => {
      const anchor = anchorRef.current ?? containerRef.current;
      if (!anchor) return;
      const triggerRect = anchor.getBoundingClientRect();
      const MENU_W = 192; // w-48
      const menuH = menuRef.current?.offsetHeight || 196;
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const placeAbove = spaceBelow < menuH + 12 && spaceAbove > menuH;
      setPlacement(placeAbove ? 'above' : 'below');
      const left = Math.max(8, triggerRect.right - MENU_W);
      const top = placeAbove ? triggerRect.top - menuH - 8 : triggerRect.bottom + 8;
      setCoords({ left, top });
    };
    // compute now and close on sidebar scroll to avoid desync
    compute();
    const scrollEl = containerRef.current?.closest('[data-chat-scroll]');
    const onScroll = () => setOpenMenu(false);
    scrollEl?.addEventListener('scroll', onScroll);
    window.addEventListener('resize', compute);
    return () => {
      scrollEl?.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', compute);
    };
  }, [openMenu]);

  return (
    <div className="relative group" ref={containerRef}>
      <div
        onClick={onClick}
        className={`relative w-full text-left pl-3 pr-8 py-2 rounded-xl border text-sm overflow-hidden transition-colors cursor-pointer ${
          isDark
            ? (active ? 'bg-white/15 border-white/20 text-white' : 'bg-transparent border-white/10 text-gray-300 hover:bg-white/10')
            : (active ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-transparent border-gray-200 text-gray-700 hover:bg-gray-50')
        }`}
      >
        {active && (
          <div className={`pointer-events-none absolute inset-0 rounded-xl ring-2 ${isDark ? 'ring-white/20' : 'ring-blue-500/30'}`} />
        )}
        <span className="pr-6 inline-block truncate max-w-[85%] align-middle">{title}</span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2">
          <button
            ref={anchorRef}
            onClick={(e) => { e.stopPropagation(); setOpenMenu((v) => !v); }}
            className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} p-1 rounded-md`}
            title="More"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </span>
      </div>

      {openMenu && createPortal(
        <div
          ref={menuRef}
          className={`fixed z-50 w-48 rounded-2xl border shadow-lg p-2 ${
            isDark ? 'bg-[#1B2127] border-white/10 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
          }`}
          style={{ left: coords.left, top: coords.top }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10"
            onClick={() => { setOpenMenu(false); onShare?.(id); }}
          >
            <Share className="w-4 h-4" />
            <span>Share</span>
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10"
            onClick={() => {
              setOpenMenu(false);
              const name = prompt('Rename chat', title);
              if (name && name.trim()) onRename?.(id, name.trim());
            }}
          >
            <Pencil className="w-4 h-4" />
            <span>Rename</span>
          </button>
          <div className={`${isDark ? 'border-white/10' : 'border-gray-200'} my-1 border-t`} />
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10"
            onClick={() => { setOpenMenu(false); onArchive?.(id); }}
          >
            <Archive className="w-4 h-4" />
            <span>Archive</span>
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-red-400"
            onClick={() => { setOpenMenu(false); onDelete(id); }}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ConversationItem;
