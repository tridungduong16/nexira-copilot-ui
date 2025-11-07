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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
<div className="bg-white border-b border-gray-200 sticky top-0 z-40">
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
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-3 rounded-xl">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">🎨 UI/UX Agent</h1>
                  <p className="text-sm text-gray-600">Design optimal user interfaces with AI</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                ✅ AI Ready
              </div>
              <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium border border-indigo-200">
                🎨 Design Mode
              </div>
            </div>
          </div>
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