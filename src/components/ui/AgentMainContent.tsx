import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Users,
     Upload
    } from 'lucide-react';
import AgentConfigPanel from './AgentConfigPanel';


interface AgentMainContentProps {
  toolsTitle: string;
  tools: { id: string; name: string; icon: any; color: string }[];
  activeTab: string;
  toolOnClick: (id: string) => void;
  configPanel: React.ReactNode;
  uploadZone: React.ReactNode | null;
  streamingZone: React.ReactNode | null;
  resultZone: React.ReactNode | null;
  sidebar: React.ReactNode | null;
}

const AgentMainContent: React.FC<AgentMainContentProps> = ({
  toolsTitle,
  tools,
  activeTab,
  toolOnClick,
  configPanel,
  uploadZone,
  streamingZone,
  resultZone,
  sidebar,
}) => {
  const { resolvedTheme } = useTheme();
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${resolvedTheme === 'dark' ? 'bg-[#0B172A]' : 'bg-gray-50'}`}>
        <div className={`${sidebar ? 'grid grid-cols-1 lg:grid-cols-4 gap-6' : 'max-w-5xl mx-auto'}`}>
          {/* Main Content */}
          <div className={sidebar ? 'lg:col-span-3' : 'w-full'}>
            <div className={`border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
              <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-xl font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{toolsTitle}</h2>
              </div>
              
              <div className="p-6">
                <div className={`grid ${sidebar ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'} gap-4`}>
                  {tools.map((tool) => {
                    const IconComponent = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => toolOnClick(tool.id)}
                        className={`flex flex-col items-center space-y-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                          activeTab === tool.id
                            ? `${resolvedTheme === 'dark' ? 'border-violet-500 bg-gradient-to-br from-violet-900/50 to-purple-900/50 text-violet-100' : 'border-violet-500 bg-gradient-to-br from-violet-50 to-purple-50 text-violet-700'} shadow-lg`
                            : `${resolvedTheme === 'dark' ? 'border-gray-600 hover:border-gray-500 text-gray-300 hover:text-gray-200 hover:bg-gray-800/50' : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-800 hover:bg-gray-50'} hover:shadow-md hover:scale-[1.02]`
                        }`}
                      >
                        <IconComponent className={`h-8 w-8 ${activeTab === tool.id ? 'text-violet-400' : tool.color}`} />
                        <span className="font-medium text-sm text-center">{tool.name}</span>
                      </button>
                    );
                  })}
                </div>

                {configPanel}

                {uploadZone}

                {streamingZone}
              </div>
            </div>
            
            {resultZone && (
              <div className="mt-6">
                {resultZone}
              </div>
            )}
          </div>

          {sidebar && (
            <div className="lg:col-span-1">
              {sidebar}
            </div>
          )}
        </div>
      </div>
  );
};

export default AgentMainContent;

