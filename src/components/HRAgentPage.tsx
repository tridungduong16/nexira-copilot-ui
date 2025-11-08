import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Users,
  FileText,
  MessageSquare,
  Award,
  Copy,
  Check,
  CheckCircle,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AgentConfigPanel from './ui/AgentConfigPanel';
import AgentHeader from './ui/AgentHeader';
import StreamingChatBox from './ui/StreamingChatBox';
import { streamingService, StreamingToolType } from '../services/streamingService';
import { getCurrentUserId } from '../utils/userUtils';
import { useTheme } from '../contexts/ThemeContext';
import { trackToolUsage } from './tracking/tracker';

const HRAgentPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('jd');
  const { t, language: uiLanguage } = useLanguage();
  const labels = (t('hrAgentPage.config.labels') as any) || {};
  const opt = (t('hrAgentPage.config.options') as any) || {};
  const [roleLevel, setRoleLevel] = useState('junior');
  const [jobType, setJobType] = useState('fulltime');
  const [language, setLanguage] = useState<'en' | 'vi'>(uiLanguage);
  const languageOptions = uiLanguage === 'vi'
    ? [
        { label: 'Tiếng Anh', value: 'en' },
        { label: 'Tiếng Việt', value: 'vi' },
      ]
    : [
        { label: 'English', value: 'en' },
        { label: 'Vietnamese', value: 'vi' },
      ];
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    title?: string;
    summary?: string;
    sections?: string[];
    items?: string[];
    recommendations?: string[];
    score?: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Streaming states for Generate button
  const [streamingText, setStreamingText] = useState('');
  const [streamingPhase, setStreamingPhase] = useState<'raw' | 'complete'>('raw');

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [streamingSessionId, setStreamingSessionId] = useState<string>('');

  // Separate state for chat to prevent interference with Generate function
  const [chatSettings, setChatSettings] = useState({
    roleLevel: 'junior',
    jobType: 'fulltime',
    language: 'vi' as 'en' | 'vi'
  });

  // Sync settings with chat when they change, but don't disrupt ongoing chat
  useEffect(() => {
    setChatSettings({
      roleLevel,
      jobType,
      language
    });
  }, [roleLevel, jobType, language]);

  const toolToEndpoint: Record<string, string> = {
    jd: import.meta.env.VITE_API_URL + '/hr/job-description',
    cv: import.meta.env.VITE_API_URL + '/hr/analyze-cv',
    interview: import.meta.env.VITE_API_URL + '/hr/create-interview-questions',
    policy: import.meta.env.VITE_API_URL + '/hr/create-hr-policies',
  };

  const toolToType: Record<string, string> = {
    jd: 'write_job_description',
    cv: 'analyze_cv',
    interview: 'create_interview_questions',
    policy: 'hr_policies',
  };

  const mapJobType = (jt: string) => {
    if (jt === 'fulltime') return 'full_time';
    if (jt === 'parttime') return 'part_time';
    return jt; // contract, internship
  };

  const mapLanguage = (lng: 'en' | 'vi') => (lng === 'en' ? 'english' : 'vietnamese');

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

  const copyResult = async () => {
    if (!result) return;
    
    let textToCopy = '';
    if (result.title) textToCopy += `${result.title}\n\n`;
    if (result.summary) textToCopy += `${result.summary}\n\n`;
    if (result.sections && result.sections.length > 0) {
      textToCopy += `${uiLanguage === 'vi' ? 'Phần:' : 'Sections:'}\n`;
      result.sections.forEach(s => textToCopy += `• ${s}\n`);
      textToCopy += '\n';
    }
    if (result.items && result.items.length > 0) {
      textToCopy += `${uiLanguage === 'vi' ? 'Mục:' : 'Items:'}\n`;
      result.items.forEach(item => textToCopy += `• ${item}\n`);
      textToCopy += '\n';
    }
    if (result.recommendations && result.recommendations.length > 0) {
      textToCopy += `${uiLanguage === 'vi' ? 'Khuyến nghị:' : 'Recommendations:'}\n`;
      result.recommendations.forEach(r => textToCopy += `• ${r}\n`);
    }
    if (typeof result.score === 'number') {
      textToCopy += `\n${uiLanguage === 'vi' ? 'Điểm:' : 'Score:'} ${result.score}`;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Fetch available models and create streaming session once when component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        const userId = getCurrentUserId();

        // Create streaming session
        const streamSession = await streamingService.createSession(StreamingToolType.HR, userId || undefined);
        setStreamingSessionId(streamSession.session_id);
        console.log(`Created streaming session ${streamSession.session_id} for user: ${userId || 'guest'}`);

        // Fetch available models
        await fetchAvailableModels();
      } catch (error) {
        console.error('Failed to create session:', error);
        setStreamingSessionId('hr_stream_default');
        // Still try to fetch models even if session creation fails
        await fetchAvailableModels();
      }
    };
    initialize();
  }, []); // Empty dependency array - only run once on mount

  // Cleanup streaming session when component unmounts
  useEffect(() => {
    return () => {
      const cleanup = async () => {
        try {
          const userId = getCurrentUserId();

          // Cleanup streaming session
          if (streamingSessionId && streamingSessionId !== 'hr_stream_default') {
            await streamingService.cleanupSession(streamingSessionId, StreamingToolType.HR, userId || undefined);
            console.log(`Cleaned up streaming session: ${streamingSessionId} for user: ${userId || 'guest'}`);
          }
        } catch (error) {
          console.error('Failed to cleanup session:', error);
        }
      };
      cleanup();
    };
  }, [streamingSessionId]); // Depend on streaming session ID

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setResult(null);
    setStreamingText('');
    setStreamingPhase('raw');

    const sessionId = `hr_gen_${Date.now()}`;
    const subToolType = toolToType[activeTab] || toolToType.jd;

    const requestBody = {
      tool_type: 'hr',
      session_id: sessionId,
      message: prompt,
      language: mapLanguage(language),
      role_level: roleLevel,
      job_type: mapJobType(jobType),
      model: 'auto',
      metadata: {
        sub_tool_type: subToolType
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
                setResult({
                  title: fields.title || undefined,
                  summary: fields.summary || undefined,
                  sections: fields.sections || undefined,
                  items: fields.items || undefined,
                  recommendations: fields.recommendations || undefined,
                  score: fields.score || undefined,
                });
              } else if (event.type === 'complete') {
                console.log('Streaming completed successfully');
              } else if (event.type === 'error') {
                throw new Error(event.content || 'Unknown streaming error');
              }
            } catch (parseError) {
              console.error('Failed to parse SSE event:', parseError, jsonStr);
              // If the response doesn't look like JSON, treat it as an error message
              if (!jsonStr.trim().startsWith('{') && !jsonStr.trim().startsWith('[')) {
                const errorMessage = uiLanguage === 'vi'
                  ? `Lỗi từ server: ${jsonStr}`
                  : `Server error: ${jsonStr}`;
                throw new Error(errorMessage);
              }
            }
          }
        }
      }

      await trackToolUsage('hr_agent', activeTab, requestBody);
    } catch (e: any) {
      console.error('HR generate error:', e);
      setResult({
        title: uiLanguage === 'vi' ? 'Lỗi' : 'Error',
        summary: uiLanguage === 'vi'
          ? 'Có lỗi xảy ra khi tạo nội dung. Vui lòng thử lại.'
          : 'An error occurred while generating content. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Upload UI removed; replaced by chat with documents (RAG)

  const suggestions = uiLanguage === 'vi' ? [
    'Viết JD cho React developer với 2-3 năm kinh nghiệm',
    'Câu hỏi sàng lọc cho vị trí data analyst',
    'Kế hoạch phỏng vấn cho senior backend engineer',
    'Đề cương chính sách công ty cho làm việc từ xa'
  ] : [
    'Write JD for React developer with 2-3 years experience',
    'Screening questions for a data analyst role',
    'Interview plan for senior backend engineer',
    'Company policy outline for remote work'
  ];

  const tools = [
    { id: 'jd', name: t('hrAgentPage.tools.jd'), icon: FileText, color: 'text-blue-400' },
    { id: 'cv', name: t('hrAgentPage.tools.cv'), icon: Users, color: 'text-green-400' },
    { id: 'interview', name: t('hrAgentPage.tools.interview'), icon: MessageSquare, color: 'text-purple-400' },
    { id: 'policy', name: t('hrAgentPage.tools.policy'), icon: Award, color: 'text-orange-400' }
  ];

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-[#001F3F]' : 'bg-[#E6F0FF]'}`}>
      {/* Header */}
      <AgentHeader
        icon={<Users />}
        title={t('hrAgentPage.title')}
        subtitle={t('hrAgentPage.subtitle')}
        tags={[{icon: <CheckCircle />, label: t('hrAgentPage.aiReady'), properties: 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200' }, { icon: <Award />, label: t('hrAgentPage.hrMode'), properties: 'bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium border border-blue-200' }]}
        onBack={onBack}
      />

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-[calc(100vh-200px)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Left Side - Tools & Config */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tools Section */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm h-[85vh] flex flex-col overflow-hidden`}>
              <div className={`h-14 px-4 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex-shrink-0 flex items-center`}>
                <h2 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{t('hrAgentPage.toolsTitle')}</h2>
              </div>
              
              <div className="p-4 lg:p-6 flex-1 overflow-visible">
                {/* Tool Selection Grid */}
                <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                  {tools.map((tool) => {
                    const IconComponent = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => setActiveTab(tool.id)}
                        className={`flex flex-col items-center space-y-2 p-3 lg:p-4 rounded-lg border transition-all ${
                          activeTab === tool.id
                            ? `border-blue-500 ${resolvedTheme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'} text-blue-600`
                            : `${resolvedTheme === 'dark' ? 'border-gray-600 hover:border-gray-500 text-gray-300 hover:text-gray-200' : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-800'}`
                        }`}
                      >
                        <IconComponent className={`h-6 w-6 lg:h-8 lg:w-8 ${activeTab === tool.id ? tool.color : (resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500')}`} />
                        <span className="font-medium text-sm lg:text-base text-center">{tool.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Config Panel */}
                <AgentConfigPanel
                  isGenerating={isGenerating}
                  selectFields={[
                    { id: 'role', label: labels.roleLevel || 'Role level', value: roleLevel, onChange: setRoleLevel, options: [
                      { label: opt?.roleLevel?.intern || 'Intern', value: 'intern' },
                      { label: opt?.roleLevel?.junior || 'Junior', value: 'junior' },
                      { label: opt?.roleLevel?.mid || 'Mid', value: 'mid' },
                      { label: opt?.roleLevel?.senior || 'Senior', value: 'senior' },
                    ]},
                    { id: 'type', label: labels.jobType || 'Job type', value: jobType, onChange: setJobType, options: [
                      { label: opt?.jobType?.fulltime || 'Full-time', value: 'fulltime' },
                      { label: opt?.jobType?.parttime || 'Part-time', value: 'parttime' },
                      { label: opt?.jobType?.contract || 'Contract', value: 'contract' },
                      { label: opt?.jobType?.internship || 'Internship', value: 'internship' },
                    ]},
                    { id: 'lang', label: labels.language || 'Language', value: language, onChange: setLanguage, options: languageOptions },
                  ]}
                  onGenerate={handleGenerate}
                  generateButtonLabel={isGenerating ? (uiLanguage === 'vi' ? 'Đang tạo...' : 'Generating...') : (uiLanguage === 'vi' ? 'Tạo' : 'Generate')}
                  accentButtonClass={'bg-blue-600 hover:bg-blue-700'}
                />

                {/* Suggestions - Horizontal Layout Above Textarea */}
                {suggestions.length > 0 && (
                  <div className="mt-0">
                    <div className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      {uiLanguage === 'vi' ? 'Gợi ý' : 'Suggestions'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => setPrompt(s)}
                          className={`text-left px-3 py-2 ${resolvedTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-lg text-sm transition-colors whitespace-nowrap overflow-hidden text-ellipsis`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task Textarea */}
                <div className="mt-4">
                  <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    {labels.task || (uiLanguage === 'vi' ? 'Mô tả tác vụ HR' : 'Describe the HR task')}
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={5}
                    placeholder={uiLanguage === 'vi' 
                      ? 'Ví dụ: Tạo JD cho QA engineer level trung cấp bao gồm trách nhiệm và yêu cầu trình độ'
                      : 'e.g., Create a JD for a mid-level QA engineer including responsibilities and qualifications' 
                    }
                    className={`w-full border ${resolvedTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      className="inline-flex items-center px-4 py-2 text-white rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating 
                        ? (uiLanguage === 'vi' ? 'Đang tạo...' : 'Generating...')
                        : (uiLanguage === 'vi' ? 'Tạo' : 'Generate')
                      }
                    </button>
                    <button
                      onClick={() => setIsChatOpen(true)}
                      className={`${resolvedTheme === 'dark' ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} inline-flex items-center px-4 py-2 rounded-lg border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
                    >
                      {uiLanguage === 'vi' ? 'Mở Chat với tài liệu' : 'Open Chat with Documents'}
                    </button>
                  </div>
                </div>

                {/* Upload & Result moved to right column */}

              </div>
            </div>
          </div>

          {/* Right Side - Outputs (same height as left) */}
          <div className="lg:col-span-1 flex flex-col">
            {/* Output & Upload Card */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm h-[85vh] flex flex-col overflow-hidden`}>
              <div className={`h-14 px-4 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex-shrink-0 flex items-center`}>
                <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                  {uiLanguage === 'vi' ? 'Kết quả' : 'Result'}
                </h3>
              </div>
              <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                {/* Streaming Raw Text Display */}
                {streamingPhase === 'raw' && streamingText && (
                  <div className={`mt-6 p-4 rounded-lg ${
                    resolvedTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
                  } border ${
                    resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <div className={`font-mono text-sm whitespace-pre-wrap ${
                      resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {streamingText}
                      <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse"></span>
                    </div>
                  </div>
                )}

                {/* Structured Result Display */}
                {result && streamingPhase === 'complete' && (
                  <div className={`mt-6 space-y-4 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="flex items-center justify-between">
                      {result.title && (
                        <h3 className={`text-xl font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{result.title}</h3>
                      )}
                      <button
                        onClick={copyResult}
                        className={`inline-flex items-center gap-2 px-3 py-1 text-sm ${resolvedTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-lg transition-colors`}
                        title={uiLanguage === 'vi' ? 'Sao chép kết quả' : 'Copy result'}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-green-500">{uiLanguage === 'vi' ? 'Đã sao chép' : 'Copied'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>{uiLanguage === 'vi' ? 'Sao chép' : 'Copy'}</span>
                          </>
                        )}
                      </button>
                    </div>
                    {result.summary && (
                      <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} whitespace-pre-line`}>{result.summary}</p>
                    )}
                    {result.sections && result.sections.length > 0 && (
                      <div>
                        <h4 className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                          {uiLanguage === 'vi' ? 'Phần' : 'Sections'}
                        </h4>
                        <ul className={`list-disc list-inside ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} space-y-1`}>
                          {result.sections.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.items && result.items.length > 0 && (
                      <div>
                        <h4 className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                          {uiLanguage === 'vi' ? 'Mục' : 'Items'}
                        </h4>
                        <ul className={`list-disc list-inside ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} space-y-1`}>
                          {result.items.map((it, i) => (
                            <li key={i} className="whitespace-pre-line">{it}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {typeof result.score === 'number' && (
                      <div className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {uiLanguage === 'vi' ? 'Điểm: ' : 'Score: '}
                        <span className="font-semibold">{result.score}</span>
                      </div>
                    )}
                    {result.recommendations && result.recommendations.length > 0 && (
                      <div>
                        <h4 className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
                          {uiLanguage === 'vi' ? 'Khuyến nghị' : 'Recommendations'}
                        </h4>
                        <ul className={`list-disc list-inside ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} space-y-1`}>
                          {result.recommendations.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>

          
        </div>
      </div>
      {/* Bottom Popup: Chat with Documents (no floating open button) */}
      {isChatOpen && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 w-[calc(100%-2rem)] max-w-7xl">
          <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-lg flex flex-col overflow-hidden`}>
            <div className={`px-4 py-2 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                {uiLanguage === 'vi' ? 'Chat với tài liệu' : 'Chat with Documents'}
              </h3>
              <button
                onClick={() => setIsChatOpen(false)}
                className={`${resolvedTheme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'} p-1 rounded-lg`}
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-[80vh] min-h-[300px]">
              <div className="h-full min-h-0 flex flex-col overflow-hidden">
                <StreamingChatBox
                  sessionId={streamingSessionId}
                  toolType={StreamingToolType.HR}
                  language={chatSettings.language === 'vi' ? 'vietnamese' : 'english'}
                  roleLevel={chatSettings.roleLevel}
                  jobType={mapJobType(chatSettings.jobType)}
                  model="auto"
                  placeholder={uiLanguage === 'vi' ? 'Nhập câu hỏi HR của bạn...' : 'Enter your HR question...'}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRAgentPage;