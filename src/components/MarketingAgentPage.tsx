import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import {
  Megaphone,
  Send,
  Upload,
  Copy,
  Save,
  Download,
  Sparkles,
  Target,
  Palette,
  Globe,
  FileText,
  Image,
  Mail,
  Search,
  TrendingUp,
  Users,
  Heart,
  Share2,
  Eye,
  ArrowLeft,
  Lightbulb,
  Zap,
  Star,
  Clock,
  CheckCircle,
  RefreshCw,
  Settings,
  BarChart3,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { GeneratedContent } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import AgentConfigPanel from './ui/AgentConfigPanel';
import AgentHeader from './ui/AgentHeader';
import AgentMainContent from './ui/AgentMainContent';
import { trackToolUsage } from './tracking/tracker';

const MarketingAgentPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { resolvedTheme } = useTheme();
  const { t, language: uiLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('ads');
  const labels = (t('marketingAgentPage.config.labels') as any) || {};
  const opt = (t('marketingAgentPage.config.options') as any) || {};
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Streaming states
  const [streamingText, setStreamingText] = useState('');
  const [streamingPhase, setStreamingPhase] = useState<'raw' | 'complete'>('raw');

  // Form states
  const [objective, setObjective] = useState('awareness');
  const [tone, setTone] = useState('friendly');
  const [platform, setPlatform] = useState('facebook');
  const [language, setLanguage] = useState(uiLanguage === 'vi' ? 'vietnamese' : 'english');

  const contentTypes = [
    { id: 'ads', name: t('marketingAgentPage.contentTypes.ads'), icon: Target, color: 'text-red-400', bgColor: 'bg-red-900/30' },
    { id: 'social', name: t('marketingAgentPage.contentTypes.social'), icon: Share2, color: 'text-blue-400', bgColor: 'bg-blue-900/30' },
    { id: 'email', name: t('marketingAgentPage.contentTypes.email'), icon: Mail, color: 'text-green-400', bgColor: 'bg-green-900/30' },
    { id: 'seo', name: t('marketingAgentPage.contentTypes.seo'), icon: Search, color: 'text-purple-400', bgColor: 'bg-purple-900/30' }
  ];

  const objectives = [
    { id: 'awareness', name: t('marketingAgentPage.objectives.awareness') },
    { id: 'conversion', name: t('marketingAgentPage.objectives.conversion') },
    { id: 'product', name: t('marketingAgentPage.objectives.product') },
    { id: 'engagement', name: t('marketingAgentPage.objectives.engagement') }
  ];

  const tones = [
    { id: 'friendly', name: t('marketingAgentPage.tones.friendly') },
    { id: 'professional', name: t('marketingAgentPage.tones.professional') },
    { id: 'humorous', name: t('marketingAgentPage.tones.humorous') },
    { id: 'creative', name: t('marketingAgentPage.tones.creative') },
    { id: 'urgent', name: t('marketingAgentPage.tones.urgent') }
  ];

  const platforms = [
    { id: 'facebook', name: t('marketingAgentPage.platforms.facebook') },
    { id: 'instagram', name: t('marketingAgentPage.platforms.instagram') },
    { id: 'tiktok', name: t('marketingAgentPage.platforms.tiktok') },
    { id: 'linkedin', name: t('marketingAgentPage.platforms.linkedin') },
    { id: 'website', name: t('marketingAgentPage.platforms.website') },
    { id: 'youtube', name: t('marketingAgentPage.platforms.youtube') }
  ];

  const promptSuggestions = [
    t('marketingAgentPage.promptSuggestions.s1'),
    t('marketingAgentPage.promptSuggestions.s2'),
    t('marketingAgentPage.promptSuggestions.s3'),
    t('marketingAgentPage.promptSuggestions.s4'),
    t('marketingAgentPage.promptSuggestions.s5'),
    t('marketingAgentPage.promptSuggestions.s6')
  ];

  // Fetch available models when component mounts
  useEffect(() => {
    fetchAvailableModels();
  }, []);

  const mapLanguage = (lng: string) => lng === 'english' ? 'english' : 'vietnamese';

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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedContent([]);
    setStreamingText('');
    setStreamingPhase('raw');

    const sessionId = `marketing_${Date.now()}`;
    const mappedLanguage = mapLanguage(language);

    // Map activeTab to tool_type
    const toolTypeMap: Record<string, string> = {
      'social': 'social_media',
      'email': 'email_marketing',
      'ads': 'advertisement',
      'seo': 'seo_content'
    };
    const subToolType = toolTypeMap[activeTab] || 'advertisement';

    const requestBody = {
      tool_type: 'marketing',
      session_id: sessionId,
      message: prompt,
      language: mappedLanguage,
      model: 'auto',
      metadata: {
        sub_tool_type: subToolType,
        style: tone,
        goal: objective,
        platform: platform
      }
    };

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/streaming/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

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

                // Format response similar to marketingAPI.formatMarketingResponse
                const newContent: GeneratedContent[] = [
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
                    title: 'Creative Version',
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
                setGeneratedContent(newContent);
              } else if (event.type === 'complete') {
                console.log('Streaming completed successfully');
              } else if (event.type === 'error') {
                throw new Error(event.content || 'Unknown streaming error');
              }
            } catch (parseError) {
              console.error('Failed to parse SSE event:', parseError, jsonStr);
            }
          }
        }
      }

      await trackToolUsage('marketing_agent', activeTab, requestBody);
    } catch (error: any) {
      console.error('API Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while generating content');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSampleContent = (type: string, style: string) => {
    const key = `marketingAgentPage.samples.${type}.${style}`;
    return t(key) || `Sample content for ${type} - ${style}`;
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
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-[#001F3F]' : 'bg-[#E6F0FF]'}`}>
      {/* Header */}

      <AgentHeader
        icon={<Megaphone />}
        title={t('marketingAgentPage.title')}
        subtitle={t('marketingAgentPage.subtitle')}
        tags={[{ icon: <CheckCircle />, label: t('marketingAgentPage.aiReady'), properties: 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200' }, { icon: <Megaphone />, label: t('marketingAgentPage.marketingMode'), properties: 'bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium border border-pink-200' }]}
        onBack={onBack}
      />

      <AgentMainContent
        toolsTitle={t('marketingAgentPage.toolsTitle')}
        tools={contentTypes}
        activeTab={activeTab}
        toolOnClick={setActiveTab}
        configPanel={
          <AgentConfigPanel
            isGenerating={isGenerating}
            selectFields={[
              { id: 'objective', label: labels.objective || 'Objective', value: objective, onChange: setObjective, options: [
                { label: opt?.objective?.awareness || 'Awareness', value: 'awareness' },
                { label: opt?.objective?.conversion || 'Conversion', value: 'conversion' },
                { label: opt?.objective?.product || 'Product', value: 'product' },
                { label: opt?.objective?.engagement || 'Engagement', value: 'engagement' },
              ]},
              { id: 'tone', label: labels.tone || 'Tone', value: tone, onChange: setTone, options: [
                { label: opt?.tone?.friendly || 'Friendly', value: 'friendly' },
                { label: opt?.tone?.professional || 'Professional', value: 'professional' },
                { label: opt?.tone?.humorous || 'Humorous', value: 'humorous' },
                { label: opt?.tone?.creative || 'Creative', value: 'creative' },
                { label: opt?.tone?.urgent || 'Urgent', value: 'urgent' },
              ]},
              { id: 'platform', label: labels.platform || 'Platform', value: platform, onChange: setPlatform, options: [
                { label: opt?.platform?.facebook || 'Facebook', value: 'facebook' },
                { label: opt?.platform?.instagram || 'Instagram', value: 'instagram' },
                { label: opt?.platform?.tiktok || 'TikTok', value: 'tiktok' },
                { label: opt?.platform?.linkedin || 'LinkedIn', value: 'linkedin' },
                { label: opt?.platform?.website || 'Website', value: 'website' },
                { label: opt?.platform?.youtube || 'YouTube', value: 'youtube' },
              ]},
              { id: 'lang', label: labels.language || 'Language', value: language, onChange: setLanguage, options: [
                { label: uiLanguage === 'vi' ? 'Tiếng Anh' : 'English', value: 'english' },
                { label: uiLanguage === 'vi' ? 'Tiếng Việt' : 'Vietnamese', value: 'vietnamese' },
              ]},
            ]}
            textarea={{ label: labels.task || 'Describe the marketing task', value: prompt, onChange: setPrompt, placeholder: 'e.g., Create a ad for a new product' }}
            suggestions={promptSuggestions}
            onSuggestionClick={(s) => setPrompt(s)}
            onGenerate={handleGenerate}
            generateButtonLabel={isGenerating ? 'Generating...' : 'Generate'}
            accentButtonClass={'bg-blue-600 hover:bg-blue-700'}
          />}


        uploadZone={null}
        resultZone={
          <>
          {/* Streaming Raw Text Display */}
          {streamingPhase === 'raw' && streamingText && (
            <div className={`p-4 rounded-lg ${
              resolvedTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
            } border ${
              resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className={`font-mono text-sm whitespace-pre-wrap ${
                resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {streamingText}
                <span className="inline-block w-2 h-4 ml-1 bg-pink-500 animate-pulse"></span>
              </div>
            </div>
          )}

          {isGenerating && !streamingText && (
            <div className={`flex flex-col items-center justify-center p-10 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} rounded-2xl shadow-sm border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} text-center`}>
              <div className="relative">
                <div className={`w-16 h-16 border-4 border-dashed rounded-full animate-spin ${resolvedTheme === 'dark' ? 'border-pink-600' : 'border-pink-600'}`}></div>
                <div className={`absolute inset-0 flex items-center justify-center ${resolvedTheme === 'dark' ? 'text-pink-600' : 'text-pink-600'}`}>
                  <Sparkles className="h-8 w-8 text-pink-600" />
                </div>
              </div>
              <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-800' : 'text-gray-800'} mt-4`}>{t('marketingAgentPage.generatingTitle')}</h3>
              <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('marketingAgentPage.generatingSubtitle')}</p>
            </div>
          )}

          {error && (
            <div className={`bg-red-50 border ${resolvedTheme === 'dark' ? 'border-red-200' : 'border-red-200'} rounded-2xl p-6`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${resolvedTheme === 'dark' ? 'bg-red-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
                    <X className={`h-5 w-5 ${resolvedTheme === 'dark' ? 'text-red-600' : 'text-red-600'}`} />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-red-800' : 'text-red-800'}`}>{t('marketingAgentPage.errorTitle')}</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setError(null)}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${resolvedTheme === 'dark' ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500' : 'text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'}`}
                >
                  {t('marketingAgentPage.retryButton')}
                </button>
              </div>
            </div>
          )}

          {streamingPhase === 'complete' && generatedContent.length > 0 && (
            <div className={`space-y-6 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
              {generatedContent.map((item) => (
                <div key={item.id} className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} rounded-2xl shadow-sm border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`text-lg font-bold ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{item.title}</h3>
                        <p className="text-sm text-gray-500">{t('marketingAgentPage.generatedAt')} {item.timestamp}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleCopy(item.content)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800 transition-colors" title="Copy">
                          <Copy className="h-5 w-5" />
                        </button>
                        <button className={`p-2 hover:bg-gray-100 rounded-lg ${resolvedTheme === 'dark' ? 'text-gray-500 hover:text-gray-800' : 'text-gray-500 hover:text-gray-800'} transition-colors`} title="Save">
                          <Save className="h-5 w-5" />
                        </button>
                        <button className={`p-2 hover:bg-gray-100 rounded-lg ${resolvedTheme === 'dark' ? 'text-gray-500 hover:text-gray-800' : 'text-gray-500 hover:text-gray-800'} transition-colors`} title="Download">
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className={`mt-4 prose prose-sm max-w-none ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} whitespace-pre-wrap`}>{item.content}</div>
                  </div>
                  <div className={`${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} px-5 py-3 flex justify-between items-center border-t ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star} 
                          onClick={() => handleRating(item.id, star)}
                          className={`p-1 rounded-full transition-colors ${item.rating >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                          title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          <Star className="h-5 w-5" fill="currentColor" />
                        </button>
                      ))}
                    </div>
                    <button className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-pink-600 hover:text-pink-800' : 'text-pink-600 hover:text-pink-800'} flex items-center`}>
                      <Zap className="h-4 w-4 mr-1.5" />
                      {t('marketingAgentPage.improveButton')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isGenerating && !streamingText && generatedContent.length === 0 && (
            <div className={`text-center p-10 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} rounded-2xl shadow-sm border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="inline-block bg-gray-100 p-4 rounded-full">
                <Lightbulb className="h-10 w-10 text-gray-500" />
              </div>
              <h3 className={`mt-4 text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-800' : 'text-gray-800'}`}>{t('marketingAgentPage.outputPlaceholderTitle')}</h3>
              <p className="mt-1 text-gray-600">
                {t('marketingAgentPage.outputPlaceholderSubtitle')}
              </p>
            </div>
          )}
          </>
        }
        sidebar={null}
      />
    </div>
  );
};

export default MarketingAgentPage;
