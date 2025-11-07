import React, { useState, useRef, useEffect } from 'react';
import { 
  Gamepad2, 
  Send, 
  Upload, 
  Copy, 
  Save, 
  Download, 
  Sparkles,
  MessageSquare,
  Zap,
  Sword,
  Users,
  FileText,
  Settings,
  Search,
  TrendingUp,
  Star,
  Clock,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
  Lightbulb,
  Code,
  BarChart3,
  Layers,
  Target,
  Palette,
  Globe,
  Bot,
  User,
  Eye,
  Trash2,
  Edit3,
  Plus
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { trackToolUsage } from './tracking/tracker';

interface GeneratedContent {
  id: string;
  title: string;
  content: string;
  type: string;
  timestamp: string;
  rating: number;
}

const GameDevAgentPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('gameplay');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [streamingPhase, setStreamingPhase] = useState<'raw' | 'complete'>('raw');
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Form states
  const [language, setLanguage] = useState('english');
  const [style, setStyle] = useState('epic');
  const [objective, setObjective] = useState('quick');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const contentTypes = [
    { id: 'gameplay', name: 'Gameplay Ideas', icon: Gamepad2, color: 'text-purple-600', bgColor: 'bg-purple-50', apiType: 'gameplay_idea' },
    { id: 'dialogue', name: 'NPC Dialogue', icon: MessageSquare, color: 'text-blue-600', bgColor: 'bg-blue-50', apiType: 'npc_dialogue' },
    { id: 'balance', name: 'Mechanics Balancing', icon: Target, color: 'text-green-600', bgColor: 'bg-green-50', apiType: 'mechanism_balance' },
    { id: 'story', name: 'Script Writing', icon: FileText, color: 'text-orange-600', bgColor: 'bg-orange-50', apiType: 'script_writing' }
  ];

  const styles = [
    { id: 'epic', name: 'Epic Fantasy', apiType: 'epic_fantasy' },
    { id: 'humor', name: 'Humorous', apiType: 'humorous' },
    { id: 'dark', name: 'Dark Fantasy', apiType: 'dark_fantasy' },
    { id: 'anime', name: 'Anime Style', apiType: 'anime_style' },
    { id: 'realistic', name: 'Realistic Simulation', apiType: 'realistic_simulation' },
    { id: 'casual', name: 'Casual Game', apiType: 'casual_game' }
  ];

  const objectives = [
    { id: 'quick', name: 'Quick Draft', apiType: 'fast_writing' },
    { id: 'unique', name: 'Unique', apiType: 'unique' },
    { id: 'optimized', name: 'Optimized', apiType: 'optimized' },
    { id: 'implementable', name: 'Implementable', apiType: 'deployable' }
  ];

  const promptSuggestions = [
    'Suggest 5 gameplay loops for a stealth RPG mobile game',
    'Write NPC dialogue for a tavern with a witty tone',
    'Design a stat sheet for 3 character classes: warrior, mage, rogue',
    'Write the opening script for a wartime adventure game',
    'Create a skill tree for a magic character focused on buff/support',
    'Suggest 3 mini-games suitable for a fantasy farm game for kids'
  ];

  // Fetch available models from backend
  const fetchAvailableModels = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/models`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setAvailableModels(data.models || []);
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setAvailableModels([]);
    }
  };

  // Fetch available models when component mounts
  useEffect(() => {
    fetchAvailableModels();
  }, []);

  const { resolvedTheme } = useTheme();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setStreamingText('');
    setStreamingPhase('raw');
    setGeneratedContent([]);

    try {
      const sessionId = `game_dev_${Date.now()}`;
      const subToolType = contentTypes.find(s => s.id === activeTab)?.apiType || 'gameplay_idea';
      const styleApiType = styles.find(s => s.id === style)?.apiType || 'epic_fantasy';
      const objectiveApiType = objectives.find(o => o.id === objective)?.apiType || 'fast_writing';

      const requestBody = {
        tool_type: 'game_dev',
        session_id: sessionId,
        message: prompt,
        language: language,
        model: 'auto',
        metadata: {
          sub_tool_type: subToolType,
          style: styleApiType,
          objective: objectiveApiType
        }
      };

      const response = await fetch(import.meta.env.VITE_API_URL + '/streaming/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              try {
                const event = JSON.parse(jsonStr);

                if (event.type === 'assistant_chunk') {
                  const content = event.content || '';
                  setStreamingText(prev => prev + content);
                } else if (event.type === 'structured_result') {
                  setStreamingPhase('complete');
                  const fields = event.fields;

                  let newContent: GeneratedContent[] = [];

                  if (activeTab === 'balance') {
                    newContent = [
                      {
                        id: '1',
                        title: 'Balance Analysis',
                        content: `Match Difficulty: ${fields.match_difficulty || 'N/A'}\n\nSuggestions:\n${fields.suggestions || 'The teams are balanced. No adjustments needed.'}`,
                        type: activeTab,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        rating: 0
                      }
                    ];
                  } else {
                    newContent = [
                      {
                        id: '1',
                        title: 'Main Draft',
                        content: fields.main_draft || '',
                        type: activeTab,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        rating: 0
                      },
                      {
                        id: '2',
                        title: 'More Creative Version',
                        content: fields.creative_version || '',
                        type: activeTab,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        rating: 0
                      },
                      {
                        id: '3',
                        title: 'Simple Version',
                        content: fields.simple_version || '',
                        type: activeTab,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        rating: 0
                      }
                    ];
                  }

                  setGeneratedContent(newContent);
                }
              } catch (parseError) {
                console.error('Error parsing SSE data:', parseError);
              }
            }
          }
        }
      }

      await trackToolUsage('game_dev_agent', activeTab, requestBody);
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    // Show toast notification
  };

  const handleRating = (contentId: string, rating: number) => {
    setGeneratedContent(prev => 
      prev.map(content => 
        content.id === contentId ? { ...content, rating } : content
      )
    );
  };

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-[#0B172A] text-gray-200' : 'bg-transparent text-gray-900'}`}>
      {/* Header */}
      <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} sticky top-0 z-40`}>
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
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl">
                  <Gamepad2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>🎮 GameDev Copilot</h1>
                  <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Accelerate your game development workflow with a specialized AI assistant</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`${resolvedTheme === 'dark' ? 'bg-green-700 text-green-100' : 'bg-green-100 text-green-800'} px-3 py-1 rounded-full text-sm font-medium border border-green-200`}>
                ✅ AI Ready
              </div>
              <div className={`${resolvedTheme === 'dark' ? 'bg-purple-700 text-purple-100' : 'bg-purple-100 text-purple-800'} px-3 py-1 rounded-full text-sm font-medium border border-purple-200`}>
                🎮 GameDev Mode
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-gray-50'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Panel */}
          <div className="lg:col-span-3 space-y-6">
            {/* Step 1: Content Type Selection */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm`}>
              <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} flex items-center`}>
                  <Zap className="h-5 w-5 mr-2 text-purple-500" />
                  Step 1: Select Assistance Type
                </h2>
              </div>
              
              <div className="p-6">
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
                  {contentTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setActiveTab(type.id)}
                        className={`flex flex-col items-center space-y-3 p-4 rounded-lg border transition-all ${
                          activeTab === type.id
                            ? `border-purple-500 ${resolvedTheme === 'dark' ? 'bg-purple-700 text-purple-100' : 'bg-purple-100 text-purple-600'}`
                            : `${resolvedTheme === 'dark' ? 'border-gray-700 hover:border-gray-600 text-gray-300 hover:text-gray-200' : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-800'}`
                        }`}
                      >
                        <IconComponent className="h-6 w-6" />
                        <span className={`text-sm font-medium text-center ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{type.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 2: Prompt Input */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm`}>
              <div className={`p-6 border-b border-gray-200 ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} flex items-center`}>
                  <Edit3 className="h-5 w-5 mr-2 text-purple-500" />
                  Step 2: Enter Specific Request
                </h2>
              </div>
              
              <div className="p-6">
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Example: Suggest 5 gameplay loops for a stealth RPG mobile game..."
                    className={`w-full h-32 px-4 py-3 pr-12 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${resolvedTheme === 'dark' ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-500'}`}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`absolute right-3 top-3 p-2 ${resolvedTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
                  >
                    <Upload className="h-5 w-5 text-gray-500" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.json"
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Prompt Settings */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm`}>
              <div className={`p-6 border-b border-gray-200 ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} flex items-center`}>
                  <Settings className="h-5 w-5 mr-2 text-purple-500" />
                  Prompt Settings
                </h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      <Globe className="h-4 w-4 inline mr-1" />
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className={`w-full px-3 py-2 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                    >
                      <option value="vietnamese">Vietnamese</option>
                      <option value="english">English</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      <Palette className="h-4 w-4 inline mr-1" />
                      Style
                    </label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className={`w-full px-3 py-2 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                    >
                      {styles.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      <Target className="h-4 w-4 inline mr-1" />
                      Objective
                    </label>
                    <select
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      className={`w-full px-3 py-2 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                    >
                      {objectives.map((obj) => (
                        <option key={obj.id} value={obj.id}>{obj.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Buttons */}
            <div className={`flex space-x-4 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className={`flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Generating content...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Generate Content</span>
                  </>
                )}
              </button>
            </div>

            {streamingText && streamingPhase === 'raw' && (
              <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm`}>
                <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} flex items-center`}>
                    <RefreshCw className="h-5 w-5 mr-2 text-purple-500 animate-spin" />
                    Streaming Response...
                  </h2>
                </div>
                <div className="p-6">
                  <div className={`${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4`}>
                    <div className={`${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} whitespace-pre-wrap font-mono text-sm leading-relaxed`}>
                      {streamingText}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generated Content Display */}
            {generatedContent.length > 0 && (
              <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm`}>
                <div className={`p-6 border-b border-gray-200 ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <h2 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} flex items-center`}>
                      <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                      Generated GameDev Content
                    </h2>
                    <span className="text-sm text-gray-500">
                      {generatedContent.length} result{generatedContent.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-6">
                    {generatedContent.map((content, index) => (
                      <div key={content.id} className={`border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-lg ${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                        <div className={`p-4 bg-gradient-to-r ${resolvedTheme === 'dark' ? 'from-gray-800 to-gray-900' : 'from-purple-50 to-indigo-50'} border-b border-gray-600 rounded-t-lg`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              {activeTab !== 'balance' && (
                                <div className={`${resolvedTheme === 'dark' ? 'bg-purple-700 text-purple-100' : 'bg-purple-100 text-purple-600'} px-3 py-1 rounded-full text-sm font-medium`}>
                                  Version {index + 1}
                                </div>
                              )}
                              <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{content.title}</h3>
                            </div>
                            <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'} bg-white px-2 py-1 rounded-md`}>
                              {content.timestamp}
                            </span>
                          </div>
                          
                          {/* Rating System */}
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-600' : 'text-gray-600'}`}>Rate this content:</span>
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => handleRating(content.id, star)}
                                  className={`h-4 w-4 transition-colors ${
                                    star <= content.rating 
                                      ? 'text-yellow-500 fill-current' 
                                      : 'text-gray-300 hover:text-yellow-400'
                                  }`}
                                >
                                  <Star className="h-4 w-4" />
                                </button>
                              ))}
                            </div>
                            {content.rating > 0 && (
                              <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'} ml-2`}>
                                ({content.rating}/5)
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} rounded-lg border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} p-4 mb-4`}>
                            <div className="prose prose-sm max-w-none">
                              <div className={`${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} whitespace-pre-wrap font-mono text-sm leading-relaxed`}>
                                {content.content}
                              </div>
                            </div>
                          </div>
                          
                          <div className={`flex items-center justify-between ${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleCopy(content.content)}
                                className={`flex items-center space-x-2 px-4 py-2 ${resolvedTheme === 'dark' ? 'bg-purple-700 text-purple-100' : 'bg-purple-100 text-purple-700'} rounded-lg font-medium hover:bg-purple-200 transition-colors border border-purple-200`}
                              >
                                <Copy className="h-4 w-4" />
                                <span>Copy</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
          {/* Right Sidebar */}
          <div className={`space-y-6 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-gray-50'}`}>
            {/* Quick Tools */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm`}>
              <div className={`p-4 border-b border-gray-200 ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} flex items-center`}>
                  <Lightbulb className="h-5 w-5 mr-2 text-purple-500" />
                  Quick Tools
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <button className={`w-full flex items-center space-x-3 p-3 ${resolvedTheme === 'dark' ? 'bg-blue-100 text-blue-800' : 'bg-blue-100 text-blue-800'} rounded-lg hover:bg-blue-200 transition-colors border border-blue-200`}>
                  <Users className="h-5 w-5" />
                  <span className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-800' : 'text-gray-900'}`}>Character Profile Builder</span>
                </button>
                <button className={`w-full flex items-center space-x-3 p-3 ${resolvedTheme === 'dark' ? 'bg-green-100 text-green-800' : 'bg-green-100 text-green-800'} rounded-lg hover:bg-green-200 transition-colors border border-green-200`}>
                  <FileText className="h-5 w-5" />
                  <span className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-800' : 'text-gray-900'}`}>Mission & Quest Creator</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors border border-orange-200">
                  <Code className="h-5 w-5" />
                  <span className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-800' : 'text-gray-900'}`}>Export to JSON</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors border border-purple-200">
                  <Download className="h-5 w-5" />
                  <span className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-800' : 'text-gray-900'}`}>Save to Game Doc</span>
                </button>
              </div>
            </div>

            {/* Prompt Suggestions */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm`}>
              <div className={`p-4 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} flex items-center`}>
                  <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                  Prompt Suggestions
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {promptSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(suggestion)}
                    className={`w-full text-left p-3 ${resolvedTheme === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} rounded-lg transition-colors`}
                  >
                    <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-700'}`}>{suggestion}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Game Assets Library */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm`}>
              <div className={`p-4 border-b border-gray-200 ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} flex items-center`}>
                  <Layers className="h-5 w-5 mr-2 text-purple-500" />
                  Game Assets
                </h3>
              </div>
              <div className="p-4">
                <div className={`text-center py-6 ${resolvedTheme === 'dark' ? 'text-gray-600' : 'text-gray-600'}`}>
                  <Layers className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                  <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-600' : 'text-gray-600'}`}>No saved assets</p>
                  <p className={`text-xs mt-1 ${resolvedTheme === 'dark' ? 'text-gray-600' : 'text-gray-600'}`}>Game content will be displayed here</p>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm`}>
              <div className={`p-4 border-b border-gray-200 ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} flex items-center`}>
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
                  This Week's Stats
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className={`flex items-center justify-between ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
                  <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Content Generated</span>
                  <span className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>23</span>
                </div>
                <div className={`flex items-center justify-between ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
                  <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Average Rating</span>
                  <div className={`flex items-center space-x-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>4.5</span>
                  </div>
                </div>
                <div className={`flex items-center justify-between ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
                  <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Time Saved</span>
                  <span className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>8.2h</span>
                </div>
                <div className={`flex items-center justify-between ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
                  <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Most Popular Type</span>
                  <span className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>Dialogue</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDevAgentPage;
