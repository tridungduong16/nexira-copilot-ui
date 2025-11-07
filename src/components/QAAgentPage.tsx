import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle, 
  Bug, 
  FileText, 
  Settings,
  TestTube,
  AlertTriangle,
  Target,
  BarChart3,
  Clock,
  Star,
  Upload,
  Send,
  Copy,
  Save,
  Download,
  Sparkles,
  Lightbulb,
  Code,
  Search,
  List,
  Shield,
  Zap,
  Eye,
  MessageSquare,
  RefreshCw,
  Plus,
  Filter,
  CheckSquare,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Globe,
  Smartphone,
  Monitor,
  Database
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { trackToolUsage } from './tracking/tracker';

interface TestCase {
  id: string;
  name: string;
  objective: string;
  input: string;
  expectedOutput: string;
  steps: string[];
  type: string;
  priority: string;
  status: 'draft' | 'review' | 'approved';
}

interface BugReport {
  id: string;
  title: string;
  severity: string;
  description: string;
  steps: string[];
  environment: string;
  timestamp: string;
}

interface TestReportCaseResult {
  id: string;
  name: string;
  status: string;
  error: string;
}

interface TestReport {
  project_name: string;
  project_version: string;
  test_report_type: string;
  test_results: TestReportCaseResult[];
  conclusion: string;
  recommendations: string[];
}

type TestCaseHistoryEntry = {
  timestamp: string;
  input: { prompt: string; testType: string; priority: string; platform: string; };
  response: TestCase[];
};

type LogAnalysisHistoryEntry = {
  timestamp: string;
  input: { logPrompt: string };
  response: BugReport[];
};

type ReportHistoryEntry = {
  timestamp: string;
  input: { projectName: string; projectVersion: string; testReportType: string; testResultsSummary: string; };
  response: TestReport;
};

type ChecklistHistoryEntry = {
  timestamp: string;
  input: { prompt: string; checklistType: string; };
  response: string[];
};

interface ToolHistoryState {
  testcase: TestCaseHistoryEntry[];
  log_analysis: LogAnalysisHistoryEntry[];
  report: ReportHistoryEntry[];
  checklist: ChecklistHistoryEntry[];
}

const QAAgentPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('testcase');
  const [testCasePrompt, setTestCasePrompt] = useState('');
  const [logPrompt, setLogPrompt] = useState('');
  const [checklistPrompt, setChecklistPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const { t } = useLanguage();
  const [checklist, setChecklist] = useState<string[]>([]);
  const [testReport, setTestReport] = useState<TestReport | null>(null);

  // Dynamic model state (for verification only)
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  // Form states
  const [testType, setTestType] = useState('manual');
  const [priority, setPriority] = useState('medium');
  const [platform, setPlatform] = useState('web');
  const [checklistType, setChecklistType] = useState('smoke_test');
  const [projectName, setProjectName] = useState('');
  const [projectVersion, setProjectVersion] = useState('');
  const [testResultsSummary, setTestResultsSummary] = useState('');
  const [testReportType, setTestReportType] = useState('summary');
  const [imageInput, setImageInput] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [context, setContext] = useState('');

  const [streamingText, setStreamingText] = useState('');
  const [streamingPhase, setStreamingPhase] = useState<'raw' | 'complete'>('raw');

  // Fetch available models from backend (for verification only)
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
    }
  };

  // Initialize histories for all tools
  const [toolHistory, setToolHistory] = useState<ToolHistoryState>({
    testcase: [],
    log_analysis: [],
    report: [],
    checklist: [],
  });

  // Utility to add to history per tool
  function addHistoryEntry<K extends keyof ToolHistoryState>(
    tool: K,
    entry: ToolHistoryState[K][number]
  ) {
    setToolHistory(prev => ({
      ...prev,
      [tool]: [entry, ...prev[tool]] // most recent first
    }));
  }


  const [exportFormat, setExportFormat] = useState('json');
  //const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch models on component mount
  useEffect(() => {
    fetchAvailableModels();
  }, []);

  const tools = [
    { 
      id: 'testcase', 
      name: t('qaAgentPage.tools.testcase'), 
      icon: TestTube, 
      color: 'text-cyan-400',
      description: 'Create test cases from requirement descriptions'
    },
    { 
      id: 'log_analysis', 
      name: t('qaAgentPage.tools.log-analysis'), 
      icon: Bug, 
      color: 'text-red-400',
      description: 'Summarize error logs & analyze exceptions'
    },
    { 
      id: 'report', 
      name: t('qaAgentPage.tools.report'), 
      icon: FileText, 
      color: 'text-blue-400',
      description: 'Write standard test reports'
    },
    { 
      id: 'checklist', 
      name: t('qaAgentPage.tools.checklist'), 
      icon: CheckSquare, 
      color: 'text-green-400',
      description: 'Create checklists based on process'
    }
  ];

  const testTypes = [
    { id: 'manual', name: t('qaAgentPage.testCaseTab.testTypes.manual'), apiType: 'manual_testing' },
    { id: 'automation', name: t('qaAgentPage.testCaseTab.testTypes.automation'), apiType: 'automation_testing' },
    { id: 'boundary', name: t('qaAgentPage.testCaseTab.testTypes.boundary'), apiType: 'boundary_testing' },
    { id: 'negative', name: t('qaAgentPage.testCaseTab.testTypes.negative'), apiType: 'negative_testing' },
    { id: 'performance', name: t('qaAgentPage.testCaseTab.testTypes.performance'), apiType: 'performance_testing' },
    { id: 'security', name: t('qaAgentPage.testCaseTab.testTypes.security'), apiType: 'security_testing' }
  ];

  const priorities = [
    { id: 'critical', name: t('qaAgentPage.testCaseTab.priorities.critical'), color: 'text-red-400', apiType: 'critical' },
    { id: 'high', name: t('qaAgentPage.testCaseTab.priorities.high'), color: 'text-orange-400', apiType: 'high' },
    { id: 'medium', name: t('qaAgentPage.testCaseTab.priorities.medium'), color: 'text-yellow-400', apiType: 'medium' },
    { id: 'low', name: t('qaAgentPage.testCaseTab.priorities.low'), color: 'text-green-400', apiType: 'low' }
  ];

  const platforms = [
    { id: 'web', name: t('qaAgentPage.testCaseTab.platforms.web'), icon: Globe, apiType: 'web' },
    { id: 'mobile', name: t('qaAgentPage.testCaseTab.platforms.mobile'), icon: Smartphone, apiType: 'mobile' },
    { id: 'desktop', name: t('qaAgentPage.testCaseTab.platforms.desktop'), icon: Monitor, apiType: 'desktop' },
    { id: 'api', name: t('qaAgentPage.testCaseTab.platforms.api'), icon: Database, apiType: 'api' }
  ];

  const checklistTypes = [
    { id: 'smoke', name: 'Smoke Test', apiType: 'smoke_test' },
    { id: 'regression', name: 'Regression Test', apiType: 'regression_test' },
    { id: 'release', name: 'Release Checklist', apiType: 'release' }
  ];

  const testReportTypes = [
    { id: 'summary', name: 'Summary Report', apiType: 'summary' },
    { id: 'detailed', name: 'Detailed Report', apiType: 'detailed' },
    { id: 'regression', name: 'Regression Report', apiType: 'regression' }
  ];

  const promptSuggestions = [
    t('qaAgentPage.suggestions.items.passwordReset'),
    t('qaAgentPage.suggestions.items.registrationForm'),
    t('qaAgentPage.suggestions.items.fileUpload'),
    t('qaAgentPage.suggestions.items.loginApi'),
    t('qaAgentPage.suggestions.items.performanceTest'),
    t('qaAgentPage.suggestions.items.securityTest')
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedImage(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      setImagePreview(base64Data);
      setImageInput(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setImageInput('');
  };

  const handleGenerate = async () => {
    if (!testCasePrompt.trim() && !logPrompt.trim() && !checklistPrompt.trim() && !projectName.trim() && !projectVersion.trim() && !testResultsSummary.trim()) return;
    setIsGenerating(true);
    setStreamingText('');
    setStreamingPhase('raw');

    try {
      const getSubToolType = () => {
        if (activeTab === 'testcase') return 'test_case_generation';
        if (activeTab === 'log_analysis') return 'log_analysis';
        if (activeTab === 'checklist') return 'qa_checklist_generation';
        if (activeTab === 'report') return 'test_report_generation';
        return 'test_case_generation';
      };

      const getMetadata = () => {
        if (activeTab === 'testcase') {
          return {
            sub_tool_type: 'test_case_generation',
            test_type: testTypes.find(s => s.id === testType)?.apiType || 'manual_testing',
            priority: priorities.find(s => s.id === priority)?.apiType || 'medium',
            platform: platforms.find(s => s.id === platform)?.apiType || 'web',
            context: context
          };
        } else if (activeTab === 'log_analysis') {
          return {
            sub_tool_type: 'log_analysis',
            log_content: logPrompt
          };
        } else if (activeTab === 'checklist') {
          return {
            sub_tool_type: 'qa_checklist_generation',
            checklist_type: checklistTypes.find(s => s.id === checklistType)?.apiType || 'smoke_test',
            context: context
          };
        } else if (activeTab === 'report') {
          return {
            sub_tool_type: 'test_report_generation',
            project_name: projectName,
            project_version: projectVersion,
            test_results_summary: testResultsSummary,
            test_report_type: testReportTypes.find(s => s.id === testReportType)?.apiType || 'summary',
            context: context
          };
        }
        return {};
      };

      const sessionId = `qa_${activeTab}_${Date.now()}`;
      const userMessage = (() => {
        if (activeTab === 'log_analysis') return logPrompt;
        if (activeTab === 'checklist') return checklistPrompt;
        if (activeTab === 'report') {
          const fallback = `Generate a ${testReportTypes.find(s => s.id === testReportType)?.name || 'Test'} report${projectName ? ` for ${projectName}` : ''}${projectVersion ? ` v${projectVersion}` : ''}.`;
          return (testResultsSummary && testResultsSummary.trim().length > 0) ? testResultsSummary : fallback;
        }
        return testCasePrompt;
      })();

      setTestCases([]);
      setBugReports([]);
      setChecklist([]);
      setTestReport(null);

      const response = await fetch(import.meta.env.VITE_API_URL + '/streaming/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          tool_type: 'qa_qc',
          session_id: sessionId,
          message: userMessage,
          language: 'english',
          model: 'auto',  // Let backend handle model selection
          metadata: getMetadata()
        })
      });

      if (!response.ok) {
        // Log server details to help diagnose 422 errors
        let detail = '';
        try { detail = await response.text(); } catch {}
        throw new Error(`HTTP ${response.status}: ${response.statusText}${detail ? ` — ${detail}` : ''}`);
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
                setStreamingText(prev => prev + chunk);
              } else if (event.type === 'structured_result') {
                setStreamingPhase('complete');
                const fields = event.fields || {};

                if (activeTab === 'testcase') {
                  setTestCases(fields.test_cases || []);
                  addHistoryEntry('testcase', {
                    timestamp: new Date().toISOString(),
                    input: { prompt: testCasePrompt, testType, priority, platform },
                    response: fields.test_cases || []
                  });
                } else if (activeTab === 'log_analysis') {
                  setBugReports(fields.bug_reports || []);
                  addHistoryEntry('log_analysis', {
                    timestamp: new Date().toISOString(),
                    input: { logPrompt },
                    response: fields.bug_reports || []
                  });
                } else if (activeTab === 'checklist') {
                  setChecklist(fields.checklist || []);
                  addHistoryEntry('checklist', {
                    timestamp: new Date().toISOString(),
                    input: { prompt: checklistPrompt, checklistType },
                    response: fields.checklist || []
                  });
                } else if (activeTab === 'report') {
                  setTestReport(fields);
                  addHistoryEntry('report', {
                    timestamp: new Date().toISOString(),
                    input: { projectName, projectVersion, testReportType, testResultsSummary },
                    response: fields
                  });
                }
              } else if (event.type === 'complete') {
                console.log('Streaming completed successfully');
                setStreamingText('');
              } else if (event.type === 'error') {
                throw new Error(event.content || 'Unknown streaming error');
              }
            } catch (parseError) {
              console.error('Failed to parse SSE event:', parseError, jsonStr);
            }
          }
        }
      }

      await trackToolUsage('qa_agent', activeTab, getMetadata());
    } catch (error) {
      console.error('Error generating content:', error);
      setStreamingText('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setLogPrompt(text);
    };
    reader.readAsText(file);
  };

  const fileUploadSection = () => {
    return (
      <div className="w-full md:w-[220px] flex items-stretch">
        <label
          htmlFor="testcase-file-upload"
          className={`
            flex flex-col justify-center items-center px-4 py-4 w-full rounded-xl border-2 border-dashed cursor-pointer transition select-none
            ${resolvedTheme === 'dark'
              ? 'bg-[#121e2d] border-gray-600 hover:border-cyan-500'
              : 'bg-gray-50 border-gray-300 hover:border-cyan-500'}
          `}
          tabIndex={0}
        >
          <Upload className={`h-7 w-7 mb-1 ${resolvedTheme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`} />
          <span className={`text-sm font-medium text-center truncate ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
            {uploadedFile ? uploadedFile.name : t('qaAgentPage.uploadFile')}
          </span>
          <span className={`text-xs mt-0.5 text-center truncate ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {uploadedFile
              ? `${(uploadedFile.size / 1024).toFixed(1)} KB`
              : t('qaAgentPage.uploadSubtitle')}
          </span>
          {uploadedFile && (
            <button
              type="button"
              onClick={() => setUploadedFile(null)}
              className="mt-2 px-2 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600 transition"
            >
              {t('qaAgentPage.removeFile')}
            </button>
          )}


          <input
            id="testcase-file-upload"
            type="file"
            accept=".txt,.log,.md,.json,.csv,image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                setUploadedFile(file);

                if (file.type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    if (evt.target?.result) {
                      setImageInput(evt.target.result as string);
                      setImagePreview(evt.target.result as string);
                      setContext(evt.target.result as string);
                    }
                  };
                  reader.readAsDataURL(file);
                } else {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    if (evt.target?.result) {
                      setContext(evt.target.result as string);
                      setImageInput('');
                      setImagePreview(null);
                    }
                  };
                  reader.readAsText(file);
                }
              }
            }}
          />
        </label>
      </div>
    );
  };
  
  const renderTestCaseTab = () => (
    <div className={`space-y-6 ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
      {/* Test Case Generator */}
      <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm`}>
        <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} flex items-center`}>
            <TestTube className="h-5 w-5 mr-2 text-cyan-500" />
            {t('qaAgentPage.testCaseTab.title')}
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                {t('qaAgentPage.testCaseTab.testTypeLabel')}
              </label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  resolvedTheme === 'dark' 
                    ? 'bg-[#0F172A] border-gray-600 text-gray-100' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {testTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                {t('qaAgentPage.testCaseTab.priorityLabel')}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  resolvedTheme === 'dark' 
                    ? 'bg-[#0F172A] border-gray-600 text-gray-100' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {priorities.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                {t('qaAgentPage.testCaseTab.platformLabel')}
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  resolvedTheme === 'dark' 
                    ? 'bg-[#0F172A] border-gray-600 text-gray-100' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>


          </div>

          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* Text Area (left, main) */}
              <div className="flex-1">
                <textarea
                  value={testCasePrompt}
                  onChange={(e) => setTestCasePrompt(e.target.value)}
                  placeholder={t('qaAgentPage.testCaseTab.promptPlaceholder')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none min-h-[110px] ${
                    resolvedTheme === 'dark' 
                      ? 'bg-[#0F172A] border-gray-600 text-gray-100 placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  rows={4}
                />
              </div>
              {fileUploadSection()}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !testCasePrompt.trim()}
            className={`w-full mt-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
              resolvedTheme === 'dark'
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            <TestTube className="h-5 w-5" />
            <span>{isGenerating ? t('qaAgentPage.generating') : t('qaAgentPage.testCaseTab.generateButton')}</span>
          </button>
        </div>
      </div>

      
      {/* Export to File (Choose Format) */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-2 mb-2">
        <label className={`flex items-center text-sm font-medium gap-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('qaAgentPage.exportFormatLabel')}
          <select
            className={`border rounded-md px-2 py-1 focus:ring-cyan-500 ${
              resolvedTheme === 'dark'
                ? 'bg-[#0F172A] border-gray-600 text-gray-100'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="word">Word (.docx)</option>
          </select>
        </label>
        <button
          type="button"
          disabled={testCases.length === 0}
          onClick={async () => {
            if (testCases.length === 0) return;

            const pad2 = (n: number) => n.toString().padStart(2, '0');
            const now = new Date();
            const baseFilename = `test_cases_${now.getFullYear()}-${pad2(now.getMonth()+1)}-${pad2(now.getDate())}_${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
            let blob: Blob;
            let extension: string;

            const download = (blob: Blob, filename: string) => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            };

            if (exportFormat === 'json') {
              const dataStr = JSON.stringify(testCases, null, 2);
              blob = new Blob([dataStr], { type: 'application/json' });
              extension = 'json';
              download(blob, `${baseFilename}.${extension}`);
            } else if (exportFormat === 'csv') {
              const testCaseKeys = testCases.length > 0 ? Object.keys(testCases[0]) : [];
              const flatKeys = testCaseKeys.filter(k => k !== 'steps');
              const header = [...flatKeys, 'steps'].join(',');
              const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;
              const rows = testCases.map(tc =>
                [
                  ...flatKeys.map(key => escape(String((tc as any)[key] ?? ''))),
                  escape((tc.steps || []).join(' | '))
                ].join(',')
              );
              const csv = [header, ...rows].join('\r\n');
              blob = new Blob([csv], { type: 'text/csv' });
              extension = 'csv';
              download(blob, `${baseFilename}.${extension}`);
            } else if (exportFormat === 'word') {
              const htmlContent = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office"
                      xmlns:w="urn:schemas-microsoft-com:office:word"
                      xmlns="http://www.w3.org/TR/REC-html40">
                <head><meta charset='utf-8'></head><body>
                  <h2>Test Cases Export</h2>
                  ${testCases.map(tc => `
                    <div style="margin-bottom:1em;padding:10px 0;">
                      <b>ID:</b> ${tc.id}<br/>
                      <b>Name:</b> ${tc.name}<br/>
                      <b>Objective:</b> ${tc.objective}<br/>
                      <b>Input:</b> ${tc.input}<br/>
                      <b>Expected Output:</b> ${tc.expectedOutput}<br/>
                      <b>Steps:</b>
                      <ol>${tc.steps.map(step => `<li>${step}</li>`).join('')}</ol>
                      <b>Type:</b> ${tc.type}<br/>
                      <b>Priority:</b> ${tc.priority}<br/>
                      <b>Status:</b> ${tc.status}
                    </div>
                  `).join('')}
                </body></html>`;
              blob = new Blob([htmlContent], { type: 'application/msword' });
              extension = 'doc';
              download(blob, `${baseFilename}.${extension}`);
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            testCases.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : resolvedTheme === 'dark'
                ? 'bg-cyan-800 hover:bg-cyan-900 text-cyan-50'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white'
          }`}
          title={testCases.length === 0 ? t('qaAgentPage.exportDisabled') : t('qaAgentPage.exportBtn')}
        >
          <Download className="h-4 w-4" />
          {t('qaAgentPage.exportBtn')}
        </button>
      </div>

      {/* Streaming Display */}
      {streamingText && streamingPhase === 'raw' && testCases.length === 0 && (
        <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm`}>
          <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} flex items-center`}>
              <div className="h-5 w-5 mr-2 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-500"></div>
              </div>
              Generating Test Cases...
            </h3>
          </div>
          <div className="p-6">
            <div className={`whitespace-pre-wrap font-mono text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} max-h-96 overflow-y-auto`}>
              {streamingText}
            </div>
          </div>
        </div>
      )}
      {/* Generated Test Cases */}
      {testCases.length > 0 && (
        <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm`}>
          <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} flex items-center`}>
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Generated Test Cases ({testCases.length})
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {testCases.map((testCase) => (
                <div key={testCase.id} className={`p-4 border rounded-lg ${resolvedTheme === 'dark' ? 'bg-[#0F172A] border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{testCase.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      testCase.priority === 'high' 
                        ? 'bg-red-100 text-red-800' 
                        : testCase.priority === 'medium' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {testCase.priority}
                    </span>
                  </div>
                  <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-3`}>{testCase.objective}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-1`}>Input:</h5>
                      <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{testCase.input}</p>
                    </div>
                    <div>
                      <h5 className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-1`}>Expected Output:</h5>
                      <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{testCase.expectedOutput}</p>
                    </div>
                  </div>
                  {testCase.steps.length > 0 && (
                    <div className="mt-3">
                      <h5 className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Steps:</h5>
                      <ol className="list-decimal list-inside space-y-1">
                        {testCase.steps.map((step, index) => (
                          <li key={index} className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
   
  );

  const renderLogAnalysisTab = () => (

    <div className={`space-y-6 ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
      {/* Log Upload */}
      <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm`}>
        <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} flex items-center`}>
            <Bug className="h-5 w-5 mr-2 text-red-500" />
            {t('qaAgentPage.logAnalysisTab.title')}
          </h3>
        </div>
        
        <div className="p-6">
          <div 
            className={`border-2 border-dashed ${resolvedTheme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'} rounded-xl p-8 text-center transition-colors cursor-pointer`}
            onClick={() => fileInputRef.current?.click()}
          >
            {!uploadedFile ? (
              <>
                <Upload className={`h-12 w-12 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mx-auto mb-4`} />
                <p className={`${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} font-medium mb-2`}>{t('qaAgentPage.logAnalysisTab.uploadTitle')}</p>
                <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{t('qaAgentPage.logAnalysisTab.uploadSubtitle')}</p>
              </>
            ) : (
              <>
                <p className={`${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} font-medium mb-2`}>{t('qaAgentPage.logAnalysisTab.uploadedFile')}</p>
                <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)</p>
                <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm mt-2`}>{t('qaAgentPage.logAnalysisTab.clickToUpload')}</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".log,.txt,.json"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>
          
          <div className="mt-6">
            <textarea
              value={logPrompt}
              onChange={(e) => setLogPrompt(e.target.value)}
              placeholder={t('qaAgentPage.logAnalysisTab.pastePlaceholder')}
              className={`w-full h-32 px-4 py-3 ${resolvedTheme === 'dark' ? 'bg-[#0F172A] border-gray-600 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none font-mono text-sm`}
            />
          </div>
          
          <button 
            onClick={handleGenerate}
            disabled={!logPrompt.trim() || isGenerating}
            className="w-full mt-4 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Bug className="h-5 w-5" />
            <span>{isGenerating ? t('qaAgentPage.generating') : t('qaAgentPage.logAnalysisTab.analyzeButton')}</span>
          </button>
        </div>
      </div>

      {/* Generated Bug Reports */}
      {/* Streaming Display for Log Analysis */}
      {streamingText && streamingPhase === 'raw' && bugReports.length === 0 && activeTab === 'log_analysis' && (
        <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm`}>
          <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} flex items-center`}>
              <div className="h-5 w-5 mr-2 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
              </div>
              Analyzing Logs...
            </h3>
          </div>
          <div className="p-6">
            <div className={`whitespace-pre-wrap font-mono text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} max-h-96 overflow-y-auto`}>
              {streamingText}
            </div>
          </div>
        </div>
      )}
      {bugReports.length > 0 && (
        <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm`}>
          <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} flex items-center`}>
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              {t('qaAgentPage.logAnalysisTab.reportTitle')} ({bugReports.length} found)
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {bugReports.map((report) => (
                <div key={report.id} className={`p-4 border rounded-lg ${resolvedTheme === 'dark' ? 'bg-[#0F172A] border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{report.title}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      report.severity === 'high' 
                        ? 'bg-red-100 text-red-800' 
                        : report.severity === 'medium' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {report.severity}
                    </span>
                  </div>
                  <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-3`}>{report.description}</p>
                  {report.steps.length > 0 && (
                    <div className="mb-3">
                      <h5 className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>{t('qaAgentPage.logAnalysisTab.stepsToReproduce')}</h5>
                      <ol className="list-decimal list-inside space-y-1">
                        {report.steps.map((step, index) => (
                          <li key={index} className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs">
                    <span className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('qaAgentPage.logAnalysisTab.environment')}: {report.environment}</span>
                    <span className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{report.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
   
  );

  const renderReportTab = () => (
    <div className="space-y-6">
      <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm`}>
        <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} flex items-center`}>
            <FileText className="h-5 w-5 mr-2 text-blue-500" />
            {t('qaAgentPage.reportTab.title')}
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input type="text" placeholder={t('qaAgentPage.reportTab.projectPlaceholder')} className={`w-full px-3 py-2 ${resolvedTheme === 'dark' ? 'bg-[#0F172A] border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <input type="text" placeholder={t('qaAgentPage.reportTab.versionPlaceholder')} className={`w-full px-3 py-2 ${resolvedTheme === 'dark' ? 'bg-[#0F172A] border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              value={projectVersion}
              onChange={(e) => setProjectVersion(e.target.value)}
            />
          </div>
          <select 
            value={testReportType}
            onChange={(e) => setTestReportType(e.target.value)}
            className={`w-full px-3 py-2 ${resolvedTheme === 'dark' ? 'bg-[#0F172A] border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4`}
          >
            {testReportTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* Text Area (left, main) */}
              <div className="flex-1">
                <textarea
                  placeholder={t('qaAgentPage.reportTab.summaryPlaceholder')}
                  className={`w-full h-24 px-4 py-3 ${resolvedTheme === 'dark' ? 'bg-[#0F172A] border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                  value={testResultsSummary}
                  onChange={(e) => setTestResultsSummary(e.target.value)}
                  rows={4}
                />
              </div>
              {fileUploadSection()}
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={(!projectName.trim() && !projectVersion.trim() && !testResultsSummary.trim()) || isGenerating}
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                <span>{t('qaAgentPage.reportTab.generating')}</span>
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 mr-2" />
                <span>{t('qaAgentPage.reportTab.generateButton')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-end gap-2 mb-2">
        <label className={`flex items-center text-sm font-medium gap-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('qaAgentPage.exportFormatLabel')}
          <select
            className={`border rounded-md px-2 py-1 focus:ring-blue-500 ${
              resolvedTheme === 'dark'
                ? 'bg-[#0F172A] border-gray-600 text-gray-100'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="word">Word (.doc)</option>
          </select>
        </label>
        <button
          type="button"
          disabled={!testReport}
          onClick={async () => {
            if (!testReport) return;

            const pad2 = (n: number) => n.toString().padStart(2, '0');
            const now = new Date();
            const baseFilename = `test_report_${now.getFullYear()}-${pad2(now.getMonth()+1)}-${pad2(now.getDate())}_${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
            let blob: Blob;
            let extension: string;

            const download = (blob: Blob, filename: string) => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            };

            if (exportFormat === 'json') {
              const dataStr = JSON.stringify(testReport, null, 2);
              blob = new Blob([dataStr], { type: 'application/json' });
              extension = 'json';
              download(blob, `${baseFilename}.${extension}`);
            } else if (exportFormat === 'csv') {
              let csvArr: string[] = [];
              csvArr.push([
                'Project Name', 
                'Project Version', 
                'Report Type', 
                'Conclusion', 
                'Recommendations'
              ].join(','));
              csvArr.push([
                `"${testReport.project_name || ''}"`,
                `"${testReport.project_version || ''}"`,
                `"${testReport.test_report_type || ''}"`,
                `"${(testReport.conclusion || '').replace(/"/g, '""')}"`,
                `"${(testReport.recommendations || []).join(' | ').replace(/"/g, '""')}"`
              ].join(','));

              if (testReport.test_results && testReport.test_results.length > 0) {
                csvArr.push('\nTest Results:');
                csvArr.push(['ID', 'Name', 'Status', 'Error'].join(','));
                testReport.test_results.forEach(res => {
                  csvArr.push([
                    `"${res.id || ''}"`,
                    `"${res.name || ''}"`,
                    `"${res.status || ''}"`,
                    `"${(res.error || '').replace(/"/g, '""')}"`
                  ].join(','));
                });
              }
              const csv = csvArr.join('\r\n');
              blob = new Blob([csv], { type: 'text/csv' });
              extension = 'csv';
              download(blob, `${baseFilename}.${extension}`);
            } else if (exportFormat === 'word') {
              // Generate a valid HTML file for .doc (Word)
              // Use a minimal valid HTML structure and set mime-type to 'application/msword'
              // Use UTF-8 BOM for best compatibility
              const wordHtml =
                `<!DOCTYPE html>
                <html xmlns:o="urn:schemas-microsoft-com:office:office"
                      xmlns:w="urn:schemas-microsoft-com:office:word"
                      xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                  <meta charset="utf-8">
                  <!--[if gte mso 9]><xml>
                    <w:WordDocument>
                      <w:View>Print</w:View>
                      <w:Zoom>100</w:Zoom>
                      <w:DoNotOptimizeForBrowser/>
                    </w:WordDocument>
                  </xml><![endif]-->
                  <title>${testReport.project_name} Test Report</title>
                  <style>
                    body { font-family: Arial, sans-serif; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #444; padding: 8px; }
                    th { background: #e0e7ef; }
                    h2 { color: #2563eb; }
                  </style>
                </head>
                <body>
                  <h2>${testReport.project_name}</h2>
                  <p><strong>Version:</strong> ${testReport.project_version}</p>
                  <p><strong>Report Type:</strong> ${testReport.test_report_type}</p>
                  <p><strong>Conclusion:</strong> ${testReport.conclusion}</p>
                  <p><strong>Recommendations:</strong></p>
                  <ul>
                    ${(testReport.recommendations || []).map(rec => `<li>${rec}</li>`).join('')}
                  </ul>
                  ${
                    testReport.test_results && testReport.test_results.length > 0
                      ? `
                      <h3>Test Results</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${testReport.test_results.map(res => `
                            <tr>
                              <td>${res.id}</td>
                              <td>${res.name}</td>
                              <td>${res.status}</td>
                              <td>${res.error || ''}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                      `
                      : ''
                  }
                </body>
                </html>`;
              // Prepend BOM for proper UTF-8
              const utf8BOM = '\uFEFF';
              blob = new Blob([utf8BOM + wordHtml], { type: 'application/msword' });
              extension = 'doc';
              download(blob, `${baseFilename}.${extension}`);
            }
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="h-5 w-5" />
          {t('qaAgentPage.exportBtn')}
        </button>
      </div>

      {/* Streaming Display for Test Report */}
      {streamingText && streamingPhase === 'raw' && !testReport && activeTab === 'report' && (
        <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm`}>
          <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} flex items-center`}>
              <div className="h-5 w-5 mr-2 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
              </div>
              Generating Test Report...
            </h3>
          </div>
          <div className="p-6">
            <div className={`whitespace-pre-wrap font-mono text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} max-h-96 overflow-y-auto`}>
              {streamingText}
            </div>
          </div>
        </div>
      )}
      {testReport && (
        <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm`}>
          <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} flex items-center`}>
                <BarChart3 className="h-5 w-5 mr-2 text-green-500" />
                {t('qaAgentPage.reportTab.title')}: {testReport.project_name}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${resolvedTheme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'}`}>
                {testReport.project_version}
              </span>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Report Type */}
            <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-blue-900/20 border-blue-800/30' : 'bg-blue-50 border-blue-200'} border`}>
              <h4 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-800'} mb-2`}>{t('qaAgentPage.reportTab.reportType')}</h4>
              <p className={`${resolvedTheme === 'dark' ? 'text-blue-300' : 'text-blue-700'} capitalize`}>{testReport.test_report_type.replace('_', ' ')}</p>
            </div>

            {/* Test Results */}
            {testReport.test_results && testReport.test_results.length > 0 && (
              <div>
                <h4 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-4 flex items-center`}>
                  <Target className="h-4 w-4 mr-2 text-purple-500" />
                  {t('qaAgentPage.reportTab.testResults')}
                </h4>
                <div className="space-y-3">
                  {testReport.test_results.map((result) => (
                    <div key={result.id} className={`p-4 border rounded-lg ${resolvedTheme === 'dark' ? 'bg-[#0F172A] border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <h5 className={`font-medium ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{result.name}</h5>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          result.status === 'passed' 
                            ? resolvedTheme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
                            : result.status === 'failed'
                            ? resolvedTheme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'
                            : resolvedTheme === 'dark' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {result.status}
                        </span>
                      </div>
                      {result.error && (
                        <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'} mt-2`}>{result.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conclusion */}
            {testReport.conclusion && (
              <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-indigo-900/20 border-indigo-800/30' : 'bg-indigo-50 border-indigo-200'} border`}>
                <h4 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-indigo-400' : 'text-indigo-800'} mb-2 flex items-center`}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {t('qaAgentPage.reportTab.conclusion')}
                </h4>
                <p className={`${resolvedTheme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>{testReport.conclusion}</p>
              </div>
            )}

            {/* Recommendations */}
            {testReport.recommendations && testReport.recommendations.length > 0 && (
              <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-orange-900/20 border-orange-800/30' : 'bg-orange-50 border-orange-200'} border`}>
                <h4 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-orange-400' : 'text-orange-800'} mb-3 flex items-center`}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {t('qaAgentPage.reportTab.recommendations')}
                </h4>
                <ul className="space-y-2">
                  {testReport.recommendations.map((rec, index) => (
                    <li key={index} className={`flex items-start ${resolvedTheme === 'dark' ? 'text-orange-300' : 'text-orange-700'}`}>
                      <span className="mr-2">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

  );

  const renderChecklistTab = () => (

    <div className={`space-y-6 ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
      <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm`}>
        <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} flex items-center`}>
            <CheckSquare className="h-5 w-5 mr-2 text-emerald-500" />
            {t('qaAgentPage.checklistTab.title')}
          </h3>
        </div>
        
        <div className="p-6">
          <select 
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4 ${
              resolvedTheme === 'dark' 
                ? 'bg-[#0F172A] border-gray-600 text-gray-100' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            value={checklistType}
            onChange={(e) => setChecklistType(e.target.value)}
          >
            {checklistTypes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <textarea
                placeholder={t('qaAgentPage.checklistTab.promptPlaceholder')}
                value={checklistPrompt}
                onChange={(e) => setChecklistPrompt(e.target.value)}
                className={`w-full h-24 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none ${
                  resolvedTheme === 'dark' 
                    ? 'bg-[#0F172A] border-gray-600 text-gray-100 placeholder-gray-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                rows={4}
              />
              {fileUploadSection()}
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={!checklistPrompt.trim() || isGenerating}
            className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <CheckSquare className="h-5 w-5" />
            <span>{isGenerating ? 'Generating...' : t('qaAgentPage.checklistTab.generateButton')}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-end gap-2 mb-2">
        <label className={`flex items-center text-sm font-medium gap-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('qaAgentPage.exportFormatLabel')}
          <select
            className={`border rounded-md px-2 py-1 focus:ring-emerald-500 ${
              resolvedTheme === 'dark'
                ? 'bg-[#0F172A] border-gray-600 text-gray-100'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="word">Word (.doc)</option>
          </select>
        </label>
        <button
          type="button"
          disabled={checklist.length === 0}
          onClick={async () => {
            if (checklist.length === 0) return;

            const pad2 = (n: number) => n.toString().padStart(2, '0');
            const now = new Date();
            const baseFilename = `checklist_${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}_${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
            let blob: Blob;
            let extension: string;

            const download = (blob: Blob, filename: string) => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            };

            if (exportFormat === 'json') {
              const dataStr = JSON.stringify(checklist, null, 2);
              blob = new Blob([dataStr], { type: 'application/json' });
              extension = 'json';
              download(blob, `${baseFilename}.${extension}`);
            } else if (exportFormat === 'csv') {
              // Single column CSV
              const header = 'Checklist Item';
              const rows = checklist.map(item => `"${item.replace(/"/g, '""')}"`);
              const csv = [header, ...rows].join('\r\n');
              blob = new Blob([csv], { type: 'text/csv' });
              extension = 'csv';
              download(blob, `${baseFilename}.${extension}`);
            } else if (exportFormat === 'word') {
              // Minimal HTML for checklist export
              const wordHtml = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                  <meta charset="utf-8">
                  <title>Checklist Export</title>
                  <style>
                    body { font-family: Arial, sans-serif; }
                    h2 { color: #059669; }
                    ul { list-style-type: disc; }
                    li { margin-bottom: 8px; }
                  </style>
                </head>
                <body>
                  <h2>Checklist</h2>
                  <ul>
                    ${(checklist || []).map(item => `<li>${item}</li>`).join('')}
                  </ul>
                </body>
                </html>`;
              const utf8BOM = '\uFEFF';
              blob = new Blob([utf8BOM + wordHtml], { type: 'application/msword' });
              extension = 'doc';
              download(blob, `${baseFilename}.${extension}`);
            }
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="h-5 w-5" />
          {t('qaAgentPage.exportBtn')}
        </button>
      </div>

      {/* Generated Checklist */}
      {/* Streaming Display for Checklist */}
      {streamingText && streamingPhase === 'raw' && checklist.length === 0 && activeTab === 'checklist' && (
        <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm`}>
          <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} flex items-center`}>
              <div className="h-5 w-5 mr-2 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
              Generating Checklist...
            </h3>
          </div>
          <div className="p-6">
            <div className={`whitespace-pre-wrap font-mono text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} max-h-96 overflow-y-auto`}>
              {streamingText}
            </div>
          </div>
        </div>
      )}
      {checklist.length > 0 && (
        <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-sm`}>
          <div className={`p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} flex items-center`}>
              <List className="h-5 w-5 mr-2 text-emerald-500" />
              Generated Checklist ({checklist.length} items)
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {checklist.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <span className={`flex-1 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'testcase':
        return renderTestCaseTab();
      case 'log_analysis':
        return renderLogAnalysisTab();
      case 'report':
        return renderReportTab();
      case 'checklist':
        return renderChecklistTab();
      default:
        return null;
    }
  };

  return (
<div className={`flex min-h-screen ${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
      {/* Left Sidebar */}
      <div className={`w-1/4 max-w-xs ${resolvedTheme === 'dark' ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-200'} border-r p-6 flex flex-col space-y-6`}>
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className={`p-2 ${resolvedTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-full`}>
            <ArrowLeft className={`h-5 w-5 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
          <h1 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{t('qaAgentPage.title')}</h1>
        </div>
        
        <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('qaAgentPage.description')}
        </p>

        <div>
          <h2 className={`text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'} uppercase tracking-wider mb-3`}>{t('qaAgentPage.toolsTitle')}</h2>
          <div className="space-y-2">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTab(tool.id)}
                className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                  activeTab === tool.id
                    ? resolvedTheme === 'dark' 
                      ? 'bg-cyan-900/30 text-cyan-300 font-semibold' 
                      : 'bg-cyan-50 text-cyan-700 font-semibold'
                    : resolvedTheme === 'dark'
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <tool.icon className={`h-5 w-5 mr-3 ${tool.color}`} />
                <span>{tool.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className={`text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'} uppercase tracking-wider mb-3`}>{t('qaAgentPage.suggestionsTitle')}</h2>
          <div className="space-y-2">
            {promptSuggestions.slice(0, 3).map((s, i) => (
              <button 
                key={i}
                onClick={() => setTestCasePrompt(s)}
                className={`w-full text-left p-3 ${resolvedTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-lg text-sm transition-colors`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

      {/* Tool History (Sidebar) */}
      {activeTab && toolHistory[activeTab as keyof typeof toolHistory] && toolHistory[activeTab as keyof typeof toolHistory].length > 0 && (
        <div className="mt-6">
          <h2 className={`text-sm font-semibold ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'} uppercase tracking-wider mb-3`}>
            {t('qaAgentPage.historyTab.title') || 'History'}
          </h2>
          <div className={`
            max-h-56 overflow-y-auto
            space-y-3
            bg-transparent
          `}>
            {(toolHistory[activeTab as keyof typeof toolHistory] as any[]).map((entry, idx) => {
              let mainLine: string = '';
              let meta: React.ReactNode = null;

              if (activeTab === "testcase") {
                mainLine = entry.input.prompt?.substring(0, 60) + (entry.input.prompt?.length > 60 ? '...' : '');
                meta = (
                  <div className={`mt-1 flex flex-wrap gap-2 text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>{t('qaAgentPage.testCaseTab.testTypeLabel')}: {testTypes.find(t => t.id === entry.input.testType)?.name || entry.input.testType}</span>
                    <span>{t('qaAgentPage.testCaseTab.priorityLabel')}: {priorities.find(p => p.id === entry.input.priority)?.name || entry.input.priority}</span>
                    <span>{t('qaAgentPage.testCaseTab.platformLabel')}: {platforms.find(pl => pl.id === entry.input.platform)?.name || entry.input.platform}</span>
                  </div>
                );
              } else if (activeTab === "report") {
                mainLine = entry.input.projectName || '';
                meta = (
                  <div className={`mt-1 flex flex-wrap gap-2 text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>{t('qaAgentPage.reportTab.reportType') || 'Type'}: {testReportTypes.find(t => t.id === entry.input.testReportType)?.name || entry.input.testReportType}</span>
                    <span>{t('qaAgentPage.reportTab.versionPlaceholder') || 'Version'}: {entry.input.projectVersion || '-'}</span>
                  </div>
                );
              } else if (activeTab === "log_analysis") {
                mainLine = entry.input.logPrompt?.substring(0, 60) + (entry.input.logPrompt?.length > 60 ? '...' : '') || (entry.input.fileName ?? 'Log');
                meta = (
                  <div className={`mt-1 flex flex-wrap gap-2 text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>{entry.input.fileName ? t('qaAgentPage.logAnalysisTab.uploadedFile') + ': ' + entry.input.fileName : t('qaAgentPage.logAnalysisTab.fromPrompt')}</span>
                    <span>{t('qaAgentPage.logAnalysisTab.bugsFound')}: {Array.isArray(entry.response) ? entry.response.length : 0}</span>
                  </div>
                );

              } else if (activeTab === "checklist") {
                // The history entry for checklist may have input.prompt (current) or input.checklistPrompt (legacy); fallback as needed
                const promptValue = entry.input.prompt ?? entry.input.checklistPrompt ?? '';
                mainLine = promptValue.substring(0, 60) + (promptValue.length > 60 ? '...' : '');
                meta = (
                  <div className={`mt-1 flex flex-wrap gap-2 text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>
                      {t('qaAgentPage.checklistTab.typeLabel') || 'Type'}: {checklistTypes.find(c => c.id === entry.input.checklistType)?.name || entry.input.checklistType}
                    </span>
                    <span>
                      {t('qaAgentPage.checklistTab.itemsCount') || 'Items'}: {Array.isArray(entry.response) ? entry.response.length : 0}
                    </span>
                  </div>
                );
              } else if (activeTab === "checklist") {
                mainLine = entry.input.checklistPrompt?.substring(0, 60) + (entry.input.checklistPrompt?.length > 60 ? '...' : '');
                meta = (
                  <div className={`mt-1 flex flex-wrap gap-2 text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>{t('qaAgentPage.checklistTab.typeLabel') || 'Type'}: {checklistTypes.find(c => c.id === entry.input.checklistType)?.name || entry.input.checklistType}</span>
                    <span>{t('qaAgentPage.checklistTab.itemsCount') || 'Items'}: {Array.isArray(entry.response) ? entry.response.length : 0}</span>
                  </div>
                );
              }

              return (
                <button
                  key={entry.timestamp}
                  type="button"
                  className={`
                    w-full flex flex-col text-left px-4 py-3 transition
                    border
                    rounded-xl
                    shadow-sm
                    ${resolvedTheme === 'dark'
                      ? 'border-gray-700 bg-gray-700 hover:bg-gray-600'
                      : 'border-gray-200 hover:bg-gray-100'
                    }
                    focus:outline-none
                  `}
                  style={{
                    // Very subtle shadow and visual separation
                    boxShadow: resolvedTheme === 'dark'
                      ? '0 1px 2px 0 rgba(0,0,0,0.23)'
                      : '0 1px 2px 0 rgba(0,0,0,0.03)'
                  }}
                  onClick={() => {
                    if (activeTab === "testcase") {
                      setTestCasePrompt(entry.input.prompt);
                      setTestType(entry.input.testType);
                      setPriority(entry.input.priority);
                      setPlatform(entry.input.platform);
                      setTestCases(Array.isArray(entry.response) ? entry.response : []);
                    } else if (activeTab === "report") {
                      setProjectName(entry.input.projectName);
                      setProjectVersion(entry.input.projectVersion);
                      setTestReportType(entry.input.testReportType);
                      setTestResultsSummary(entry.input.testResultsSummary);
                      setTestReport(entry.response && typeof entry.response === "object" && !Array.isArray(entry.response) ? entry.response : null);
                    } else if (activeTab === "log_analysis") {
                      setLogPrompt(entry.input.logPrompt);
                      setUploadedFile(null);
                      setBugReports(Array.isArray(entry.response) ? entry.response : []);
                    } else if (activeTab === "checklist") {
                      // There is a small problem: the code is using 'checklistPrompt' as the key for the prompt in history entry,
                      // but when adding to history (see the addHistoryEntry('checklist', ...)), the input is saved as {prompt: checklistPrompt, ...}.
                      // So here, 'entry.input.checklistPrompt' will be undefined.
                      // Instead, it should use 'entry.input.prompt'.
                      // The correct code would be:
                      setChecklistPrompt(entry.input.prompt);
                      //setChecklistPrompt(entry.input.checklistPrompt);
                      setChecklistType(entry.input.checklistType);
                      setChecklist(Array.isArray(entry.response) ? entry.response : []);
                    }
                  }}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className={`truncate text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{mainLine}</span>
                    <span className={`text-xs ml-2 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {meta}
                </button>
              );
            })}
          </div>
        </div>
      )}

        
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} p-6`}>
        {renderContent()}
      </div>
    </div>
  );
};

export default QAAgentPage;
