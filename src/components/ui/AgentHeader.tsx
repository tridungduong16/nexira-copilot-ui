import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Users, ArrowLeft } from 'lucide-react';

interface AgentHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  tags: { label: string; properties: string; icon?: React.ReactNode }[];
  onBack: () => void;
}

const AgentHeader: React.FC<AgentHeaderProps> = ({
  icon,
  title,
  subtitle,
  tags = [],
  onBack,
}) => {
  const { resolvedTheme } = useTheme();
  return (
    <div className={`border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} sticky top-0 z-40 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
    	<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
              {icon && <span className="mr-1 flex items-center">{React.cloneElement(icon as React.ReactElement, { className: 'h-6 w-6 text-white' })}</span>}
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{title}</h1>
              <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
            {tags.map((tag: { label: string; properties: string; icon?: React.ReactNode }) => (
                <div key={tag.label} className={`flex items-center ${tag.properties}`}>
                  {tag.icon && <span className="mr-1 flex items-center">{React.cloneElement(tag.icon as React.ReactElement, { className: 'h-4 w-4' })}</span>}
                  {tag.label}
                </div>
            ))}
        </div>
      </div>
    </div>
	</div>
  );
};

export default AgentHeader;

