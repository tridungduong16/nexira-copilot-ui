import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import {
  ArrowLeft, 
  GraduationCap, 
  FileText, 
  Video, 
  BookOpen,
  Users,
  Target,
  Award,
  CheckCircle,
  BarChart3,
  Clock,
  Star,
  Globe,
  Lightbulb
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AgentConfigPanel from './ui/AgentConfigPanel';
import { useTheme } from '../contexts/ThemeContext';
import AgentMainContent from './ui/AgentMainContent';
import AgentHeader from './ui/AgentHeader';
import { trackToolUsage } from './tracking/tracker';


interface CourseContent {
  title: string;
  audience_level: string;
  duration_mins: number;
  prerequisites: string[];
  learning_objectives: string[];
  outline: string[];
  activities: string[];
  assessment: string[];
}

interface QuizQuestion {
  id: number;
  type: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface QuizMetadata {
  topic: string;
  audience_level: string;
  language: string;
  num_questions: number;
}

interface QuizResponse {
  questions: QuizQuestion[];
  metadata: QuizMetadata;
}

interface Scene {
  scene_number: number;
  title: string;
  duration_seconds: number;
  visual_description: string;
  narration: string;
  on_screen_text: string;
  notes: string;
}

interface ScriptMetadata {
  topic: string;
  audience_level: string;
  language: string;
  total_scenes: number;
  estimated_production_time: string;
}

interface VideoScriptResponse {
  title: string;
  duration_mins: number;
  scenes: Scene[];
  call_to_action: string;
  metadata: ScriptMetadata;
}

interface Section {
  heading: string;
  bullets: string[];
}

interface QuickReference {
  emergency_contacts: string[];
  common_policies: string[];
  helpful_phrases: string[];
}

interface ManualMetadata {
  topic: string;
  audience_level: string;
  language: string;
  total_sections: number;
  last_updated: string;
}

interface UserManualResponse {
  title: string;
  introduction: string;
  sections: Section[];
  quick_reference: QuickReference;
  metadata: ManualMetadata;
}



const TrainingAgentPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('course');
  const { t, language: uiLanguage } = useLanguage();
  const labels = (t('trainingAgentPage.config.labels') as any) || {};
  const opt = (t('trainingAgentPage.config.options') as any) || {};
  const [audience, setAudience] = useState('beginner');
  const [language, setLanguage] = useState<'en' | 'vi'>(uiLanguage);
  const languageOptions = uiLanguage === 'vi'
    ? [
        { label: 'Tiếng Anh', value: 'en', apiType: 'english' },
        { label: 'Tiếng Việt', value: 'vi', apiType: 'vietnamese' },
      ]
    : [
        { label: 'English', value: 'en', apiType: 'english' },
        { label: 'Vietnamese', value: 'vi', apiType: 'vietnamese' },
      ];
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [courseContent, setCourseContent] = useState<CourseContent>();
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [videoScript, setVideoScript] = useState<VideoScriptResponse | null>(null);
  const [userManual, setUserManual] = useState<UserManualResponse | null>(null);

  const [streamingText, setStreamingText] = useState('');
  const [streamingPhase, setStreamingPhase] = useState<'raw' | 'complete'>('raw');
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const suggestions = [
    'Onboarding training for new sales reps',
    'Security awareness training checklist',
    'Microlearning quiz on product features',
    'Video script for customer success scenarios'
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
    { id: 'course', name: t('trainingAgentPage.tools.course'), icon: BookOpen, color: 'text-indigo-600' },
    { id: 'quiz', name: t('trainingAgentPage.tools.quiz'), icon: CheckCircle, color: 'text-green-600' },
    { id: 'manual', name: t('trainingAgentPage.tools.manual'), icon: FileText, color: 'text-blue-600' },
    { id: 'video', name: t('trainingAgentPage.tools.video'), icon: Video, color: 'text-red-600' }
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setStreamingText('');
    setStreamingPhase('raw');

    try {
      const getSubToolType = () => {
        if (activeTab === 'course') return 'course_content_generation';
        if (activeTab === 'quiz') return 'quiz_generation';
        if (activeTab === 'video') return 'video_script_generation';
        if (activeTab === 'manual') return 'user_manual_generation';
        return 'course_content_generation';
      };

      const sessionId = `ld_${activeTab}_${Date.now()}`;
      const langApiType = languageOptions.find(option => option.value === language)?.apiType || 'english';

      setCourseContent(undefined);
      setQuizData(null);
      setVideoScript(null);
      setUserManual(null);

      const response = await fetch(import.meta.env.VITE_API_URL + '/streaming/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          tool_type: 'ld',
          session_id: sessionId,
          message: topic,
          language: langApiType,
          model: 'auto',
          metadata: {
            sub_tool_type: getSubToolType(),
            audience_level: audience
          }
        })
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
                const chunk = event.content || '';
                flushSync(() => {
                  setStreamingText(prev => prev + chunk);
                });
              } else if (event.type === 'structured_result') {
                setStreamingPhase('complete');
                const fields = event.fields || {};

                if (activeTab === 'course') {
                  setCourseContent(fields);
                } else if (activeTab === 'quiz') {
                  setQuizData(fields);
                } else if (activeTab === 'video') {
                  setVideoScript(fields);
                } else if (activeTab === 'manual') {
                  setUserManual(fields);
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

      await trackToolUsage('training_agent', activeTab, {
        audience_level: audience,
        language: langApiType,
        training_topic: topic,
        sub_tool_type: getSubToolType()
      });
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderVideoScript = () => {
    if (!videoScript) return null;

    return (      
      <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} rounded-lg shadow-md p-6`}>
        <h2 className={`text-2xl font-bold mb-4 ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{videoScript.title}</h2>
        
        <div className="mb-6">
          <p className={`mb-2 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <strong className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Duration:</strong> {videoScript.duration_mins} minutes
          </p>
          <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <strong className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Scenes:</strong> {videoScript.metadata.total_scenes}
          </p>
        </div>

        <div className="space-y-6">
          <h3 className={`text-xl font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Scenes</h3>
          {videoScript.scenes.map((scene, index) => (
            <div key={index} className={`border-l-4 ${resolvedTheme === 'dark' ? 'border-blue-400' : 'border-blue-500'} pl-4`}>
              <div className="mb-2">
                <h4 className={`text-lg font-medium ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                  Scene {scene.scene_number}: {scene.title}
                </h4>
                <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <strong className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Duration:</strong> {scene.duration_seconds} seconds
                </p>
              </div>
              
              {scene.visual_description && (
                <div className="mb-3">
                  <h5 className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Visual Description:</h5>
                  <p className={`italic ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{scene.visual_description}</p>
                </div>
              )}
              
              <div className="mb-3">
                <h5 className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>Narration:</h5>
                <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>{scene.narration}</p>
              </div>
              
              {scene.on_screen_text && (
                <div className="mb-3">
                  <h5 className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>On-Screen Text:</h5>
                  <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{scene.on_screen_text}</p>
                </div>
              )}
              
              {scene.notes && (
                <div className="mb-3">
                  <h5 className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Production Notes:</h5>
                  <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{scene.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {videoScript.call_to_action && (
          <div className={`mt-6 p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Call to Action</h3>
            <p className={`${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-800'}`}>{videoScript.call_to_action}</p>
          </div>
        )}

        <div className={`mt-6 pt-4 border-t ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-2 ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Metadata</h3>
          <div className={`grid grid-cols-2 gap-4 text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <div>
              <strong className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Topic:</strong> {videoScript.metadata.topic}
            </div>
            <div>
              <strong className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Audience Level:</strong> {videoScript.metadata.audience_level}
            </div>
            <div>
              <strong className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Language:</strong> {videoScript.metadata.language}
            </div>
            <div>
              <strong className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Estimated Production Time:</strong> {videoScript.metadata.estimated_production_time}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUserManual = () => {
    if (!userManual) return null;

    return (

      <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
        <h2 className={`text-2xl font-bold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-4`}>
          {userManual.title}
        </h2>
        
        <div className="mb-6">
          <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} mb-2`}>Introduction</h3>
          <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>{userManual.introduction}</p>
        </div>
        
        <div className="mb-6">
          <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} mb-4`}>Sections</h3>
          <div className="space-y-6">
            {userManual.sections.map((section, index) => (
              <div key={index} className={`border-l-4 ${resolvedTheme === 'dark' ? 'border-blue-400' : 'border-blue-500'} pl-4`}>
                <h4 className={`text-md font-medium ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} mb-2`}>
                  {section.heading}
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {section.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex} className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        {userManual.quick_reference && (
          <div className="mb-6">
            <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} mb-4`}>Quick Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userManual.quick_reference.emergency_contacts && (
                <div className={`${resolvedTheme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50'} p-4 rounded-lg border`}>
                  <h4 className={`text-md font-medium ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-800'} mb-2`}>Emergency Contacts</h4>
                  <ul className="space-y-1">
                    {userManual.quick_reference.emergency_contacts.map((contact, index) => (
                      <li key={index} className={`${resolvedTheme === 'dark' ? 'text-red-300' : 'text-red-700'} text-sm`}>
                        {contact}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {userManual.quick_reference.common_policies && (
                <div className={`${resolvedTheme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50'} p-4 rounded-lg border`}>
                  <h4 className={`text-md font-medium ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-800'} mb-2`}>Common Policies</h4>
                  <ul className="space-y-1">
                    {userManual.quick_reference.common_policies.map((policy, index) => (
                      <li key={index} className={`${resolvedTheme === 'dark' ? 'text-blue-300' : 'text-blue-700'} text-sm`}>
                        {policy}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {userManual.quick_reference.helpful_phrases && (
                <div className={`${resolvedTheme === 'dark' ? 'bg-green-900/20 border-green-800' : 'bg-green-50'} p-4 rounded-lg border`}>
                  <h4 className={`text-md font-medium ${resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-800'} mb-2`}>Helpful Phrases</h4>
                  <ul className="space-y-1">
                    {userManual.quick_reference.helpful_phrases.map((shortcut, index) => (
                      <li key={index} className={`${resolvedTheme === 'dark' ? 'text-green-300' : 'text-green-700'} text-sm`}>
                        {shortcut}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className={`mt-6 pt-4 border-t ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'} mb-2`}>Metadata</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Topic:</strong> 
              <span className={`ml-1 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{userManual.metadata?.topic}</span>
            </div>
            <div>
              <strong className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Audience Level:</strong> 
              <span className={`ml-1 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{userManual.metadata?.audience_level}</span>
            </div>
            <div>
              <strong className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Language:</strong> 
              <span className={`ml-1 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{userManual.metadata?.language}</span>
            </div>
            <div>
              <strong className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Last Updated:</strong> 
              <span className={`ml-1 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{userManual.metadata?.last_updated}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string | string[]}>({});
  const [showResults, setShowResults] = useState<{[key: number]: boolean}>({});

  const handleAnswerSelect = (questionId: number, answer: string, questionType: string) => {
    if (questionType === 'mcq' || questionType === 'true_false') {
      setSelectedAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }));
    }
    
    // Show result immediately after selection
    setShowResults(prev => ({
      ...prev,
      [questionId]: true
    }));
  };

  const isAnswerCorrect = (questionId: number, option: string, correctAnswer: string | string[]) => {
    const selected = selectedAnswers[questionId];
    if (!selected) return null;
    
    const isThisOptionCorrect = Array.isArray(correctAnswer) 
      ? correctAnswer.includes(option)
      : correctAnswer === option;
    
    const isThisOptionSelected = Array.isArray(selected)
      ? selected.includes(option)
      : selected === option;
    
    if (isThisOptionSelected) {
      return isThisOptionCorrect;
    }
    
    // Show correct answer even if not selected
    return showResults[questionId] && isThisOptionCorrect ? 'correct-not-selected' : null;
  };

  const renderQuizPreview = () => {
    return (

      <div className={`space-y-6 ${resolvedTheme === 'dark' ? 'bg-[#0B172A]' : 'bg-gray-50'} p-4 rounded-lg`}>
        <div className={`${resolvedTheme === 'dark' ? 'bg-gradient-to-r from-emerald-900/20 to-green-900/20 border-emerald-700/30' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100'} p-6 rounded-xl border`}>
          <h3 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-emerald-200' : 'text-gray-900'} mb-2`}>{quizData?.metadata?.topic || 'Quiz Preview'}</h3>
          <div className={`flex items-center space-x-4 text-sm ${resolvedTheme === 'dark' ? 'text-emerald-300' : 'text-gray-600'}`}>
            <span className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {quizData?.metadata?.audience_level || 'Beginner'}
            </span>
            <span className="flex items-center">
              <Globe className="h-4 w-4 mr-1" />
              {quizData?.metadata?.language || 'English'}
            </span>
            <span className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              {quizData?.metadata?.num_questions || quizData?.questions?.length || 0} questions
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {quizData?.questions?.map((question: any, index: number) => (
            <div key={question.id || index} className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    Question {question.id || index + 1}
                  </h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    question.type === 'mcq' 
                      ? resolvedTheme === 'dark' 
                        ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50' 
                        : 'bg-blue-100 text-blue-800'
                      : resolvedTheme === 'dark'
                        ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50'
                        : 'bg-purple-100 text-purple-800'
                  }`}>
                    {question.type === 'mcq' ? 'Multiple Choice' : 'True/False'}
                  </span>
                </div>
                <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>{question.question}</p>
              </div>

              {question.options && (
                <div className="space-y-2 mb-4">
                  {question.options.map((option: string, optionIndex: number) => {
                    const isCorrect = isAnswerCorrect(question.id || index + 1, option, question.answer);
                    const isSelected = selectedAnswers[question.id || index + 1] === option;
                    
                    return (
                      <button
                        key={optionIndex}
                        onClick={() => handleAnswerSelect(question.id || index + 1, option, question.type)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          isSelected && isCorrect === true
                            ? resolvedTheme === 'dark' 
                              ? 'bg-green-900/30 border-green-600 text-green-200' 
                              : 'bg-green-50 border-green-300 text-green-800'
                            : isSelected && isCorrect === false
                            ? resolvedTheme === 'dark'
                              ? 'bg-red-900/30 border-red-600 text-red-200'
                              : 'bg-red-50 border-red-300 text-red-800'
                            : isCorrect === 'correct-not-selected'
                            ? resolvedTheme === 'dark'
                              ? 'bg-green-900/20 border-green-700 text-green-300'
                              : 'bg-green-100 border-green-400 text-green-700'
                            : resolvedTheme === 'dark'
                            ? 'bg-[#2D3748] border-gray-600 text-gray-200 hover:bg-[#374151] hover:border-gray-500'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <span className="flex items-center">
                          <span className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center text-xs ${
                            isSelected && isCorrect === true
                              ? resolvedTheme === 'dark' 
                                ? 'border-green-500 bg-green-600 text-white' 
                                : 'border-green-500 bg-green-500 text-white'
                              : isSelected && isCorrect === false
                              ? resolvedTheme === 'dark'
                                ? 'border-red-500 bg-red-600 text-white'
                                : 'border-red-500 bg-red-500 text-white'
                              : isCorrect === 'correct-not-selected'
                              ? resolvedTheme === 'dark'
                                ? 'border-green-400 bg-green-600 text-white'
                                : 'border-green-400 bg-green-500 text-white'
                              : resolvedTheme === 'dark'
                              ? 'border-gray-500'
                              : 'border-gray-300'
                          }`}>
                            {(isSelected && isCorrect === true) || isCorrect === 'correct-not-selected' ? '✓' : 
                             (isSelected && isCorrect === false) ? '✗' : 
                             String.fromCharCode(65 + optionIndex)}
                          </span>
                          {option}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {showResults[question.id || index + 1] && question.explanation && (
                <div className={`mt-4 p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-blue-900/20 border-blue-700/30' : 'bg-blue-50 border-blue-200'} border`}>
                  <h5 className={`font-medium ${resolvedTheme === 'dark' ? 'text-blue-300' : 'text-blue-800'} mb-2 flex items-center`}>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Explanation
                  </h5>
                  <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>{question.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
    );
  };

  const renderCourseContentPreview = () => (
    <div className={`space-y-6 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>

      <div className={`bg-gradient-to-r ${resolvedTheme === 'dark' ? 'from-purple-900/40 to-blue-900/40' : 'from-indigo-50 to-blue-50'} p-6 rounded-xl border ${resolvedTheme === 'dark' ? 'border-purple-700/30' : 'border-indigo-100'}`}>
        <h3 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-2`}>{courseContent?.title}</h3>
        <div className={`flex items-center space-x-4 text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          <span className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {courseContent?.audience_level}
          </span>
          <span className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {courseContent?.duration_mins} minutes
          </span>
          <span className="flex items-center">
            <Star className="h-4 w-4 mr-1" />
            Interactive format
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} p-6 rounded-lg border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h4 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-3 flex items-center`}>
            <CheckCircle className={`h-5 w-5 ${resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'} mr-2`} />
            Prerequisites
          </h4>
          <ul className="space-y-2 ">
            {courseContent?.prerequisites.map((prereq, index) => (
              <li key={index} className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} flex items-start`}>
                <span className={`w-2 h-2 ${resolvedTheme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'} rounded-full mt-2 mr-3 flex-shrink-0`}></span>
                {prereq}
              </li>
            ))}
          </ul>
        </div>

        <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} p-6 rounded-lg border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h4 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-3 flex items-center`}>
            <Target className={`h-5 w-5 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
            Learning Objectives
          </h4>
          <ul className="space-y-2">
            {courseContent?.learning_objectives.slice(0, 3).map((objective, index) => (
              <li key={index} className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} flex items-start`}>
                <span className={`w-2 h-2 ${resolvedTheme === 'dark' ? 'bg-blue-500' : 'bg-blue-400'} rounded-full mt-2 mr-3 flex-shrink-0`}></span>
                {objective}
              </li>
            ))}
            {courseContent?.learning_objectives?.length && courseContent?.learning_objectives?.length > 3 && (
              <li className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} italic`}>
                +{courseContent?.learning_objectives?.length - 3} more objectives...
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} p-6 rounded-lg border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <h4 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-3 flex items-center`}>
          <BookOpen className="h-5 w-5 text-indigo-600 mr-2" />
          Course Outline
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {courseContent?.outline.map((section, index) => (
            <div key={index} className={`flex items-center p-3 ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
              <span className={`bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-1 rounded mr-3 ${resolvedTheme === 'dark' ? 'bg-indigo-900 text-indigo-100' : 'bg-indigo-100 text-indigo-800'}`}>
                {index + 1}
              </span>
              <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{section}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} p-6 rounded-lg border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h4 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-3 flex items-center`}>
            <Users className="h-5 w-5 text-purple-600 mr-2" />
            Learning Activities
          </h4>
          <ul className="space-y-2">
            {courseContent?.activities.map((activity, index) => (
              <li key={index} className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} flex items-start`}>
                <span className={`w-2 h-2 ${resolvedTheme === 'dark' ? 'bg-purple-400' : 'bg-purple-400'} rounded-full mt-2 mr-3 flex-shrink-0`}></span>
                {activity}
              </li>
            ))}
          </ul>
        </div>

        <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} p-6 rounded-lg border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h4 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-3 flex items-center`}>
            <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
            Assessment Methods
          </h4>
          <ul className="space-y-2">
            {courseContent?.assessment.map((assessment, index) => (
              <li key={index} className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} flex items-start`}>
                <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                {assessment}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={`${resolvedTheme === 'dark' ? 'bg-amber-900/10' : 'bg-amber-50'} border border-amber-200 rounded-lg p-4`}>
        <div className="flex items-start">
          <Award className="h-5 w-5 text-amber-600 mt-0.5 mr-3" />
          <div>
            <h5 className={`font-medium ${resolvedTheme === 'dark' ? 'text-amber-400' : 'text-amber-800'} mb-1`}>Course Completion</h5>
            <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}>
              Upon successful completion, participants will receive a certificate and be qualified to handle intermediate-level customer service scenarios independently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-[#001F3F]' : 'bg-[#E6F0FF]'}`}>
      {/* Header */}

      <AgentHeader
        icon={<GraduationCap />}
        avatar="/assets/icon2.png"
        title={t('trainingAgentPage.title')}
        subtitle={t('trainingAgentPage.description')}
        description={t('trainingAgentPage.fullDescription') || 'Create engaging training materials, courses, and assessments with AI-powered learning tools.'}
        tags={[{ icon: <CheckCircle />, label: t('trainingAgentPage.aiReady'), properties: 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200' }, { icon: <GraduationCap />, label: t('trainingAgentPage.ldMode'), properties: 'bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium border border-indigo-200' }]}
        onBack={onBack}
      />


      <AgentMainContent
        toolsTitle={t('trainingAgentPage.selectTool')}
        tools={tools}
        activeTab={activeTab}
        toolOnClick={setActiveTab}
        configPanel={
          <AgentConfigPanel
            isGenerating={isGenerating}
            selectFields={[
              { id: 'audience', label: labels.audience || 'Audience level', value: audience, onChange: setAudience, options: [
                { label: opt?.audience?.beginner || 'Beginner', value: 'beginner' },
                { label: opt?.audience?.intermediate || 'Intermediate', value: 'intermediate' },
                { label: opt?.audience?.advanced || 'Advanced', value: 'advanced' },
              ]},
              { id: 'lang', label: labels.language || 'Language', value: language, onChange: setLanguage, options: languageOptions }
            ]}
            textarea={{ label: labels.topic || 'Training topic', value: topic, onChange: setTopic, placeholder: 'e.g., Product A onboarding with objectives and assessments' }}
            suggestions={suggestions}
            onSuggestionClick={(s) => setTopic(s)}
            onGenerate={handleGenerate}
            generateButtonLabel={isGenerating ? 'Generating...' : 'Generate'}
            accentButtonClass={'bg-indigo-600 hover:bg-indigo-700'}
          />
        }
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
                  <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse"></span>
                </div>
              </div>
            )}

            {/* Structured Results Display */}
            {streamingPhase === 'complete' && (
              <>
                {activeTab === 'course' && courseContent && renderCourseContentPreview()}
                {activeTab === 'quiz' && quizData && renderQuizPreview()}
                {activeTab === 'video' && videoScript && renderVideoScript()}
                {activeTab === 'manual' && userManual && renderUserManual()}
              </>
            )}
          </>
        }
        sidebar={
          <div className="space-y-6">
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm`}>
              <div className={`p-4 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-900'}`}>{t('trainingAgentPage.statistics')}</h3>
              </div>
              <div className={`p-4 space-y-3 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
                <div className={`flex justify-between ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
                  <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('trainingAgentPage.coursesCreated')}</span>
                  <span className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-900'}`}>92</span>
                </div>
                <div className={`flex justify-between ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
                  <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('trainingAgentPage.quizzes')}</span>
                  <span className={`font-semibold ${resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>45</span>
                </div>
                <div className={`flex justify-between ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
                  <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('trainingAgentPage.videoScripts')}</span>
                  <span className={`font-semibold ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>18</span>
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default TrainingAgentPage;
