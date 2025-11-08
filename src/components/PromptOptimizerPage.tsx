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
import { promptOptimizerApi, PromptType } from '../services/promptOptimizerApi';

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
  const isDark = resolvedTheme === 'dark';
  const [selectedUseCase, setSelectedUseCase] = useState('text');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('vietnamese');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);

  const [testingPrompt, setTestingPrompt] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [testErrors, setTestErrors] = useState<Record<string, string>>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const [variants, setVariants] = useState<PromptVariant[]>([
    {
      id: '1',
      title: 'Version 1',
      prompt: '',
      rating: 0
    },
    {
      id: '2',
      title: 'Version 2',
      prompt: '',
      rating: 0
    }
  ]);

  useEffect(() => {
    setVariants(prev => prev.map(v => ({
      ...v,
      title: v.id === '1' ? 'Version 1' : 'Version 2'
    })));
  }, [language]);

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
      apiType: PromptType.text_generation
    },
    {
      id: 'image',
      name: t('promptOptimizerPage.useCases.image'),
      icon: Image,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: t('promptOptimizerPage.useCases.imageDescription'),
      apiType: PromptType.image_generation
    },
    {
      id: 'code',
      name: t('promptOptimizerPage.useCases.code'),
      icon: Code,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: t('promptOptimizerPage.useCases.codeDescription'),
      apiType: PromptType.programming
    },
    {
      id: 'analysis',
      name: t('promptOptimizerPage.useCases.analysis'),
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: t('promptOptimizerPage.useCases.analysisDescription'),
      apiType: PromptType.data_analysis
    },
    {
      id: 'conversation',
      name: t('promptOptimizerPage.useCases.conversation'),
      icon: MessageSquare,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      description: t('promptOptimizerPage.useCases.conversationDescription'),
      apiType: PromptType.dialogue
    },
    {
      id: 'creative',
      name: t('promptOptimizerPage.useCases.creative'),
      icon: Palette,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: t('promptOptimizerPage.useCases.creativeDescription'),
      apiType: PromptType.creative
    },
    {
      id: 'translation',
      name: t('promptOptimizerPage.useCases.translation'),
      icon: Globe,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      description: t('promptOptimizerPage.useCases.translationDescription'),
      apiType: PromptType.translation
    },
    {
      id: 'education',
      name: t('promptOptimizerPage.useCases.education'),
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: t('promptOptimizerPage.useCases.educationDescription'),
      apiType: PromptType.education
    },
    {
      id: 'video',
      name: t('promptOptimizerPage.useCases.video'),
      icon: Video,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: t('promptOptimizerPage.useCases.videoDescription'),
      apiType: PromptType.video_audio
    },
    {
      id: 'research',
      name: t('promptOptimizerPage.useCases.research'),
      icon: Database,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      description: t('promptOptimizerPage.useCases.researchDescription'),
      apiType: PromptType.research
    },
    {
      id: 'technical',
      name: t('promptOptimizerPage.useCases.technical'),
      icon: Cpu,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: t('promptOptimizerPage.useCases.technicalDescription'),
      apiType: PromptType.technical
    },
    {
      id: 'mobile',
      name: t('promptOptimizerPage.useCases.mobile'),
      icon: Smartphone,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      description: t('promptOptimizerPage.useCases.mobileDescription'),
      apiType: PromptType.mobile_app
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
    setVariants([
      {
        id: '1',
        title: 'Version 1',
        prompt: '',
        rating: 0
      },
      {
        id: '2',
        title: 'Version 2',
        prompt: '',
        rating: 0
      }
    ]);

    try {
      const selectedUseCaseType = useCases.find(uc => uc.id === selectedUseCase)?.apiType || PromptType.text_generation;

      const response = await promptOptimizerApi.optimizePrompt({
        user_request: originalPrompt,
        language: selectedLanguage,
        prompt_type: selectedUseCaseType
      });

      setVariants([
        {
          id: '1',
          title: 'Version 1',
          prompt: response.optimised_prompt_1 || '',
          rating: 0
        },
        {
          id: '2',
          title: 'Version 2',
          prompt: response.optimised_prompt_2 || '',
          rating: 0
        }
      ]);

      await trackToolUsage('prompt_optimizer', selectedUseCase, {
        user_request: originalPrompt,
        language: selectedLanguage,
        prompt_type: selectedUseCaseType
      });
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
    <div className={`min-h-screen ${isDark ? 'bg-[#001F3F]' : 'bg-[#E6F0FF]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className={`mb-6 flex items-center gap-2 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-all duration-300 ease-out-smooth`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Marketplace</span>
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-1 rounded-xl bg-white">
              <img
                src="/assets/icon3.png"
                alt="Prompt Optimizer Agent"
                className="w-16 h-16 object-cover rounded-lg"
              />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-[#001F3F]'}`}>
                Prompt Optimizer Agent
              </h1>
              <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('promptOptimizerPage.labSubtitle')}
              </p>
            </div>
          </div>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-4xl`}>
            Enhance your prompts with AI-powered optimization. Transform basic prompts into detailed, effective instructions that deliver better results across all AI models and use cases.
          </p>
        </div>

        <div className="space-y-6">
          <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
            <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
              <Brain className="h-5 w-5 mr-2 text-[#0B63CE]" />
              {t('promptOptimizerPage.selectTask')}
            </label>
            <select
              value={selectedUseCase}
              onChange={(e) => setSelectedUseCase(e.target.value)}
              className={`w-full rounded-lg px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-[#0B63CE]/50 transition-all duration-200 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-gray-200'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              {useCases.map((useCase) => (
                <option key={useCase.id} value={useCase.id}>
                  {useCase.name} — {useCase.description}
                </option>
              ))}
            </select>
          </div>

          <div className={`rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
            <div className={`p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
                <FileText className="h-5 w-5 mr-2 text-[#0B63CE]" />
                {t('promptOptimizerPage.originalPrompt')}
              </h2>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  {t('promptOptimizerPage.outputLanguage')}
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className={`w-48 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B63CE]/50 transition-all duration-200 ${isDark ? 'border-white/10 bg-white/5 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                >
                  <option value="vietnamese">Tiếng Việt</option>
                  <option value="english">English</option>
                </select>
              </div>

              <textarea
                value={originalPrompt}
                onChange={(e) => setOriginalPrompt(e.target.value)}
                className={`w-full h-40 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B63CE]/50 resize-none placeholder-gray-500 transition-all duration-200 ${isDark ? 'border-white/10 bg-white/5 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                placeholder={t('promptOptimizerPage.promptInputPlaceholder')}
              />
              <div className="mt-4 flex items-center justify-between">
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {originalPrompt.length} {t('promptOptimizerPage.characters')}
                </p>
                <button
                  onClick={handleOptimizePrompt}
                  disabled={!originalPrompt.trim() || isOptimizing}
                  className="bg-gradient-to-r from-[#0B63CE] to-[#3399FF] hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 ease-out-smooth flex items-center space-x-2"
                >
                  {isOptimizing ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      <span>{t('promptOptimizerPage.optimizing')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>{t('promptOptimizerPage.autoOptimize')}</span>
                    </>
                  )}
                </button>
              </div>

              {optimizationError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p>{optimizationError}</p>
                </div>
              )}
            </div>
          </div>

          <div className={`rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
            <div className={`p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
                <BarChart3 className="h-5 w-5 mr-2 text-[#0B63CE]" />
                {t('promptOptimizerPage.comparisonTitle')}
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {variants.map((variant) => (
                  <div key={variant.id} className={`border rounded-xl transition-all duration-300 ease-out-smooth hover:shadow-lg ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
                    <div className={`p-4 border-b ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{variant.title}</h3>
                        <div className="flex items-center space-x-2">
                          <button
                            className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
                            onClick={() => handleCopyPrompt(variant.prompt)}
                            title={t('promptOptimizerPage.copyPrompt')}
                          >
                            <Copy className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
                            title={t('promptOptimizerPage.savePrompt')}
                          >
                            <Save className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={variant.prompt}
                        onChange={(e) => handleUpdatePrompt(variant.id, e.target.value)}
                        className={`w-full h-48 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B63CE]/50 resize-none placeholder-gray-500 transition-all duration-200 ${isDark ? 'border-white/10 bg-white/5 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                        placeholder={t('promptOptimizerPage.placeholder')}
                      />

                      <div className="flex items-center justify-end mt-4">
                        <button
                          onClick={() => handleTestPrompt(variant.id, variant.prompt)}
                          disabled={!variant.prompt.trim() || testingPrompt === variant.id}
                          className="bg-gradient-to-r from-[#0B63CE] to-[#3399FF] text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ease-out-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {testingPrompt === variant.id ? (
                            <>
                              <Loader className="h-4 w-4 animate-spin" />
                              <span>Testing...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4" />
                              <span>{t('promptOptimizerPage.testPrompt')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Test Results Section */}
              {(Object.keys(testResults).length > 0 || Object.keys(testErrors).length > 0) && (
                <div className={`mt-6 p-6 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                    <Sparkles className="h-5 w-5 mr-2 text-[#0B63CE]" />
                    Test Results
                  </h3>

                  <div className="space-y-4">
                    {variants.map((variant) => (
                      (testResults[variant.id] || testErrors[variant.id]) && (
                        <div key={variant.id} className={`p-4 rounded-lg ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                              {variant.title}
                            </h4>
                            {testResults[variant.id] && (
                              <button
                                className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                                onClick={() => handleCopyPrompt(testResults[variant.id])}
                                title="Copy result"
                              >
                                <Copy className="h-4 w-4 text-gray-500" />
                              </button>
                            )}
                          </div>

                          {testErrors[variant.id] && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start">
                              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                              <p>{testErrors[variant.id]}</p>
                            </div>
                          )}

                          {testResults[variant.id] && (
                            <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0B63CE]/5 border border-[#0B63CE]/20' : 'bg-blue-50 border border-blue-200'}`}>
                              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-800'} whitespace-pre-wrap leading-relaxed`}>
                                {testResults[variant.id]}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptOptimizerPage;
