import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface Reaction {
  id: string;
  emoji: string;
  label: string;
  color: string;
}

interface ReactionSystemProps {
  reactions: { [key: string]: number };
  userReaction?: string;
  onReact: (reactionId: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

const ReactionSystem: React.FC<ReactionSystemProps> = ({
  reactions,
  userReaction,
  onReact,
  size = 'md'
}) => {
  const { resolvedTheme } = useTheme();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const reactionSystemRef = useRef<HTMLDivElement>(null);

  const reactionTypes: Reaction[] = [
    { id: 'like', emoji: '👍', label: 'Thích', color: '#1877F2' },
    { id: 'love', emoji: '❤️', label: 'Yêu thích', color: '#F33E58' },
    { id: 'haha', emoji: '😆', label: 'Haha', color: '#F7B125' },
    { id: 'wow', emoji: '😮', label: 'Wow', color: '#F7B125' },
    { id: 'sad', emoji: '😢', label: 'Buồn', color: '#F7B125' },
    { id: 'angry', emoji: '😡', label: 'Tức giận', color: '#E4626B' },
    { id: 'care', emoji: '🤗', label: 'Quan tâm', color: '#F7B125' }
  ];

  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);
  const topReactions = Object.entries(reactions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .filter(([, count]) => count > 0);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const emojiSizeClasses = {
    sm: 'w-4 h-4 text-sm',
    md: 'w-5 h-5 text-base',
    lg: 'w-6 h-6 text-lg'
  };

  const handleReactionClick = (reactionId: string) => {
    onReact(reactionId);
    setShowReactionPicker(false);
  };

  const getUserReactionEmoji = () => {
    if (!userReaction) return '👍';
    const reaction = reactionTypes.find(r => r.id === userReaction);
    return reaction?.emoji || '👍';
  };

  const getUserReactionLabel = () => {
    if (!userReaction) return 'Thích';
    const reaction = reactionTypes.find(r => r.id === userReaction);
    return reaction?.label || 'Thích';
  };

  // Handle clicking outside to close picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reactionSystemRef.current && !reactionSystemRef.current.contains(event.target as Node)) {
        setShowReactionPicker(false);
      }
    };

    if (showReactionPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showReactionPicker]);

  return (
    <div ref={reactionSystemRef} className="flex items-center" style={{ pointerEvents: 'auto' }}>
      {/* Reaction Count Display */}
      {totalReactions > 0 && (
        <div className={`flex items-center space-x-1 mr-4 ${sizeClasses[size]}`}>
          <div className="flex -space-x-1">
            {topReactions.map(([reactionId]) => {
              const reaction = reactionTypes.find(r => r.id === reactionId);
              return (
                <div
                  key={reactionId}
                  className={`${emojiSizeClasses[size]} flex items-center justify-center rounded-full border-2 ${resolvedTheme === 'dark' ? 'border-gray-800 bg-gray-800' : 'border-white bg-white'}`}
                  style={{ backgroundColor: reaction?.color }}
                >
                  <span className="text-white text-xs">
                    {reaction?.emoji}
                  </span>
                </div>
              );
            })}
          </div>
          <span className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} ml-2`}>
            {totalReactions.toLocaleString()}
          </span>
        </div>
      )}

      {/* Reaction Button */}
      <div className="relative inline-block" style={{ pointerEvents: 'auto' }}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Reaction button clicked - toggling picker');
            setShowReactionPicker(!showReactionPicker);
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${sizeClasses[size]} ${
            userReaction
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50'
              : resolvedTheme === 'dark'
              ? 'text-gray-400 hover:bg-white/10 hover:text-white'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
          style={{ pointerEvents: 'auto', userSelect: 'none' }}
        >
          <span className={`${emojiSizeClasses[size]} leading-none pointer-events-none`}>
            {getUserReactionEmoji()}
          </span>
          <span className="font-medium leading-none pointer-events-none">
            {getUserReactionLabel()}
          </span>
        </button>

        {/* Reaction Picker */}
        {showReactionPicker && (
          <div
            className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 ${
              resolvedTheme === 'dark' ? 'bg-gray-800 border border-white/20' : 'bg-white border border-gray-200'
            } rounded-full px-4 py-3 shadow-2xl z-[9999] flex space-x-2`}
            style={{ 
              minWidth: 'max-content', 
              pointerEvents: 'auto',
              position: 'absolute',
              willChange: 'transform'
            }}
          >
            {reactionTypes.map((reaction) => (
              <button
                key={reaction.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Emotion clicked:', reaction.id);
                  handleReactionClick(reaction.id);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleReactionClick(reaction.id);
                }}
                className={`w-8 h-8 flex items-center justify-center transition-all hover:scale-125 p-1 rounded-full cursor-pointer ${
                  resolvedTheme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                } active:scale-110 select-none`}
                title={reaction.label}
                style={{ 
                  pointerEvents: 'auto',
                  userSelect: 'none',
                  touchAction: 'manipulation'
                }}
              >
                <span 
                  className="text-lg leading-none select-none" 
                  style={{ pointerEvents: 'none' }}
                >
                  {reaction.emoji}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReactionSystem;
