import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Palette, 
  Layout, 
  Eye, 
  Figma,
  Smartphone,
  Monitor,
  Users,
  Target,
  BarChart3,
  Clock,
  Star
} from 'lucide-react';

const UIUXAgentPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('ui-suggestions');

  const tools = [
    { id: 'ui-suggestions', name: 'UI Suggestions', icon: Layout, color: 'text-indigo-600' },
    { id: 'ux-review', name: 'UX Review', icon: Eye, color: 'text-blue-600' },
    { id: 'figma-help', name: 'Figma Support', icon: Figma, color: 'text-purple-600' },
    { id: 'responsive', name: 'Responsive Design', icon: Smartphone, color: 'text-green-600' }
  ];

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-[#001F3F]' : 'bg-[#E6F0FF]'}`}>
      {/* Header */}
<div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} sticky top-0 z-40`}>
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

      {/* Agent Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-1 rounded-xl bg-white">
              <img
                src="/assets/icon8.png"
                alt="UI/UX Agent"
                className="w-16 h-16 object-cover rounded-lg"
              />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-[#001F3F]'}`}>
                UI/UX Agent
              </h1>
              <p className={`text-lg ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Design optimal user interfaces with AI
              </p>
            </div>
          </div>
          <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} max-w-4xl`}>
            Create stunning user experiences with AI-powered design tools, wireframes, and prototypes.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Select UI/UX Tool</h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tools.map((tool) => {
                    const IconComponent = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => setActiveTab(tool.id)}
                        className={`flex flex-col items-center space-y-3 p-6 rounded-lg border transition-all ${
                          activeTab === tool.id
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-800'
                        }`}
                      >
                        <IconComponent className={`h-8 w-8 ${activeTab === tool.id ? tool.color : 'text-gray-500'}`} />
                        <span className="font-medium">{tool.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Design Statistics</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Designs Created</span>
                  <span className="font-semibold text-gray-900">34</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">UX Score</span>
                  <span className="font-semibold text-green-600">8.7/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accessibility</span>
                  <span className="font-semibold text-blue-600">AA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIUXAgentPage;