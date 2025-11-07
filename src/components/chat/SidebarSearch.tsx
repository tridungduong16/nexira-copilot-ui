import React, { forwardRef } from 'react';
import { Search } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface SidebarSearchProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

const SidebarSearch = forwardRef<HTMLInputElement, SidebarSearchProps>(({ value, onChange, placeholder = 'Search' }, ref) => {
  const { isDark } = useTheme();
  return (
    <div className="relative mb-3">
      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-9 pr-3 py-2 rounded-xl focus:outline-none border ${
          isDark
            ? 'bg-[#1B2127] border-white/10 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-white/30'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        }`}
      />
    </div>
  );
});

export default SidebarSearch;
