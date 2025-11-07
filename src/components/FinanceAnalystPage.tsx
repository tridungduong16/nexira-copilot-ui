import React, { useState, useRef } from 'react';
import { 
  BarChart3, 
  Upload, 
  FileText, 
  Send, 
  Paperclip, 
  Download, 
  TrendingUp, 
  PieChart, 
  Calculator, 
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Trash2,
  MessageSquare,
  Bot,
  User,
  ArrowLeft
} from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: string;
  status: 'parsing' | 'parsed' | 'error';
  uploadedAt: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  attachments?: string[];
}

const FinanceAnalystPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    {
      id: '1',
      name: 'budget_2023.xlsx',
      type: 'excel',
      size: '2.4 MB',
      status: 'parsed',
      uploadedAt: '2 hours ago'
    },
    {
      id: '2',
      name: 'p&l_report_2023.pdf',
      type: 'pdf',
      size: '1.8 MB',
      status: 'parsed',
      uploadedAt: '1 hour ago'
    },
    {
      id: '3',
      name: 'q4_expenses.csv',
      type: 'csv',
      size: '856 KB',
      status: 'parsing',
      uploadedAt: '5 minutes ago'
    }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I am your AI Finance Agent. I can help you analyze financial data, create reports, and answer questions about your uploaded files. What would you like to work on today?',
      timestamp: '10:30'
    },
    {
      id: '2',
      type: 'user',
      content: 'Summarize the 2023 P&L report',
      timestamp: '10:32'
    },
    {
      id: '3',
      type: 'ai',
      content: 'Based on the p&l_report_2023.pdf file, here is an overview of the 2023 P&L report:\n\n📊 **Revenue**: 45.2B VND (+12% vs 2022)\n💰 **Gross Profit**: 18.8B VND (41.6% margin)\n📉 **Operating Expenses**: 12.3B VND\n✅ **Net Profit**: 6.5B VND (+8% vs 2022)\n\n**Highlights:**\n- Revenue showed steady growth across all 4 quarters\n- Marketing expenses increased by 15% but were effective\n- Net profit margin: 14.4%',
      timestamp: '10:33',
      attachments: ['p&l_report_2023.pdf']
    }
  ]);

  const [currentMessage, setCurrentMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const newFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        status: 'parsing',
        uploadedAt: 'Just now'
      };
      
      setUploadedFiles(prev => [newFile, ...prev]);
      
      // Simulate parsing completion
      setTimeout(() => {
        setUploadedFiles(prev => 
          prev.map(f => f.id === newFile.id ? { ...f, status: 'parsed' } : f)
        );
      }, 3000);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I am analyzing your request. Based on the uploaded files, I can provide detailed information about your financial data. Let me process this information...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="h-5 w-5 text-green-400" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-400" />;
      case 'csv':
        return <BarChart3 className="h-5 w-5 text-blue-400" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'parsed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'parsing':
        return <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-400" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">💰 AI Finance Agent</h1>
                  <p className="text-sm text-gray-600">Analyze financial data and create smart reports</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                ✅ 3 files parsed
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                🤖 AI ready
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Chat Panel */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
                Chat with AI Finance Agent
              </h2>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`p-2 rounded-full ${message.type === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Bot className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.attachments && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.attachments.map((file, index) => (
                            <div key={index} className="bg-black bg-opacity-10 rounded-lg px-2 py-1 text-xs">
                              📎 {file}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                        {message.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Enter a request or drag a file here..."
                    className="w-full pl-4 pr-12 py-3 border border-gray-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Paperclip className="h-5 w-5 text-gray-500" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".xlsx,.xls,.pdf,.csv"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim()}
                  className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* File Upload */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-blue-500" />
                  Uploaded Files
                </h3>
              </div>
              
              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                className={`m-4 p-6 border-2 border-dashed rounded-xl text-center transition-colors ${
                  isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop files here or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-xs text-gray-500">Supports Excel, PDF, CSV files</p>
              </div>

              {/* File List */}
              <div className="p-4 space-y-3">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-600">{file.size} • {file.uploadedAt}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(file.status)}
                      <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                        <Eye className="h-4 w-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tools */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-blue-500" />
                  Quick Tools
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors border border-blue-200">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm font-medium">Create chart from spreadsheet</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors border border-green-200">
                  <FileText className="h-5 w-5" />
                  <span className="text-sm font-medium">Summarize report</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors border border-purple-200">
                  <Search className="h-5 w-5" />
                  <span className="text-sm font-medium">Search in column</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors border border-orange-200">
                  <Download className="h-5 w-5" />
                  <span className="text-sm font-medium">Export PDF report</span>
                </button>
              </div>
            </div>

            {/* Context Info */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-blue-500" />
                  Contextual Information
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Reporting Period:</span>
                  <span className="text-gray-600 ml-2">Fiscal Year 2023</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Currency:</span>
                  <span className="text-gray-600 ml-2">VND</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Department:</span>
                  <span className="text-gray-600 ml-2">Finance</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Last updated:</span>
                  <span className="text-gray-600 ml-2">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceAnalystPage;