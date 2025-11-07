import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Database, 
  BarChart3, 
  FileText, 
  PieChart,
  CheckCircle,
  Upload,
  X,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AgentConfigPanel from './ui/AgentConfigPanel';
import { useTheme } from '../contexts/ThemeContext';
import AgentMainContent from './ui/AgentMainContent';
import AgentHeader from './ui/AgentHeader';
import { trackToolUsage } from './tracking/tracker';

const DataAgentPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('sql');
  const { t, language: uiLanguage } = useLanguage();
  const labels = (t('dataAgent.config.labels') as any) || {};
  const opt = (t('dataAgent.config.options') as any) || {};
  const [isGenerating, setIsGenerating] = useState(false);
  // Options state for generator section
  const [dbType, setDbType] = useState('postgres');
  const [taskPrompt, setTaskPrompt] = useState('');
  const [language, setLanguage] = useState<'en' | 'vi'>(uiLanguage);
  const [imageInput, setImageInput] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sqlToolResponse, setSqlToolResponse] = useState<any>(null);
  const [dataAnalysisResponse, setDataAnalysisResponse] = useState<any>(null);
  const [reportToolResponse, setReportToolResponse] = useState<any>(null);
  const [experimentDesignResponse, setExperimentDesignResponse] = useState<any>(null);
  const [targetAudience, setTargetAudience] = useState('executive');

  // Streaming state - show real-time progress
  const [streamingText, setStreamingText] = useState('');
  const [streamingPhase, setStreamingPhase] = useState<'raw' | 'complete'>('raw');
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

  const config = {
    sql: [
      { id: 'dbType', label: labels.dbType || 'DB Type', value: dbType, onChange: setDbType, options: [
        { label: opt?.dbType?.postgres || 'PostgreSQL', value: 'postgres' },
        { label: opt?.dbType?.mysql || 'MySQL', value: 'mysql' },
        { label: opt?.dbType?.mssql || 'SQL Server', value: 'mssql' },
        { label: opt?.dbType?.bigquery || 'BigQuery', value: 'bigquery' },
      ]},
      { id: 'lang', label: labels.language || 'Language', value: language, onChange: setLanguage, options: languageOptions },
    ],
    analysis: [
      { id: 'lang', label: labels.language || 'Language', value: language, onChange: setLanguage, options: languageOptions },
    ],
    report: [
      { id: 'targetAudience', label: labels.targetAudience || 'Target Audience', value: targetAudience, onChange: setTargetAudience, options: [
        { label: opt?.targetAudience?.executive || 'Executive', value: 'executive' },
        { label: opt?.targetAudience?.technical || 'Technical', value: 'technical' },
        { label: opt?.targetAudience?.customer || 'Customer', value: 'customer' },
      ]},
      { id: 'lang', label: labels.language || 'Language', value: language, onChange: setLanguage, options: languageOptions },
    ],
    experiment: [
      { id: 'lang', label: labels.language || 'Language', value: language, onChange: setLanguage, options: languageOptions },
    ],
  };
  
  const toolSelects = config[activeTab as keyof typeof config] || [];

  const promptSuggestionsByTab = {
    sql: [
      'Write query to find top 10 customers by revenue this year',
      'Create SQL to calculate monthly recurring revenue growth',
      'Generate query to identify inactive users in last 30 days',
      'Write JOIN query to analyze product sales by category',
      'Create query to calculate customer lifetime value'
    ],
    analysis: [
      'Analyze sales performance trends from this chart',
      'Identify patterns and anomalies in the data',
      'Compare revenue distribution across regions',
      'Summarize key insights from customer behavior data',
      'Extract metrics and KPIs from dashboard screenshot'
    ],
    report: [
      'Create executive summary of Q4 sales performance',
      'Generate monthly business review for stakeholders',
      'Prepare customer acquisition cost analysis report',
      'Write product performance dashboard summary',
      'Create data-driven marketing campaign effectiveness report'
    ],
    experiment: [
      'Design A/B test for new checkout flow',
      'Plan experiment to measure feature adoption rate',
      'Create hypothesis for pricing strategy test',
      'Design user engagement experiment framework',
      'Plan conversion rate optimization experiment'
    ]
  };

  const promptSuggestions = promptSuggestionsByTab[activeTab as keyof typeof promptSuggestionsByTab] || [];

  const handleSuggestionClick = (s: string) => setTaskPrompt(s);

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
    if (!taskPrompt.trim()) return;
    setIsGenerating(true);
    setStreamingText(''); // Reset streaming text
    setStreamingPhase('raw'); // Start with raw phase

    try {
      // Build metadata based on active tool
      const getMetadata = () => {
        switch (activeTab) {
          case 'sql':
            return { sub_tool_type: 'write_sql', dbType };
          case 'analysis':
            return { sub_tool_type: 'data_analysis', image_input: imagePreview };
          case 'report':
            return { sub_tool_type: 'create_report', target_audience: targetAudience };
          case 'experiment':
            return { sub_tool_type: 'experiment_design' };
          default:
            return { sub_tool_type: 'write_sql' };
        }
      };

      // Generate session ID
      const sessionId = `data_${activeTab}_${Date.now()}`;

      // Reset responses at start
      setSqlToolResponse(null);
      setDataAnalysisResponse(null);
      setReportToolResponse(null);
      setExperimentDesignResponse(null);

      // Use streaming endpoint
      const response = await fetch(import.meta.env.VITE_API_URL + '/streaming/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          tool_type: 'data',
          session_id: sessionId,
          message: taskPrompt,
          language: language,
          metadata: getMetadata()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Read streaming response
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

        // Keep last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);

            try {
              const event = JSON.parse(jsonStr);

              if (event.type === 'assistant_chunk') {
                // Show raw text chunks in real-time
                const chunk = event.content || '';
                setStreamingText(prev => prev + chunk);
              } else if (event.type === 'structured_result') {
                // Structured result arrived - switch phase
                setStreamingPhase('complete');
                const fields = event.fields || {};

                if (activeTab === 'sql') {
                  setSqlToolResponse(fields);
                } else if (activeTab === 'analysis') {
                  setDataAnalysisResponse(fields);
                } else if (activeTab === 'report') {
                  setReportToolResponse(fields);
                } else if (activeTab === 'experiment') {
                  setExperimentDesignResponse(fields);
                }
              } else if (event.type === 'complete') {
                // Final completion
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

      // Track tool usage
      await trackToolUsage('data_agent', activeTab, getMetadata());
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderSQLResult = (response: any) => {
    if (!response) return null;

    return (
      <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm p-6 space-y-6`}>
        <h3 className={`text-xl font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
          SQL Query Result
        </h3>
        
        <div className="space-y-2">
          <h4 className={`font-medium ${resolvedTheme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
            Generated Query
          </h4>
          <div className={`${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
            <pre className={`text-sm font-mono ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap overflow-x-auto`}>
              {response.query}
            </pre>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className={`font-medium ${resolvedTheme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
            Explanation
          </h4>
          <div className={`${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
            <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
              {response.explanation}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderDataAnalysis = (response: any) => {
    if (!response) return null;

    return (
      <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm p-6 space-y-6`}>
        <h3 className={`text-xl font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
          Data Analysis Result
        </h3>
        
        <div className="space-y-2">
          <h4 className={`font-medium ${resolvedTheme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
            Summary
          </h4>
          <div className={`${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
            <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
              {response.summary}
            </p>
          </div>
        </div>

        {response.key_insights && response.key_insights.length > 0 && (
          <div className="space-y-2">
            <h4 className={`font-medium ${resolvedTheme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
              Key Insights
            </h4>
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
              <ul className="list-disc list-inside space-y-2">
                {response.key_insights.map((insight: string, index: number) => (
                  <li key={index} className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {response.statistics && response.statistics.length > 0 && (
          <div className="space-y-2">
            <h4 className={`font-medium ${resolvedTheme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
              Statistics
            </h4>
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
              <ul className="list-disc list-inside space-y-2">
                {response.statistics.map((stat: string, index: number) => (
                  <li key={index} className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {stat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {response.anomalies && response.anomalies.length > 0 && (
          <div className="space-y-2">
            <h4 className={`font-medium ${resolvedTheme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
              Anomalies
            </h4>
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
              <ul className="list-disc list-inside space-y-2">
                {response.anomalies.map((anomaly: string, index: number) => (
                  <li key={index} className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {anomaly}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {response.recommendations && response.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className={`font-medium ${resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
              Recommendations
            </h4>
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
              <ul className="list-disc list-inside space-y-2">
                {response.recommendations.map((recommendation: string, index: number) => (
                  <li key={index} className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReportResponse = (response: any) => {
    return (
      <div className={`space-y-6 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-6`}>
        {/* Executive Summary */}
        <div className="space-y-3">
          <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
            Executive Summary
          </h3>
          <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
            {response.executive_summary}
          </p>
        </div>

        {/* Report Sections */}
        {response.sections && response.sections.length > 0 && (
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              Report Details
            </h3>
            <div className="space-y-4">
              {response.sections.map((section: any, index: number) => (
                <div key={index} className={`${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
                  <h4 className={`font-medium mb-3 ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                    {section.title}
                  </h4>
                  <ul className="list-disc list-inside space-y-2">
                    {section.content.map((item: string, itemIndex: number) => (
                      <li key={itemIndex} className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conclusion */}
        <div className="space-y-3">
          <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
            Conclusion
          </h3>
          <div className={`${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
            <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
              {response.conclusion}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderExperimentDesignResult = (response: any) => {
    if (!response) return null;

    return (
      <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm p-6 space-y-6`}>
        <h3 className={`text-xl font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
          Experiment Design Result
        </h3>
        
        {/* Hypothesis */}
        <div className="space-y-2">
          <h4 className={`font-medium ${resolvedTheme === 'dark' ? 'text-violet-400' : 'text-violet-600'}`}>
            Hypothesis
          </h4>
          <div className={`${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
            <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
              {response.hypothesis}
            </p>
          </div>
        </div>

        {/* Experiment Setup */}
        <div className="space-y-2">
          <h4 className={`font-medium ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
            Experiment Setup
          </h4>
          <div className={`${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
            <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
              {response.experiment_setup}
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-3">
          <h4 className={`font-medium ${resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
            Key Metrics
          </h4>
          <div className={`${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
            <ul className="space-y-2">
              {response.metrics.map((metric: string, index: number) => (
                <li key={index} className={`flex items-start space-x-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${resolvedTheme === 'dark' ? 'bg-green-400' : 'bg-green-500'} mt-2 flex-shrink-0`} />
                  <span>{metric}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sample Size Considerations */}
        {response.sample_size_considerations && (
          <div className="space-y-2">
            <h4 className={`font-medium ${resolvedTheme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
              Sample Size Considerations
            </h4>
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
              <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                {response.sample_size_considerations}
              </p>
            </div>
          </div>
        )}

        {/* Risks */}
        {response.risks && response.risks.length > 0 && (
          <div className="space-y-3">
            <h4 className={`font-medium ${resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
              Risks & Considerations
            </h4>
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
              <ul className="space-y-2">
                {response.risks.map((risk: string, index: number) => (
                  <li key={index} className={`flex items-start space-x-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${resolvedTheme === 'dark' ? 'bg-red-400' : 'bg-red-500'} mt-2 flex-shrink-0`} />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Next Steps */}
        {response.next_steps && response.next_steps.length > 0 && (
          <div className="space-y-3">
            <h4 className={`font-medium ${resolvedTheme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
              Next Steps
            </h4>
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
              <ul className="space-y-2">
                {response.next_steps.map((step: string, index: number) => (
                  <li key={index} className={`flex items-start space-x-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${resolvedTheme === 'dark' ? 'bg-purple-400' : 'bg-purple-500'} mt-2 flex-shrink-0`} />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  const tools = [
    { id: 'sql', name: t('dataAgent.tools.writeSql'), icon: Database, color: 'text-violet-600' },
    { id: 'analysis', name: t('dataAgent.tools.dataAnalysis'), icon: BarChart3, color: 'text-blue-600' },
    { id: 'report', name: t('dataAgent.tools.createReport'), icon: FileText, color: 'text-green-600' },
    { id: 'experiment', name: t('dataAgent.tools.experimentDesign'), icon: PieChart, color: 'text-orange-600' }
  ];

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-[#0B172A]' : 'bg-gray-50'}`}>
      {/* Header */}
      <AgentHeader
        icon={<Database />}
        title={t('dataAgent.title')}
        subtitle={t('dataAgent.subtitle')}
        tags={[{ icon: <CheckCircle />, label: t('dataAgent.aiReady'), properties: 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200' }, { icon: <Database />, label: t('dataAgent.dataMode'), properties: 'bg-violet-100 text-violet-800 px-3 py-1 rounded-full text-sm font-medium border border-violet-200' }]}
        onBack={onBack}
      />

      <AgentMainContent
        toolsTitle={t('dataAgent.selectTool')}
        tools={tools}
        activeTab={activeTab}
        toolOnClick={setActiveTab}
        streamingZone={null}
        configPanel={
          <AgentConfigPanel
            isGenerating={isGenerating}
            layout={'split'}
            rightNode={activeTab !== 'analysis' ? (
              <div>
                <h4 className="text-sm font-semibold mb-2">{labels.previewTitle || 'Query preview'}</h4>
                <pre className="text-xs whitespace-pre-wrap">{`DB: ${dbType}\nLang: ${languageLabel}`}</pre>
              </div>
            ) : undefined}
            selectFields={toolSelects}
            textarea={activeTab !== 'analysis' ? {
              label: labels.prompt || 'Describe the data task',
              value: taskPrompt,
              onChange: setTaskPrompt,
              placeholder: 'e.g., Top 10 products by revenue 2024 including category and margin'
            } : undefined}
            suggestions={activeTab !== 'analysis' ? promptSuggestions : []}
            onSuggestionClick={activeTab !== 'analysis' ? handleSuggestionClick : () => {}}
            onGenerate={handleGenerate}
            generateButtonLabel={isGenerating ? 'Generating...' : 'Generate'}
            accentButtonClass={'bg-violet-600 hover:bg-violet-700'}
          />
        }
        uploadZone={activeTab === 'analysis' ? (
          <div className={`mt-6 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-6`}>
            <h4 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'} mb-6 flex items-center`}>
              <BarChart3 className="h-5 w-5 mr-2 text-violet-600" />
              Data Analysis Configuration
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
                      <p className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Click to upload image</p>
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
                    {labels.imageInput || 'Image Input'}
                  </label>
                  <textarea
                    value={taskPrompt}
                    onChange={(e) => setTaskPrompt(e.target.value)}
                    rows={3}
                    placeholder={labels.imagePlaceholder}
                    className={`w-full border ${resolvedTheme === 'dark' ? 'text-gray-200 border-gray-600 focus:border-violet-500' : 'text-gray-700 border-gray-300 focus:border-violet-400'} resize-none rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-white'} transition-colors`}
                  />
                </div>
              </div>
            </div>

            {/* Generate Button at bottom */}
            <div className="mt-6 pt-4 border-t border-gray-700/20">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !taskPrompt.trim() || !imageInput.trim()}
                className={`w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all ${
                  isGenerating || !taskPrompt.trim() || !imageInput.trim() 
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
        resultZone={
          <>
          {/* Show streaming text in real-time during generation */}
          {isGenerating && streamingPhase === 'raw' && streamingText && (
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'} border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm p-6`}>
              <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-violet-400' : 'text-violet-600'} mb-4`}>
                Generating Response...
              </h3>
              <div className={`${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} border ${resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-4`}>
                <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap leading-relaxed`}>
                  {streamingText}
                  <span className="animate-pulse">▊</span>
                </p>
              </div>
            </div>
          )}
          
          {/* Show structured results when complete */}
          {activeTab === 'sql' && sqlToolResponse && renderSQLResult(sqlToolResponse)}
          {activeTab === 'analysis' && dataAnalysisResponse && renderDataAnalysis(dataAnalysisResponse)}
          {activeTab === 'report' && reportToolResponse && renderReportResponse(reportToolResponse)}
          {activeTab === 'experiment' && experimentDesignResponse && renderExperimentDesignResult(experimentDesignResponse)}
          </>
        }
        sidebar={
          <div className="space-y-6">
            <div className={`${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}  border ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-xl shadow-sm`}>
              <div className={`p-4 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-900'}`}>{t('dataAgent.statistics.title')}</h3>
              </div>
              <div className={`p-4 space-y-3 ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
                <div className={`flex justify-between ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
                  <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('dataAgent.statistics.queriesWritten')}</span>
                  <span className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-900'}`}>89</span>
                </div>
                <div className={`flex justify-between ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
                  <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('dataAgent.statistics.reportsCreated')}</span>
                  <span className={`font-semibold ${resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>23</span>
                </div>
                <div className={`flex justify-between ${resolvedTheme === 'dark' ? 'bg-[#1E293B]' : 'bg-white'}`}>
                  <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('dataAgent.statistics.dataProcessed')}</span>
                  <span className={`font-semibold ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-900'}`}>2.4GB</span>
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};


export default DataAgentPage;