import React, { useState } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Sparkles,
  Upload,
  X,
  Download,
  Share2,
  RefreshCw,
  Wand2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

type Mode = 'generate' | 'edit';
type AIModel = 'gemini' | 'chatgpt' | 'dreamseed';

interface DesignAgentPageProps {
  onBack: () => void;
}

const DesignAgentPage: React.FC<DesignAgentPageProps> = ({ onBack }) => {
  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = resolvedTheme === 'dark';

  const [mode, setMode] = useState<Mode>('generate');
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null);

  const models = [
    {
      id: 'gemini' as AIModel,
      name: 'Gemini Banana',
      icon: '🍌',
      description: 'Fast and colorful; ideal for concept art'
    },
    {
      id: 'chatgpt' as AIModel,
      name: 'ChatGPT',
      icon: '🤖',
      description: 'Structured, storytelling-driven visuals'
    },
    {
      id: 'dreamseed' as AIModel,
      name: 'DreamSeed',
      icon: '🌙',
      description: 'Cinematic and atmospheric'
    },
  ];

  const examplePrompts = [
    'A futuristic city under golden light',
    'Abstract geometric patterns in vibrant colors',
    'Minimalist product photography on white background',
    'Cyberpunk street scene at night with neon lights',
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const handleOptimizeAndCreate = async () => {
    if (!prompt.trim()) return;
    if (mode === 'edit' && !uploadedImage) return;

    setIsGenerating(true);
    setGeneratedImage(null);
    setOptimizedPrompt(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      setOptimizedPrompt(`Enhanced prompt: ${prompt} with professional lighting, sharp focus, high detail, cinematic composition`);
      setGeneratedImage('https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=800');
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'nexira-design.png';
    link.click();
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#001F3F]' : 'bg-[#E6F0FF]'}`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className={`mb-6 flex items-center gap-2 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Marketplace</span>
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-[#001F3F]'}`}>
                Design Agent
              </h1>
              <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Your Creative Copilot for Visual Imagination
              </p>
            </div>
          </div>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-4xl`}>
            Transform imagination into polished visuals. From generating entirely new images to transforming existing ones,
            this agent combines precision, artistry, and speed with a single "Optimise & Create" action.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setMode('generate')}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all ${
              mode === 'generate'
                ? 'bg-gradient-to-r from-[#0B63CE] to-[#3399FF] text-white shadow-lg'
                : isDark
                ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <Wand2 className="w-5 h-5" />
              <div className="text-left">
                <div className="font-bold">Image Generation</div>
                <div className="text-xs opacity-80">Bring ideas to life from text</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all ${
              mode === 'edit'
                ? 'bg-gradient-to-r from-[#0B63CE] to-[#3399FF] text-white shadow-lg'
                : isDark
                ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <ImageIcon className="w-5 h-5" />
              <div className="text-left">
                <div className="font-bold">Image Editing</div>
                <div className="text-xs opacity-80">Refine and transform visuals</div>
              </div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* Feature Description Card */}
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
              <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#001F3F]'}`}>
                {mode === 'generate' ? '🪄 Image Generation' : '🖌️ Image Editing'}
              </h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {mode === 'generate'
                  ? 'Just describe what you want to see — and the Design Agent handles the rest.'
                  : 'Upload an image and let the Design Agent reimagine it — from subtle retouching to full visual transformation.'}
              </p>

              {mode === 'generate' ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <span className={`text-lg ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>📝</span>
                    <div>
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Paste Your Prompt</div>
                      <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Describe your vision</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className={`text-lg ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>🎨</span>
                    <div>
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Choose Your Model</div>
                      <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Pick an AI engine that fits your style</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className={`text-lg ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>⚙️</span>
                    <div>
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Click "Optimise & Generate"</div>
                      <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Instantly creates your image</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <span className={`text-lg ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>📤</span>
                    <div>
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Upload Your Image</div>
                      <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Choose any image to improve</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className={`text-lg ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>🧠</span>
                    <div>
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add an Edit Prompt</div>
                      <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Describe what you'd like to change</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className={`text-lg ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>⚙️</span>
                    <div>
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Click "Optimise & Edit"</div>
                      <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Applies the edit seamlessly</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Image Upload (for edit mode) */}
            {mode === 'edit' && (
              <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
                <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Upload Image
                </label>
                {!imagePreview ? (
                  <div
                    onClick={() => document.getElementById('imageUpload')?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:scale-[1.02] ${
                      isDark
                        ? 'border-blue-500/50 hover:border-blue-400 bg-blue-900/10'
                        : 'border-blue-300 hover:border-blue-400 bg-blue-50'
                    }`}
                  >
                    <Upload className={`mx-auto h-12 w-12 mb-3 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                    <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Click to upload image
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      PNG, JPG, GIF up to 10MB
                    </p>
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-xl" />
                    <button
                      onClick={removeImage}
                      className={`absolute top-2 right-2 p-2 rounded-full shadow-lg transition-all hover:scale-110 ${
                        isDark ? 'bg-gray-800/90 hover:bg-gray-700' : 'bg-white/90 hover:bg-gray-100'
                      }`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Model Selection (for generate mode) */}
            {mode === 'generate' && (
              <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
                <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Choose Your AI Model
                </label>
                <div className="space-y-3">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        selectedModel === model.id
                          ? 'bg-gradient-to-r from-[#0B63CE] to-[#3399FF] text-white shadow-lg'
                          : isDark
                          ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{model.icon}</span>
                        <div className="flex-1">
                          <div className="font-semibold">{model.name}</div>
                          <div className={`text-xs ${selectedModel === model.id ? 'opacity-90' : 'opacity-70'}`}>
                            {model.description}
                          </div>
                        </div>
                        {selectedModel === model.id && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Input */}
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
              <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {mode === 'generate' ? 'Describe Your Vision' : 'Describe Your Edits'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder={mode === 'generate'
                  ? 'e.g., A futuristic city under golden light with flying cars and holographic billboards'
                  : 'e.g., Make the background sunset orange and add a reflection on the glass'}
                className={`w-full rounded-lg px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-[#0B63CE]/50 transition-all ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-gray-200 placeholder-gray-500'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />

              {mode === 'generate' && (
                <div className="mt-4">
                  <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Quick examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {examplePrompts.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(example)}
                        className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                          isDark
                            ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Unified Action Button */}
            <button
              onClick={handleOptimizeAndCreate}
              disabled={isGenerating || !prompt.trim() || (mode === 'edit' && !uploadedImage)}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                isGenerating || !prompt.trim() || (mode === 'edit' && !uploadedImage)
                  ? 'opacity-50 cursor-not-allowed bg-gray-400'
                  : 'bg-gradient-to-r from-[#0B63CE] to-[#3399FF] hover:shadow-xl hover:scale-[1.02] text-white'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Creating Magic...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>✨ Optimise & {mode === 'generate' ? 'Generate' : 'Edit'}</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column - Output */}
          <div className="space-y-6">
            {/* Highlights */}
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
              <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-[#001F3F]'}`}>
                Highlights
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>✨</div>
                  <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Smart Prompt Optimization for better lighting and framing
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>🧩</div>
                  <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {mode === 'generate' ? 'Multi-Model Switching without losing your prompt' : 'Consistent tone and lighting preservation'}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>🖼️</div>
                  <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {mode === 'generate' ? 'Live Preview Gallery with side-by-side comparison' : 'Real-time before/after preview'}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>💾</div>
                  <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Save & Share your creations instantly
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            {optimizedPrompt && (
              <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
                <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Optimized Prompt
                </h4>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {optimizedPrompt}
                </p>
              </div>
            )}

            {generatedImage && (
              <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {mode === 'generate' ? 'Generated Image' : 'Edited Image'}
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={downloadImage}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      className={`p-2 rounded-lg transition-colors ${
                        isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-auto rounded-xl shadow-lg"
                />
              </div>
            )}

            {!generatedImage && !isGenerating && (
              <div className={`p-12 rounded-2xl text-center ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                <ImageIcon className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Your {mode === 'generate' ? 'generated' : 'edited'} image will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignAgentPage;
