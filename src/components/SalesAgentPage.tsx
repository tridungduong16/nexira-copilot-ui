import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Users, 
  MessageSquare, 
  Phone, 
  Mail, 
  Target,
  TrendingUp,
  BarChart3,
  Clock,
  Star,
  Send,
  Copy,
  Save,
  Sparkles,
  Lightbulb,
  FileText,
  Settings
} from 'lucide-react';
import AgentConfigPanel from './ui/AgentConfigPanel';

const SalesAgentPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('email');
  const [industry, setIndustry] = useState('software');
  const [tone, setTone] = useState('friendly');
  const [length, setLength] = useState('short');
  const [salesPrompt, setSalesPrompt] = useState('');

  const suggestions = [
    'Intro email to book a demo with mid-market prospects',
    'Cold call opener for cybersecurity product',
    'Proposal outline for annual subscription plan',
    'Follow-up after trade show booth visit'
  ];

  const tools = [
    { id: 'email', name: 'Compose Email', icon: Mail, color: 'text-blue-600' },
    { id: 'objection', name: 'Handle Objections', icon: MessageSquare, color: 'text-green-600' },
    { id: 'cold-call', name: 'Cold Call Script', icon: Phone, color: 'text-purple-600' },
    { id: 'proposal', name: 'Write Proposal', icon: FileText, color: 'text-orange-600' }
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
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-3 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">💼 Sales Agent</h1>
                  <p className="text-sm text-gray-600">Increase sales efficiency with professional AI support</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                ✅ AI Ready
              </div>
              <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium border border-emerald-200">
                💼 Sales Mode
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
                <h2 className="text-lg font-semibold text-gray-900">Select Sales Tool</h2>
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
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-800'
                        }`}
                      >
                        <IconComponent className={`h-8 w-8 ${activeTab === tool.id ? tool.color : 'text-gray-500'}`} />
                        <span className="font-medium">{tool.name}</span>
                      </button>
                    );
                  })}
                </div>

                <AgentConfigPanel
                  selectFields={[
                    { id: 'industry', label: 'Industry', value: industry, onChange: setIndustry, options: [
                      { label: 'Software', value: 'software' },
                      { label: 'E-commerce', value: 'ecommerce' },
                      { label: 'Manufacturing', value: 'manufacturing' },
                      { label: 'Finance', value: 'finance' },
                    ]},
                    { id: 'tone', label: 'Tone', value: tone, onChange: setTone, options: [
                      { label: 'Friendly', value: 'friendly' },
                      { label: 'Professional', value: 'professional' },
                      { label: 'Concise', value: 'concise' },
                      { label: 'Persuasive', value: 'persuasive' },
                    ]},
                    { id: 'length', label: 'Length', value: length, onChange: setLength, options: [
                      { label: 'Short', value: 'short' },
                      { label: 'Medium', value: 'medium' },
                      { label: 'Long', value: 'long' },
                    ]},
                  ]}
                  layout={'split'}
                  rightNode={(
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Output preview</h4>
                      <div className="text-xs text-gray-600">
                        <p>• Channel: {activeTab === 'email' ? 'Email' : activeTab === 'cold-call' ? 'Call Script' : activeTab === 'objection' ? 'Objection Handling' : 'Proposal'}</p>
                        <p>• Tone: {tone}</p>
                        <p>• Length: {length}</p>
                        <p>• Industry: {industry}</p>
                      </div>
                    </div>
                  )}
                  textarea={{ label: 'Describe the sales context', value: salesPrompt, onChange: setSalesPrompt, placeholder: 'e.g., Outreach to IT managers in finance about our cloud cost optimizer' }}
                  suggestions={suggestions}
                  onSuggestionClick={(s) => setSalesPrompt(s)}
                  onGenerate={() => {}}
                  generateButtonLabel={'Generate'}
                  accentButtonClass={'bg-emerald-600 hover:bg-emerald-700'}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Sales Statistics</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Emails Sent</span>
                  <span className="font-semibold text-gray-900">47</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Response Rate</span>
                  <span className="font-semibold text-green-600">23%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Deals Closed</span>
                  <span className="font-semibold text-gray-900">12</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAgentPage;