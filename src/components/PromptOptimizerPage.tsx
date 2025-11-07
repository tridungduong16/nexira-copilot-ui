import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Settings, 
  Copy, 
  Save, 
  Star, 
  Zap,
  Brain,
  Code,
  Image,
  FileText,
  ArrowLeft,
  Lightbulb,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BookOpen,
  Layers,
  BarChart3,
  MessageSquare,
  Palette,
  Globe,
  Target,
  Users,
  Video,
  Music,
  Database,
  Cpu,
  Smartphone,
  Loader
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { trackToolUsage } from './tracking/tracker';
import AgentHeader from './ui/AgentHeader';

interface PromptVariant {
  id: string;
  title: string;
  prompt: string;
  rating: number;
}

interface OptimizePromptResponse {
  optimised_prompt_1: string;
  optimised_prompt_2: string;
}

interface TestPromptResponse {
  result: string;
}

const PromptOptimizerPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { resolvedTheme } = useTheme();
  const { t, language } = useLanguage();
  const [selectedUseCase, setSelectedUseCase] = useState('text');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('vietnamese');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [streamingPhase, setStreamingPhase] = useState<'raw' | 'complete'>('raw');

  // Test prompt states
  const [testingPrompt, setTestingPrompt] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [testErrors, setTestErrors] = useState<Record<string, string>>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  const [variants, setVariants] = useState<PromptVariant[]>([
    {
      id: '1',
      title: t('promptOptimizerPage.version1'),
      prompt: '',
      rating: 0
    },
    {
      id: '2',
      title: t('promptOptimizerPage.version2'),
      prompt: '',
      rating: 0
    }
  ]);

  // When language changes, update variant titles to the current locale
  useEffect(() => {
    setVariants(prev => prev.map(v => ({
      ...v,
      title: v.id === '1' ? t('promptOptimizerPage.version1') : t('promptOptimizerPage.version2')
    })));
  }, [language]);

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

  const useCases = [
    { 
      id: 'text', 
      name: t('promptOptimizerPage.useCases.text'), 
      icon: FileText, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: t('promptOptimizerPage.useCases.textDescription'),
      apiType: 'text_generation'
    },
    { 
      id: 'image', 
      name: t('promptOptimizerPage.useCases.image'), 
      icon: Image, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: t('promptOptimizerPage.useCases.imageDescription'),
      apiType: 'image_generation'
    },
    { 
      id: 'code', 
      name: t('promptOptimizerPage.useCases.code'), 
      icon: Code, 
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: t('promptOptimizerPage.useCases.codeDescription'),
      apiType: 'programming'
    },
    { 
      id: 'analysis', 
      name: t('promptOptimizerPage.useCases.analysis'), 
      icon: BarChart3, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: t('promptOptimizerPage.useCases.analysisDescription'),
      apiType: 'data_analysis'
    },
    { 
      id: 'conversation', 
      name: t('promptOptimizerPage.useCases.conversation'), 
      icon: MessageSquare, 
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      description: t('promptOptimizerPage.useCases.conversationDescription'),
      apiType: 'dialogue'
    },
    { 
      id: 'creative', 
      name: t('promptOptimizerPage.useCases.creative'), 
      icon: Palette, 
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: t('promptOptimizerPage.useCases.creativeDescription'),
      apiType: 'creative'
    },
    { 
      id: 'translation', 
      name: t('promptOptimizerPage.useCases.translation'), 
      icon: Globe, 
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      description: t('promptOptimizerPage.useCases.translationDescription'),
      apiType: 'translation'
    },
    { 
      id: 'education', 
      name: t('promptOptimizerPage.useCases.education'), 
      icon: Users, 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: t('promptOptimizerPage.useCases.educationDescription'),
      apiType: 'education'
    },
    { 
      id: 'video', 
      name: t('promptOptimizerPage.useCases.video'), 
      icon: Video, 
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: t('promptOptimizerPage.useCases.videoDescription'),
      apiType: 'video_audio'
    },
    { 
      id: 'research', 
      name: t('promptOptimizerPage.useCases.research'), 
      icon: Database, 
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      description: t('promptOptimizerPage.useCases.researchDescription'),
      apiType: 'research'
    },
    { 
      id: 'technical', 
      name: t('promptOptimizerPage.useCases.technical'), 
      icon: Cpu, 
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: t('promptOptimizerPage.useCases.technicalDescription'),
      apiType: 'technical'
    },
    { 
      id: 'mobile', 
      name: t('promptOptimizerPage.useCases.mobile'), 
      icon: Smartphone, 
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      description: t('promptOptimizerPage.useCases.mobileDescription'),
      apiType: 'mobile_app'
    }
  ];

  const handleUpdatePrompt = (variantId: string, newPrompt: string) => {
    setVariants(prev => 
      prev.map(v => 
        v.id === variantId 
          ? { ...v, prompt: newPrompt }
          : v
      )
    );
  };

  const handleRating = (variantId: string, rating: number) => {
    setVariants(prev => 
      prev.map(v => 
        v.id === variantId ? { ...v, rating } : v
      )
    );
  };

  const handleOptimizePrompt = async () => {
    if (!originalPrompt.trim()) return;

    setIsOptimizing(true);
    setOptimizationError(null);
    setStreamingText('');
    setStreamingPhase('raw');
    setVariants([
      {
        id: '1',
        title: t('promptOptimizerPage.version1'),
        prompt: '',
        rating: 0
      },
      {
        id: '2',
        title: t('promptOptimizerPage.version2'),
        prompt: '',
        rating: 0
      }
    ]);

    try {
      const sessionId = `prompt_optimizer_${Date.now()}`;
      const selectedUseCaseType = useCases.find(uc => uc.id === selectedUseCase)?.apiType || 'text_generation';

      const requestBody = {
        tool_type: 'prompt_optimizer',
        session_id: sessionId,
        message: originalPrompt,
        language: selectedLanguage,
        model: 'auto',
        metadata: {
          sub_tool_type: selectedUseCaseType
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
                  flushSync(() => {
                    setStreamingText(prev => prev + content);
                  });
                } else if (event.type === 'structured_result') {
                  setStreamingPhase('complete');
                  const fields = event.fields;

                  setVariants([
                    {
                      id: '1',
                      title: t('promptOptimizerPage.version1'),
                      prompt: fields.optimised_prompt_1 || '',
                      rating: 0
                    },
                    {
                      id: '2',
                      title: t('promptOptimizerPage.version2'),
                      prompt: fields.optimised_prompt_2 || '',
                      rating: 0
                    }
                  ]);
                }
              } catch (parseError) {
                console.error('Error parsing SSE data:', parseError);
              }
            }
          }
        }
      }

      await trackToolUsage('prompt_optimizer', selectedUseCase, requestBody);
    } catch (error) {
      console.error('Error optimizing prompt:', error);
      setOptimizationError(t('promptOptimizerPage.error'));
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
      .then(() => {
        // Could add a toast notification here
        console.log('Prompt copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy prompt: ', err);
      });
  };

  const handleTestPrompt = async (variantId: string, prompt: string) => {
    if (!prompt.trim()) return;
    
    setTestingPrompt(variantId);
    setTestErrors(prev => ({...prev, [variantId]: ''}));
    
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/prompt-optimizer/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data: TestPromptResponse = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [variantId]: data.result
      }));
    } catch (error) {
      console.error('Error testing prompt:', error);
      setTestErrors(prev => ({
        ...prev,
        [variantId]: t('promptOptimizerPage.testError')
      }));
    } finally {
      setTestingPrompt(null);
    }
  };

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
      {/* Header */}
      <AgentHeader
        icon={<Settings />}
        title="Prompt Optimizer Agent"
        subtitle={t('promptOptimizerPage.labSubtitle')}
        onBack={onBack}
        tags={[{ icon: <CheckCircle />, label: t('promptOptimizerPage.variants', { count: 2 }), properties: 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200' }, { icon: <Settings />, label: t('promptOptimizerPage.labReady'), properties: 'bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm font-medium border border-cyan-200' }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Use Case Selection - Expanded */}
          <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm`}>
            <div className="p-6 border-b border-gray-200">
              <h2 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} flex items-center`}>
                <Brain className="h-5 w-5 mr-2 text-cyan-600" />
                {t('promptOptimizerPage.selectTask')}
              </h2>
              <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                {t('promptOptimizerPage.selectTaskSubtitle')}
              </p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {useCases.map((useCase) => {
                  const IconComponent = useCase.icon;
                  return (
                    <button
                      key={useCase.id}
                      onClick={() => setSelectedUseCase(useCase.id)}
                      className={`flex flex-col items-start p-4 rounded-lg border transition-all hover:shadow-md ${
                        selectedUseCase === useCase.id
                          ? `${resolvedTheme === 'dark' ? 'border-cyan-500' : 'border-cyan-500'} ${useCase.bgColor} shadow-sm`
                          : `${resolvedTheme === 'dark' ? 'border-gray-400 hover:border-gray-300' : 'border-gray-200 hover:border-gray-300'} ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <IconComponent className={`h-5 w-5 ${selectedUseCase === useCase.id ? useCase.color : 'text-gray-300'}`} />
                        <span className={`font-medium ${selectedUseCase === useCase.id ? 'text-gray-900' : 'text-gray-400'}`}>
                          {useCase.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 text-left leading-relaxed">
                        {useCase.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Original Prompt Input */}
          <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm`}>
            <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} flex items-center`}>
                <FileText className="h-5 w-5 mr-2 text-cyan-600" />
                {t('promptOptimizerPage.originalPrompt')}
              </h2>
              <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                {t('promptOptimizerPage.originalPromptSubtitle')}
              </p>
            </div>
            
            <div className={`p-6 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
              {/* Language Selector */}
              <div className="mb-4">
                <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  {t('promptOptimizerPage.outputLanguage')}
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className={`w-48 px-3 py-2 border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'} ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}
                >
                  <option value="vietnamese">Tiếng Việt</option>
                  <option value="english">English</option>
                </select>
              </div>
              
              <textarea
                value={originalPrompt}
                onChange={(e) => setOriginalPrompt(e.target.value)}
                className={`w-full h-40 px-4 py-3 border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'} ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'} placeholder-gray-500`}
                placeholder={t('promptOptimizerPage.promptInputPlaceholder')}
              />
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {originalPrompt.length} {t('promptOptimizerPage.characters')}
                  </p>
                </div>
                <button 
                  onClick={handleOptimizePrompt}
                  disabled={!originalPrompt.trim() || isOptimizing}
                  className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  {isOptimizing ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>{t('promptOptimizerPage.optimizing')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>{t('promptOptimizerPage.autoOptimize')}</span>
                    </>
                  )}
                </button>
              </div>
              
              {optimizationError && (
                <div className={`mt-3 p-3 bg-red-50 border ${resolvedTheme === 'dark' ? 'border-red-700' : 'border-red-200'} rounded-lg text-red-700 text-sm flex items-start`}>
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p>{optimizationError}</p>
                </div>
              )}
            </div>
          </div>

          {streamingText && streamingPhase === 'raw' && (
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm`}>
              <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} flex items-center`}>
                  <Loader className="h-5 w-5 mr-2 text-cyan-600 animate-spin" />
                  Streaming Response...
                </h2>
              </div>
              <div className="p-6">
                <div className={`${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4`}>
                  <div className={`${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} whitespace-pre-wrap font-mono text-sm leading-relaxed`}>
                    {streamingText}
                    <span className="inline-block w-2 h-4 ml-1 bg-cyan-500 animate-pulse"></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prompt Comparison - Full Width */}
          <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm`}>
            <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} flex items-center`}>
                <BarChart3 className="h-5 w-5 mr-2 text-cyan-600" />
                {t('promptOptimizerPage.comparisonTitle')}
              </h2>
              <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                {t('promptOptimizerPage.comparisonSubtitle')}
              </p>
            </div>
            
            <div className={`p-6 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {variants.map((variant, index) => (
                  <div key={variant.id} className={`border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-lg ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
                    <div className={`p-4 ${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{variant.title}</h3>
                        <div className="flex items-center space-x-2">
                          <button 
                            className={`p-1 ${resolvedTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} rounded`}
                            onClick={() => handleCopyPrompt(variant.prompt)}
                            title={t('promptOptimizerPage.copyPrompt')}
                          >
                            <Copy className="h-4 w-4 text-gray-500" />
                          </button>
                          <button className={`p-1 ${resolvedTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} rounded`} title={t('promptOptimizerPage.savePrompt')}>
                            <Save className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Editable Prompt */}
                      <div className={`mb-4 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
                        <textarea
                          value={variant.prompt}
                          onChange={(e) => handleUpdatePrompt(variant.id, e.target.value)}
                          className={`w-full h-48 px-3 py-2 text-sm border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'} ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'} placeholder-gray-500`}
                          placeholder={t('promptOptimizerPage.placeholder')}
                        />
                      </div>

                      {/* Actions */}
                      <div className={`flex items-center justify-end ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
                        <div className={`flex items-center space-x-2 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
                          <button 
                            onClick={() => handleTestPrompt(variant.id, variant.prompt)}
                            disabled={!variant.prompt.trim() || testingPrompt === variant.id}
                            className={`bg-cyan-100 text-cyan-800 px-3 py-1 rounded-lg text-sm font-medium hover:bg-cyan-200 transition-colors border ${resolvedTheme === 'dark' ? 'border-cyan-700' : 'border-cyan-200'} disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1`}
                          >
                            {testingPrompt === variant.id ? (
                              <>
                                <Loader className="h-3 w-3 animate-spin" />
                                <span>Testing...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="h-3 w-3" />
                                <span>{t('promptOptimizerPage.testPrompt')}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Test Results */}
                    {(testResults[variant.id] || testErrors[variant.id]) && (
                      <div className={`p-4 border-t ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <h4 className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} mb-2 flex items-center`}>
                          <Zap className="h-4 w-4 mr-1 text-cyan-600" />
                          Test Result
                        </h4>
                        
                        {testErrors[variant.id] && (
                          <div className={`p-3 bg-red-50 border ${resolvedTheme === 'dark' ? 'border-red-700' : 'border-red-200'} rounded-lg text-red-700 text-sm flex items-start mb-3`}>
                            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                            <p>{testErrors[variant.id]}</p>
                          </div>
                        )}
                        
                        {testResults[variant.id] && (
                          <div className={`p-3 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-300'} rounded-lg`}>
                            <div className="flex items-start justify-between mb-2">
                              <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wide`}>
                                Generated Response
                              </span>
                              <button 
                                className={`p-1 ${resolvedTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded`}
                                onClick={() => handleCopyPrompt(testResults[variant.id])}
                                title="Copy result"
                              >
                                <Copy className="h-3 w-3 text-gray-500" />
                              </button>
                            </div>
                            <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'} whitespace-pre-wrap`}>
                              {testResults[variant.id]}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptOptimizerPage;