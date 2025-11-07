import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { 
  Palette, 
  Image, 
  Lightbulb, 
  FileText,
  CheckCircle,
  Copy,
  Star,
  Sparkles,
  Edit,
  Upload,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AgentConfigPanel from './ui/AgentConfigPanel';
import { useTheme } from '../contexts/ThemeContext';
import AgentMainContent from './ui/AgentMainContent';
import AgentHeader from './ui/AgentHeader';
import { trackToolUsage } from './tracking/tracker';

interface DesignResponse {
  main_draft: string;
  creative_version: string;
  simple_version: string;
}

interface ImageResponse {
  optimized_prompt: string;
  image_base64: string;
}

interface ImageEditResponse {
  image_edit_prompt: string;
  negative_prompt: string;
}

interface GeneratedContent {
  id: string;
  title: string;
  content: string;
  type: string;
  timestamp: string;
  rating: number;
}

const DesignAgentPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('geminiImage');
  const { t, language: uiLanguage } = useLanguage();
  const labels = (t('designAgentPage.config.labels') as any) || {};
  const opt = (t('designAgentPage.config.options') as any) || {};
  const [isGenerating, setIsGenerating] = useState(false);
  const [style, setStyle] = useState('modern');
  const [colorMood, setColorMood] = useState('vibrant');
  const [language, setLanguage] = useState<'en' | 'vi'>(uiLanguage);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [streamingPhase, setStreamingPhase] = useState<'raw' | 'complete'>('raw');
  const [imageResponse, setImageResponse] = useState<ImageResponse | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const languageOptions = uiLanguage === 'vi'
    ? [
        { label: 'Tiếng Anh', value: 'en' },
        { label: 'Tiếng Việt', value: 'vi' },
      ]
    : [
        { label: 'English', value: 'en' },
        { label: 'Vietnamese', value: 'vi' },
      ];
  const languageLabel = (languageOptions.find(o => o.value === language)?.label) || (language === 'en' ? 'English' : 'Vietnamese');
  const [idea, setIdea] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [detail, setDetail] = useState('auto');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const styleLabel = (opt?.style as any)?.[style] || style;
  const moodLabel = (opt?.mood as any)?.[colorMood] || colorMood;
  const { resolvedTheme } = useTheme();

  const suggestions = [
    'Landing page for fintech startup in dark theme',
    'Mobile onboarding flow with illustrations',
    'Brand palette for eco-friendly product',
    'Empty state illustrations for dashboard'
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

  const tools = [
    { id: 'geminiImage', name: t('designAgentPage.tools.geminiImage'), icon: Image, color: 'text-orange-600' },
    { id: 'color', name: t('designAgentPage.tools.color'), icon: Palette, color: 'text-pink-600' },
    { id: 'ideas', name: t('designAgentPage.tools.ideas'), icon: Lightbulb, color: 'text-yellow-600' },
    { id: 'brand', name: t('designAgentPage.tools.brand'), icon: FileText, color: 'text-purple-600' },
    { id: 'imageEdit', name: t('designAgentPage.tools.imageEdit'), icon: Edit, color: 'text-blue-600' }
  ];

  const getEndpoint = (toolId: string) => {
    switch (toolId) {
      case 'geminiImage':
        return '/design/gemini-image';
      case 'color':
        return '/design/color-palette';
      case 'ideas':
        return '/design/ai-image-ideas';
      case 'brand':
        return '/design/brand-guidelines';
      case 'imageEdit':
        return '/design/optimize-image-edit-prompt';
      default:
        return '/design/gemini-image';
    }
  };

  const handleGenerate = async () => {
    if (!idea.trim()) {
      setError('Please provide a description of your request.');
      return;
    }
    if (activeTab === 'imageEdit') {
      if (!uploadedImage) {
        setError('Please upload an image for editing.');
        return;
      }
      if (!detail.trim()) {
        setError('Please select detail level.');
        return;
      }
    }
    setIsGenerating(true);
    setError(null);
    setGeneratedContent([]);
    setImageResponse(null);
    setStreamingText('');
    setStreamingPhase('raw');

    const languageMap: Record<'en' | 'vi', string> = { en: 'english', vi: 'vietnamese' };
    const toolTypeMap: Record<string, string> = {
      geminiImage: 'generate_or_edit_image',
      color: 'suggest_color_palette',
      ideas: 'generate_ai_image_ideas',
      brand: 'create_brand_guidelines',
      imageEdit: 'optimize_image_edit_prompt'
    };

    try {
      const sessionId = `design_${Date.now()}`;
      const subToolType = toolTypeMap[activeTab];

      const requestBody = {
        tool_type: 'design',
        session_id: sessionId,
        message: idea,
        language: languageMap[language],
        model: 'auto',
        metadata: {
          sub_tool_type: subToolType,
          style: style,
          color_mood: colorMood,
          ...(activeTab === 'geminiImage' && imageInput && imageInput.trim() !== '' ? { image_input: imageInput } : {}),
          ...(activeTab === 'geminiImage' ? { detail: detail } : {}),
          ...(activeTab === 'imageEdit' && imageInput ? { image_input: imageInput } : {}),
          ...(activeTab === 'imageEdit' ? { detail: detail } : {})
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('[DEBUG] Response received:', response.headers.get('content-type'));

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      console.log('[DEBUG] Reader created, starting to read stream...');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[DEBUG] Stream done');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        console.log('[DEBUG] Received lines:', lines.length);

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);

            try {
              const event = JSON.parse(jsonStr);
              console.log('[DEBUG] Event received:', event.type, event);

              if (event.type === 'assistant_chunk') {
                const content = event.content || '';
                console.log('[DEBUG] Chunk content:', content);
                // Force immediate update with flushSync to prevent batching
                flushSync(() => {
                  setStreamingText(prev => prev + content);
                });
              } else if (event.type === 'structured_result') {
                setStreamingPhase('complete');
                const fields = event.fields;

                if (activeTab === 'geminiImage') {
                  setImageResponse({
                    optimized_prompt: fields.optimized_prompt || '',
                    image_base64: fields.image_base64 || ''
                  });
                } else {
                  const newContent: GeneratedContent[] = activeTab === 'imageEdit'
                    ? [
                        {
                          id: '1',
                          title: 'Image Edit Prompt',
                          content: fields.image_edit_prompt || '',
                          type: activeTab,
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          rating: 0
                        },
                        {
                          id: '2',
                          title: 'Negative Prompt',
                          content: fields.negative_prompt || '',
                          type: activeTab,
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          rating: 0
                        }
                      ]
                    : [
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
                }
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

      await trackToolUsage('design_agent', activeTab, requestBody);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderImageResponse = (data: any) => {
    if (activeTab === 'geminiImage' && data) {
      return (
        <div className="space-y-4">
          {/* Optimized Prompt */}
          {data.optimized_prompt && (
            <div className={`p-4 rounded-lg border ${
              resolvedTheme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}>
              <h3 className="font-medium mb-2 text-sm text-gray-600">
                Optimized Prompt
              </h3>
              <p className={`text-sm ${
                resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {data.optimized_prompt}
              </p>
            </div>
          )}

          {/* Generated Image */}
          {data.image_base64 && (
            <div className={`p-4 rounded-lg border ${
              resolvedTheme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}>
              <h3 className="font-medium mb-3 text-sm text-gray-600">
                Generated Image
              </h3>
              <div className="flex justify-center">
                <img
                  src={data.image_base64}
                  alt="Generated by Gemini"
                  className="max-w-full h-auto rounded-lg shadow-md"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleRating = (contentId: string, rating: number) => {
    setGeneratedContent(prev => 
      prev.map(content => 
        content.id === contentId ? { ...content, rating } : content
      )
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedImage(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      setImagePreview(base64Data);
      
      // Set base64 data for API call
      setImageInput(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setImageInput('');
  };

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-[#0B172A]' : 'bg-gray-50'}`}>
      {/* Header */}
      <AgentHeader
        icon={<Palette />}
        title={t('designAgentPage.title')}
        subtitle={t('designAgentPage.subtitle')}
        tags={[{ icon: <CheckCircle />, label: t('designAgentPage.aiReady'), properties: 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200' }, { icon: <Palette />, label: t('designAgentPage.designMode'), properties: 'bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium border border-orange-200' }]}
        onBack={onBack}
      />

      <AgentMainContent
        toolsTitle={t('designAgentPage.selectTool')}
        tools={tools}
        activeTab={activeTab}
        toolOnClick={(tab) => {
          setActiveTab(tab);
          setError(null);
          setGeneratedContent([]);
          if (tab === 'imageEdit') {
            // Set appropriate defaults for image edit
            setStyle('modern');
            setColorMood('vibrant');
          } else {
            setImageInput('');
            setDetail('auto');
            setUploadedImage(null);
            setImagePreview(null);
          }
        }}
        configPanel={
        <AgentConfigPanel
          isGenerating={isGenerating}
          layout={activeTab === 'imageEdit' || activeTab === 'geminiImage' ? 'grid' : 'split'}
          rightNode={activeTab !== 'imageEdit' && activeTab !== 'geminiImage' ? (
            <div>
              <h4 className="text-sm font-semibold mb-2">{labels.previewTitle || 'Preview brief'}</h4>
              <div className="text-xs space-y-1">
                <p>• {labels.style || 'Style'}: {styleLabel}</p>
                <p>• {labels.colorMood || 'Color mood'}: {moodLabel}</p>
                <p>• Language: {languageLabel}</p>
              </div>
            </div>
          ) : undefined}
          selectFields={activeTab === 'imageEdit' ? [
            { id: 'style', label: labels.style || 'Style', value: style, onChange: setStyle, options: [
              { label: opt?.style?.modern || 'Modern', value: 'modern' },
              { label: opt?.style?.minimal || 'Minimal', value: 'minimal' },
              { label: opt?.style?.playful || 'Playful', value: 'playful' },
              { label: opt?.style?.corporate || 'Corporate', value: 'corporate' },
              { label: 'Original', value: 'original' },
            ]},
            { id: 'mood', label: labels.colorMood || 'Color mood', value: colorMood, onChange: setColorMood, options: [
              { label: opt?.mood?.vibrant || 'Vibrant', value: 'vibrant' },
              { label: opt?.mood?.pastel || 'Pastel', value: 'pastel' },
              { label: opt?.mood?.dark || 'Dark', value: 'dark' },
              { label: opt?.mood?.light || 'Light', value: 'light' },
              { label: 'Original', value: 'original' },
            ]},
            { id: 'lang', label: labels.language || 'Language', value: language, onChange: (v) => setLanguage(v as 'en' | 'vi'), options: languageOptions },
          ] : activeTab === 'geminiImage' ? [
            { id: 'lang', label: labels.language || 'Language', value: language, onChange: (v) => setLanguage(v as 'en' | 'vi'), options: languageOptions },
          ] : [
            { id: 'style', label: labels.style || 'Style', value: style, onChange: setStyle, options: [
              { label: opt?.style?.modern || 'Modern', value: 'modern' },
              { label: opt?.style?.minimal || 'Minimal', value: 'minimal' },
              { label: opt?.style?.playful || 'Playful', value: 'playful' },
              { label: opt?.style?.corporate || 'Corporate', value: 'corporate' },
            ]},
            { id: 'mood', label: labels.colorMood || 'Color mood', value: colorMood, onChange: setColorMood, options: [
              { label: opt?.mood?.vibrant || 'Vibrant', value: 'vibrant' },
              { label: opt?.mood?.pastel || 'Pastel', value: 'pastel' },
              { label: opt?.mood?.dark || 'Dark', value: 'dark' },
              { label: opt?.mood?.light || 'Light', value: 'light' },
            ]},
            { id: 'lang', label: labels.language || 'Language', value: language, onChange: (v) => setLanguage(v as 'en' | 'vi'), options: languageOptions },
          ]}
          textarea={activeTab !== 'imageEdit' && activeTab !== 'geminiImage' ? { label: labels.idea || 'Describe your idea', value: idea, onChange: setIdea, placeholder: 'e.g., A hero section with bold typography and product mockup' } : undefined}
          suggestions={activeTab !== 'imageEdit' && activeTab !== 'geminiImage' ? suggestions : []}
          onSuggestionClick={(s) => setIdea(s)}
          onGenerate={activeTab !== 'imageEdit' && activeTab !== 'geminiImage' ? handleGenerate : () => {}}
          generateButtonLabel={isGenerating ? 'Generating...' : 'Generate'}
          accentButtonClass={'bg-violet-600 hover:bg-violet-700'}
        />}
        uploadZone={activeTab === 'imageEdit' || activeTab === 'geminiImage' ? (
          <div className={`mt-6 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-6`}>
            <h4 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} mb-6 flex items-center`}>
              <Edit className="h-5 w-5 mr-2 text-violet-600" />
              Image Edit Configuration
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Image Upload */}
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'} mb-3`}>
                    Upload Image
                  </label>
                  
                  {!imagePreview ? (
                    <div className={`border-2 border-dashed ${resolvedTheme === 'dark' ? 'border-violet-600/50 hover:border-violet-500' : 'border-violet-300 hover:border-violet-400'} bg-gradient-to-br ${resolvedTheme === 'dark' ? 'from-violet-900/20 to-purple-900/20' : 'from-violet-50 to-purple-50'} rounded-xl p-8 text-center cursor-pointer transition-all hover:scale-[1.02]`}
                         onClick={() => document.getElementById('imageUpload')?.click()}>
                      <Upload className={`mx-auto h-16 w-16 ${resolvedTheme === 'dark' ? 'text-violet-400' : 'text-violet-500'} mb-3`} />

                      {activeTab === 'geminiImage' && (
                        <p className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>(Optional) Click to upload image for additional context</p>
                      )}
                      {activeTab !== 'geminiImage' && (
                        <p className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Click to upload image</p>
                      )}
                      <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>PNG, JPG, GIF up to 10MB</p>
                      <input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className={`relative border-2 ${resolvedTheme === 'dark' ? 'border-violet-600/50' : 'border-violet-300'} rounded-xl p-4 bg-gradient-to-br ${resolvedTheme === 'dark' ? 'from-violet-900/20 to-purple-900/20' : 'from-violet-50 to-purple-50'}`}>
                      <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-3 shadow-md" />
                      <button
                        onClick={removeImage}
                        className={`absolute top-2 right-2 p-2 ${resolvedTheme === 'dark' ? 'bg-gray-800/90 hover:bg-gray-700' : 'bg-white/90 hover:bg-gray-100'} rounded-full border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-300'} shadow-lg transition-all hover:scale-110`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className={`${resolvedTheme === 'dark' ? 'bg-gray-800/50' : 'bg-white/50'} rounded-lg p-2 backdrop-blur-sm`}>
                        <p className={`text-xs font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {uploadedImage?.name}
                        </p>
                        <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {uploadedImage ? (uploadedImage.size / 1024 / 1024).toFixed(2) : '0'} MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Configuration Fields */}
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'} mb-2`}>
                    {labels.editingRequest || 'Editing Request'}
                  </label>
                  <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    rows={3}
                    placeholder={activeTab === 'geminiImage' ? labels.placeholder || "Describe what you want to generate or edit the image with..." : labels.editPlaceHolder || "Describe what changes you want to make to the image..."}
                    className={`w-full border ${resolvedTheme === 'dark' ? 'text-gray-200 border-gray-600 focus:border-violet-500' : 'text-gray-700 border-gray-300 focus:border-violet-400'} resize-none rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-white'} transition-colors`}
                  />
                </div>

                {/* Current image description removed per UX request */}

                {/* Style and Color Mood moved to top config to avoid duplication */}
                
                {activeTab !== 'geminiImage' && (
                <div>
                  <label className={`block text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'} mb-2`}>
                    {labels.detail || 'Detail Level'}
                  </label>
                  <select
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    className={`w-full border ${resolvedTheme === 'dark' ? 'text-gray-200 border-gray-600 focus:border-violet-500' : 'text-gray-700 border-gray-300 focus:border-violet-400'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-white'} transition-colors`}
                  >
                    <option value="auto">Auto</option>
                    <option value="high">High</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                )}
              </div>
            </div>

            {/* Generate Button at bottom */}
            <div className="mt-6 pt-4 border-t border-gray-700/20">
              <button
                onClick={handleGenerate}
                disabled={activeTab === 'geminiImage' ? isGenerating || !idea.trim() : isGenerating || !idea.trim() || !imageInput.trim()}
                className={`w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all ${
                  isGenerating || !idea.trim() || (activeTab !== 'geminiImage' && !imageInput.trim()) 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-[1.02] hover:shadow-lg'
                } flex items-center justify-center space-x-2`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}
        streamingZone={streamingText && streamingPhase === 'raw' ? (
          <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm mt-6`}>
            <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} flex items-center`}>
                <Sparkles className="h-5 w-5 mr-2 text-violet-500 animate-pulse" />
                Streaming Response...
              </h2>
            </div>
            <div className="p-6">
              <div className={`${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className={`${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} whitespace-pre-wrap font-mono text-sm leading-relaxed`}>
                  {streamingText}
                  <span className="animate-pulse">▊</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        resultZone={
          <>
            {generatedContent.length > 0 && activeTab !== 'geminiImage' && (
              <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm`}>
                <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <h2 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} flex items-center`}>
                      <Sparkles className="h-5 w-5 mr-2 text-violet-500" />
                      Generated Design Content
                    </h2>
                    <span className="text-sm text-gray-500">
                      {generatedContent.length} result{generatedContent.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-6">
                    {generatedContent.map((content, index) => (
                  <div key={content.id} className={`border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-lg ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className={`p-4 bg-gradient-to-r ${resolvedTheme === 'dark' ? 'from-gray-800 to-gray-900' : 'from-violet-50 to-purple-50'} border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-t-lg`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {activeTab !== 'imageEdit' && activeTab !== 'geminiImage' && (
                            <div className={`${resolvedTheme === 'dark' ? 'bg-violet-700 text-violet-100' : 'bg-violet-100 text-violet-600'} px-3 py-1 rounded-full text-sm font-medium`}>
                              Version {index + 1}
                            </div>
                          )}
                          <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{content.title}</h3>
                        </div>
                        <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'} bg-white px-2 py-1 rounded-md`}>
                          {content.timestamp}
                        </span>
                      </div>
                      
                      {/* Rating System - Only show for non-image edit tools */}
                      {activeTab !== 'imageEdit' && activeTab !== 'geminiImage' && (
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Rate this content:</span>
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
                            <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} ml-2`}>
                              ({content.rating}/5)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-gray-50'} rounded-lg border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} p-4 mb-4`}>
                        <div className="prose prose-sm max-w-none">
                          <div className={`${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} whitespace-pre-wrap font-mono text-sm leading-relaxed`}>
                            {content.content}
                          </div>
                        </div>
                      </div>
                      
                      <div className={`flex items-center justify-between ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleCopy(content.content)}
                            className={`flex items-center space-x-2 px-4 py-2 ${resolvedTheme === 'dark' ? 'bg-violet-700 text-violet-100' : 'bg-violet-100 text-violet-700'} rounded-lg font-medium hover:bg-violet-200 transition-colors border border-violet-200`}
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
            {activeTab === 'geminiImage' && imageResponse && renderImageResponse(imageResponse)}
            {error && (
              <div className={`text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'} mt-4`}>{error}</div>
            )}
          </>
        }
        sidebar={null}
      />
    </div>
  );
};

export default DesignAgentPage;