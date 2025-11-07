import React, { useEffect, useRef, useState } from 'react';
import { PostFilters } from '../../types/knowledge';
import { Search } from 'lucide-react';

interface PostFiltersProps {
  filters: PostFilters;
  onFilterChange: (filters: PostFilters) => void;
  onSearch: (searchTerm: string) => void;
}

const PostFiltersComponent: React.FC<PostFiltersProps> = ({
  filters,
  onFilterChange,
  onSearch
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    filters.tag ? [filters.tag] : []
  );
  const isComposingRef = useRef<boolean>(false);

  // Common tags for filtering (in a real app, this would come from the API)
  const commonTags = [
    'JavaScript', 'React', 'TypeScript', 'Python', 'AI',
    'Machine Learning', 'Backend', 'Frontend', 'Database',
    'DevOps', 'Testing', 'Tutorial', 'Best Practices'
  ];

  // remove other filter UI; just search

  const lastSentRef = useRef<string>('');
  useEffect(() => {
    if (isComposingRef.current) return;
    const id = setTimeout(() => {
      const term = searchTerm.trim();
      if ((term.length === 0 || term.length >= 3) && term !== lastSentRef.current) {
        lastSentRef.current = term;
        onSearch(term);
      }
    }, 600);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const handleSortChange = (_: string) => {};

  const handleSortOrderChange = (_sortOrder: 'asc' | 'desc') => {};

  const handleTagSelect = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    onFilterChange({
      ...filters,
      tag: newTags[0] || undefined // For now, support single tag filtering
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    onFilterChange({
      page: 1,
      limit: filters.limit || 10,
      sort_by: 'created_at',
      sort_order: 'desc'
    });
    onSearch('');
  };

  return (
    <div className="bg-white dark:bg-white/5 rounded-lg shadow-sm border dark:border-white/10 p-4 sticky top-6">

      {/* Search */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300 dark:border-white/10 bg-white dark:bg-[#14171B] text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-500"
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => { isComposingRef.current = false; }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isComposingRef.current) {
                const term = searchTerm.trim();
                lastSentRef.current = term;
                onSearch(term);
              }
            }}
          />
        </div>
      </div>

      {/* No sort or per-page controls */}
    </div>
  );
};

export default PostFiltersComponent;
