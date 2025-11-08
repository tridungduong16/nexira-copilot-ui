import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Users, ArrowLeft } from 'lucide-react';

interface AgentHeaderProps {
  icon?: React.ReactNode;
  avatar?: string;
  title: string;
  subtitle: string;
  description?: string;
  tags: { label: string; properties: string; icon?: React.ReactNode }[];
  onBack: () => void;
}

const AgentHeader: React.FC<AgentHeaderProps> = ({
  icon,
  avatar,
  title,
  subtitle,
  description,
  tags = [],
  onBack,
}) => {
  const { resolvedTheme } = useTheme();
  return (
    <>
    <div className={`border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} sticky top-0 z-40 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
    	<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 ${resolvedTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Marketplace</span>
          </button>
        </div>
      </div>
    </div>
	</div>

    {/* Agent Header with Avatar */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {avatar ? (
            <div className="p-1 rounded-xl bg-white">
              <img
                src={avatar}
                alt={title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            </div>
          ) : icon ? (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
              {React.cloneElement(icon as React.ReactElement, { className: 'h-10 w-10 text-white' })}
            </div>
          ) : null}
          <div>
            <h1 className={`text-3xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-[#001F3F]'}`}>
              {title}
            </h1>
            <p className={`text-lg ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {subtitle}
            </p>
          </div>
        </div>
        {description && (
          <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} max-w-4xl`}>
            {description}
          </p>
        )}
      </div>
    </div>
    </>
  );
};

export default AgentHeader;

