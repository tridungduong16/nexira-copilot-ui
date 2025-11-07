import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, StopCircle, CheckCircle, AlertCircle, Upload, X, User, Bot } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  streamingService,
  StreamingToolType,
  StreamingRequest,
  StreamingCallbacks
} from '../../services/streamingService';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface UploadedDocument {
  document_id: string;
  filename: string;
  document_type: string;
}

interface StreamingChatBoxProps {
  sessionId: string;
  toolType: StreamingToolType;
  language?: string;
  roleLevel?: string;
  jobType?: string;
  model?: string;
  metadata?: Record<string, any>;
  placeholder?: string;
  onMessageSent?: (message: string) => void;
}

const StreamingChatBox: React.FC<StreamingChatBoxProps> = ({
  sessionId,
  toolType,
  language = 'english',
  roleLevel,
  jobType,
  model,
  metadata,
  placeholder,
  onMessageSent
}) => {
  const { resolvedTheme } = useTheme();
  const { language: uiLanguage } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [language]); // Reset when language changes

  const getWelcomeMessage = () => {
    const messages = {
      en: "Hello! I'm your HR Assistant for job description creation. I can help you create comprehensive job descriptions. You can upload existing JDs for reference or describe what role you need.",
      vi: "Xin chào! Tôi là Trợ lý HR tạo mô tả công việc. Tôi có thể giúp bạn tạo mô tả công việc toàn diện. Bạn có thể tải lên JD hiện có để tham khảo hoặc mô tả vị trí cần tuyển."
    };

    return language === 'vietnamese' ? messages.vi : messages.en;
  };

  const getDocumentType = () => {
    // For HR tool, we use job_description as the default document type
    return 'job_description';
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setIsUploading(true);

    try {
      // Extract text from file
      let extractedText = '';
      
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const { getDocument, GlobalWorkerOptions, version } = await import('pdfjs-dist');
        
        try {
          const workerSrcModule: any = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
          if (workerSrcModule && workerSrcModule.default) {
            GlobalWorkerOptions.workerSrc = workerSrcModule.default as string;
          } else {
            GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
          }
        } catch {
          GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
        }

        const doc = await getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
          const page = await doc.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => (item && typeof item.str === 'string' ? item.str : ''))
            .join(' ');
          text += pageText + '\n';
        }
        extractedText = text;
      } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        extractedText = await file.text();
      } else {
        throw new Error(uiLanguage === 'vi' 
          ? 'Định dạng file không được hỗ trợ. Vui lòng tải lên file PDF hoặc text.'
          : 'Unsupported file type. Please upload PDF or text files.');
      }

      // Upload to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/hr/chat/upload-document-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          filename: file.name,
          content: extractedText,
          document_type: getDocumentType(),
          metadata: {
            original_filename: file.name,
            file_size: file.size,
            upload_timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(uiLanguage === 'vi' 
          ? `Tải lên thất bại: ${response.statusText}`
          : `Upload failed: ${response.statusText}`);
      }

      const uploadResult: UploadedDocument = await response.json();
      setUploadedDocuments(prev => [...prev, uploadResult]);
      
      // Add system message about upload
      const systemMessage: Message = {
        id: `upload-${Date.now()}`,
        role: 'system',
        content: uiLanguage === 'vi' 
          ? `Tài liệu "${file.name}" đã được tải lên thành công. Bạn có thể hỏi tôi về tài liệu này.`
          : `Document "${file.name}" uploaded successfully. You can now ask me questions about this document.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, systemMessage]);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: uiLanguage === 'vi' 
          ? `Tải lên thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
          : `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (documentId: string, filename: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/hr/chat/delete-document?session_id=${sessionId}&document_id=${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(uiLanguage === 'vi'
          ? `Xóa thất bại: ${response.statusText}`
          : `Delete failed: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        // Remove from uploaded documents list
        setUploadedDocuments(prev => prev.filter(doc => doc.document_id !== documentId));
        
        // Add system message about deletion
        const systemMessage: Message = {
          id: `delete-${Date.now()}`,
          role: 'system',
          content: uiLanguage === 'vi'
            ? `Tài liệu "${filename}" đã được xóa thành công.`
            : `Document "${filename}" has been removed successfully.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, systemMessage]);
      } else {
        throw new Error(result.message || (uiLanguage === 'vi' ? 'Xóa thất bại' : 'Delete failed'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: uiLanguage === 'vi'
          ? `Không thể xóa tài liệu: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
          : `Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsStreaming(true);

    if (onMessageSent) {
      onMessageSent(userMessage.content);
    }

    // Create assistant message placeholder
    const assistantMessageId = `assistant_${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    // Create abort controller for this stream
    abortControllerRef.current = new AbortController();

    const request: StreamingRequest = {
      tool_type: toolType,
      session_id: sessionId,
      message: userMessage.content,
      language,
      role_level: roleLevel,
      job_type: jobType,
      model,
      metadata
    };

    const callbacks: StreamingCallbacks = {
      onChunk: (chunk: string) => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        );
      },
      onComplete: (data) => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
        setIsStreaming(false);
        abortControllerRef.current = null;
        console.log('Stream completed:', data);
      },
      onError: (errorMsg: string) => {
        setError(errorMsg);
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: `Error: ${errorMsg}`, isStreaming: false }
              : msg
          )
        );
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    };

    try {
      await streamingService.streamChat(
        request,
        callbacks,
        abortControllerRef.current.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Streaming error:', err);
        setError(err.message || 'Failed to stream response');
        setIsStreaming(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full ${resolvedTheme === 'dark' ? 'bg-[#0F172A]' : 'bg-gray-50'} min-h-0 overflow-hidden`}>
      {/* Header with uploaded documents */}
      {uploadedDocuments.length > 0 && (
        <div className={`${resolvedTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4 flex-shrink-0`}>
          <div className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
            {uiLanguage === 'vi' ? 'Tài liệu đã tải lên:' : 'Uploaded Documents:'}
          </div>
          <div className="flex flex-wrap gap-2 max-w-full">
            {uploadedDocuments.map((doc) => (
              <div key={doc.document_id} className={`flex items-center gap-2 ${resolvedTheme === 'dark' ? 'bg-green-900 text-green-100 hover:bg-red-900 hover:text-red-100' : 'bg-green-50 text-green-800 hover:bg-red-50 hover:text-red-800'} px-3 py-1 rounded-full text-sm group transition-colors max-w-[300px]`}>
                <CheckCircle className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{doc.filename}</span>
                <button
                  onClick={() => deleteDocument(doc.document_id, doc.filename)}
                  className={`ml-1 opacity-0 group-hover:opacity-100 ${resolvedTheme === 'dark' ? 'hover:bg-red-800' : 'hover:bg-red-200'} rounded-full p-0.5 transition-opacity flex-shrink-0`}
                  title={uiLanguage === 'vi' ? `Xóa ${doc.filename}` : `Remove ${doc.filename}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat messages with proper scrolling */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 custom-scrollbar">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const isSystem = message.role === 'system';

          return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
              <div className={`flex items-start gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isUser 
                    ? 'bg-blue-500 text-white'
                    : isSystem
                    ? 'bg-gray-500 text-white'
                    : 'bg-green-500 text-white'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message content */}
                <div className={`rounded-lg p-3 ${
                  isUser
                    ? 'bg-blue-500 text-white'
                    : isSystem
                    ? `${resolvedTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'} border`
                    : `${resolvedTheme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-200 text-gray-900'} border`
                }`}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.isStreaming && (
                    <div className="mt-1 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-xs opacity-70">
                        {uiLanguage === 'vi' ? 'Đang trả lời...' : 'Typing...'}
                      </span>
                    </div>
                  )}
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className={`${resolvedTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-4 flex-shrink-0`}>
        {/* Upload zone */}
        <div className="mb-3">
          <div
            className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
              isUploading 
                ? `border-blue-500 ${resolvedTheme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}` 
                : resolvedTheme === 'dark' 
                  ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-blue-600">
                  {uiLanguage === 'vi' ? 'Đang tải lên...' : 'Uploading...'}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Upload className={`w-4 h-4 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {uiLanguage === 'vi' 
                    ? 'Tải lên CV, JD, hoặc tài liệu khác (PDF, TXT, MD)'
                    : 'Upload CV, JD, or other documents (PDF, TXT, MD)'
                  }
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Chat input */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder || (uiLanguage === 'vi' 
                ? 'Hỏi tôi về các tài liệu đã tải lên hoặc câu hỏi liên quan đến HR...'
                : 'Ask me about the uploaded documents or HR-related questions...'
              )}
              className={`w-full h-12 px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-snug ${
                resolvedTheme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              rows={1}
              disabled={isStreaming}
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isStreaming}
            className="inline-flex items-center justify-center h-12 w-12 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StreamingChatBox;
