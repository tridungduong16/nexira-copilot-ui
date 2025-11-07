import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AlertCircle, Clock, CheckCircle, Paperclip, Download, ExternalLink, Calendar, User, Mail, ArrowLeft } from 'lucide-react';

interface SupportTicket {
  ticketNumber: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'in-review' | 'waiting-for-response' | 'resolved' | 'closed';
  category: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  customerName: string;
  customerEmail: string;
  responses?: TicketResponse[];
  attachedFiles: AttachmentMeta[];
}

interface TicketResponse {
  id: string;
  message: string;
  author: string;
  isCustomer: boolean;
  timestamp: string;
  files: AttachmentMeta[];
}

interface AttachmentMeta {
  s3_key: string;
  filename: string;
  mime: string;
  size_bytes: number;
  sha256: string;
}

const TicketDetailPage: React.FC<{ onBack: () => void }> = () => {
	const { ticketId } = useParams();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
	const { resolvedTheme } = useTheme();
	const { t } = useLanguage();
	const [response, setResponse] = useState('');
	const [userRole, setUserRole] = useState<string | null>(null);
	const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

	const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-review': return <AlertCircle className="h-4 w-4" />;
      case 'waiting-for-response': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-review': return 'text-blue-600 bg-blue-100';
      case 'waiting-for-response': return 'text-purple-600 bg-purple-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in-review':
        return t('support.status.inReview');
      case 'waiting-for-response':
        return t('support.status.waitingForResponse');
      case 'resolved':
        return t('support.status.resolved');
      case 'closed':
        return t('support.status.closed');
      default:
        return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return t('support.priority.urgent');
      case 'high':
        return t('support.priority.high');
      case 'medium':
        return t('support.priority.medium');
      case 'low':
        return t('support.priority.low');
      default:
        return priority;
    }
  };

	const downloadFile = async (file: AttachmentMeta) => {
    const res = await fetch(import.meta.env.VITE_API_URL + "/ticket/file_presign_download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        s3_key: file.s3_key,
        filename: file.filename,
        inline: false,
      }),
    });
    const { url } = await res.json();
    window.open(url, "_blank");
  }

	const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const uploadToS3 = async (file: File, post: any) => {
    const fd = new FormData();
    Object.entries(post.fields).forEach(([k, v]) => fd.append(k, v as any));
    fd.append("file", file);
    const res = await fetch(post.url, { method: "POST", body: fd });
    if (!res.ok) throw new Error("S3 upload failed");
  }

	const mapTicket = (ticket: any) => {
    return {
      ticketNumber: ticket.ticket_number,
      customerName: ticket.customer_name,
      customerEmail: ticket.customer_email,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at ?? null,
      assignedTo: ticket.assigned_to ?? null,
      priority: ticket.priority,
      status: ticket.status,
      category: ticket.category,
      subject: ticket.subject,
      description: ticket.description,
      responses: ticket.responses.map((r: any) => ({
        message: r.message,
        author: r.author,
        isCustomer: r.is_customer,
        timestamp: r.timestamp,
        files: r.files,
      })),
      attachedFiles: ticket.attachments,
    }
  }

	const handleSendResponse = async () => {
    if (!response.trim()) return;
    const email = JSON.parse(localStorage.getItem('nexira_user') ?? '{}').email;
    const name = JSON.parse(localStorage.getItem('nexira_user') ?? '{}').name;
    let uploads: Array<{ key: string; filename: string; mime: string; post: any }> = [];
    if (attachedFiles.length > 0) {
      const presignRes = await fetch(import.meta.env.VITE_API_URL + "/ticket/file_presign_upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          files: Array.from(attachedFiles).map((f) => ({
            filename: f.name,
            mime: f.type || "application/octet-stream",
            ticket_number: String(ticket?.ticketNumber ?? ""),
          })),
        }),
      });
      if (!presignRes.ok) throw new Error(`presign HTTP ${presignRes.status}`);
      const presigned = await presignRes.json();
      uploads = presigned.uploads ?? [];
    }

    await Promise.all(
      uploads.map((u, i) => uploadToS3(attachedFiles[i], u.post))
    );

    const filesMeta = uploads.map((u, i) => ({
      s3_key: u.key,
      filename: attachedFiles[i].name,
      mime: attachedFiles[i].type || "application/octet-stream",
      size_bytes: attachedFiles[i].size,
      sha256: "dev-1",
      uploaded_at: new Date().toISOString(),
    }));

    try {      
      const api_response = await fetch(import.meta.env.VITE_API_URL + '/ticket/add_response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          ticket_id: ticket?.ticketNumber,
          email: ticket?.customerEmail,
          ticket_response: {
            message: response,
            author: name,
            is_customer: ticket?.customerEmail === email,
            files: filesMeta,
          }
        })
      });
      
      if (!api_response.ok) {
        throw new Error(`Error: ${api_response.status}`);
      }
      
      const data = await api_response.json();
      const mapped_ticket = mapTicket(data.ticket);
      setTicket(mapped_ticket);
      setResponse('');
      setAttachedFiles([]);
    } catch (error) {
      console.error('Error generating content:', error);
    }
  };

  useEffect(() => {
		const fetchData = async () => {
			try {
				const raw = localStorage.getItem("nexira_user");
				const email = raw ? JSON.parse(raw).email : undefined;
				if (!email) throw new Error("No email");
	
				const [ticketRes, userRes] = await Promise.all([
					fetch(import.meta.env.VITE_API_URL + `/ticket/get_by_id_permissions`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ ticket_number: ticketId, email: email }),
					}),
					fetch(import.meta.env.VITE_API_URL + "/user/info", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ email }),
					}),
				]);
	
				if (ticketRes.status === 403) throw new Error("Forbidden");
				const ticket = await ticketRes.json();
				const mapped_ticket = mapTicket(ticket);
				setTicket(mapped_ticket);
	
				if (!userRes.ok) throw new Error(`HTTP ${userRes.status}`);
				const data = await userRes.json();
				setUserRole(data.role);
			} catch (err) {
				console.error(err);
			}
		};
	
		fetchData();
	}, [ticketId]);

	if (!ticket) return <p>Loading...</p>;

	return (
		<div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-transparent text-gray-200' : 'bg-white text-gray-900'}`}>
			{/* Header */}
			<div className="bg-transparent">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
						
					<div className="flex justify-between items-start">
						<div>
								<h1 className={`text-3xl font-bold mb-2 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
								{ticket.subject}
								</h1>
								<div className="flex items-center space-x-4 text-sm">
								<span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
										{getPriorityLabel(ticket.priority)}
								</span>
								<span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(ticket.status)}`}>
										{getStatusIcon(ticket.status)}
										<span className="ml-1">{getStatusLabel(ticket.status)}</span>
								</span>
								<span className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
										{t('support.numberPrefix')} {ticket.ticketNumber}
								</span>
								</div>
						</div>
					</div>
				</div>
			</div>

				{/* Ticket Details */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Main Content */}
						<div className="lg:col-span-2">
						<div className={`${resolvedTheme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'} rounded-xl p-6 mb-6`}>
								<h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
								{t('support.ticket.description')}
								</h3>
								<p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
								{ticket.description}
								</p>
								{/* Attached Files */}
								{ticket.attachedFiles && ticket.attachedFiles.length > 0 && (
								<div className="mt-6 pt-6 border-t border-gray-200/20">
										<h4 className={`text-md font-semibold mb-3 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
										{t('support.ticket.attachedFiles')}
										</h4>
										<div className="space-y-2">
										{ticket.attachedFiles.map((file, index) => (
												<div
												key={index}
												className={`flex items-center justify-between p-3 rounded-lg border ${
														resolvedTheme === 'dark' 
														? 'bg-white/5 border-white/10 hover:bg-white/10' 
														: 'bg-gray-50 border-gray-200 hover:bg-gray-100'
												} transition-colors`}
												>
												<div className="flex items-center space-x-3">
														<Paperclip className={`h-4 w-4 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
														<div>
														<p className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
																{file.filename}
														</p>
														<p className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
																{(file.size_bytes / 1024 / 1024).toFixed(2)} MB • {file.mime}
														</p>
														</div>
												</div>
												<button
														onClick={() => {downloadFile(file)}}
														className={`p-2 rounded-lg transition-colors ${
														resolvedTheme === 'dark'
																? 'hover:bg-white/10 text-gray-400 hover:text-white'
																: 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
														}`}
														title={t('support.ticket.downloadFile')}
												>
														<Download className="h-4 w-4" />
												</button>
												</div>
										))}
										</div>
								</div>
								)}
						</div>

						{/* Responses */}
						{/* Conversation Thread */}
						{ticket.responses && ticket.responses.length > 0 && (
								<div className={`${resolvedTheme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'} rounded-xl p-6 mb-6`}>
								<h3 className={`text-lg font-semibold mb-6 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
										{t('support.ticket.conversation')}
								</h3>
								
								{/* Responses */}
								{ticket.responses && ticket.responses.map((response, index) => (
										<div key={index}>
										<div className="flex items-start space-x-4 py-4">
												<div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
												response.isCustomer 
														? (resolvedTheme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600')
														: (resolvedTheme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600')
												}`}>
												{response.author.charAt(0).toUpperCase()}
												</div>
												<div className="flex-1">
												<div className="mb-2">
														<div className="flex items-center space-x-2">
														<p className={`font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
																{response.author}
														</p>
														{!response.isCustomer && (
																<span className={`text-xs px-2 py-1 rounded-full ${resolvedTheme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'}`}>
																{t('support.ticket.supportLabel')}
																</span>
														)}
														</div>
														<p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
														{formatDate(response.timestamp)}
														</p>
												</div>
												<p className={`whitespace-pre-wrap ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
														{response.message}
												</p>
												{/* File Attachments */}
												{response.files && response.files.length > 0 && (
														<div className="mt-3">
														<p className={`text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
																{t('support.ticket.attachments')}
														</p>
														<div className="space-y-2">
																{response.files.map((file, fileIndex) => (
																<div
																		key={fileIndex}
																		className={`flex items-center justify-between p-2 rounded-lg border ${
																		resolvedTheme === 'dark' 
																				? 'border-gray-700 bg-gray-800/50 hover:bg-gray-800' 
																				: 'border-gray-200 bg-gray-50 hover:bg-gray-100'
																		} transition-colors cursor-pointer`}
																		onClick={() => {downloadFile(file)}}
																>
																		<div className="flex items-center space-x-2">
																		<ExternalLink className={`h-4 w-4 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
																		<span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
																				{file.filename}
																		</span>
																		</div>
																		<span className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
																		{(file.size_bytes / 1024).toFixed(1)} KB
																		</span>
																</div>
																))}
														</div>
														</div>
												)}
												</div>
										</div>
										{/* Separator line between responses */}
										{index < (ticket.responses?.length ?? 0) - 1 && (
												<div className={`border-t ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>
										)}
										</div>
								))}
								</div>
								
						)}

						</div>

						{/* Sidebar */}
						<div className="space-y-6">
						{/* Ticket Info */}
						<div className={`${resolvedTheme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
								<h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
								{t('support.ticket.information')}
								</h3>
								<div className="space-y-3">
								<div className="flex items-center">
										<Calendar className={`h-4 w-4 mr-3 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
										<div>
										<p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('support.ticket.created')}</p>
										<p className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
												{formatDate(ticket.createdAt)}
										</p>
										</div>
								</div>
								<div className="flex items-center">
										<Clock className={`h-4 w-4 mr-3 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
										<div>
										<p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('support.ticket.lastUpdated')}</p>
										<p className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
												{formatDate(ticket.updatedAt)}
										</p>
										</div>
								</div>
								{ticket.assignedTo && (
										<div className="flex items-center">
										<User className={`h-4 w-4 mr-3 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
										<div>
												<p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('support.ticket.assignedTo')}</p>
												<p className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
												{ticket.assignedTo}
												</p>
										</div>
										</div>
								)}
								</div>
						</div>

						{/* Customer Info */}
						<div className={`${resolvedTheme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
								<h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
								{t('support.ticket.customerInformation')}
								</h3>
								<div className="space-y-3">
								<div className="flex items-center">
										<User className={`h-4 w-4 mr-3 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
										<div>
										<p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('support.ticket.name')}</p>
										<p className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
												{ticket.customerName}
										</p>
										</div>
								</div>
								<div className="flex items-center">
										<Mail className={`h-4 w-4 mr-3 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
										<div>
										<p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('support.ticket.email')}</p>
										<p className={`${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
												{ticket.customerEmail}
										</p>
										</div>
								</div>
								</div>
						</div>
						</div>
				</div>
				</div>

		{/* File Upload and Response Section for Support Users */}
		{userRole && userRole.includes('user') && (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
				<div className={`${resolvedTheme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
						<h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
						Response
						</h3>
						<div className="space-y-4">
						<textarea
								placeholder="Type your response here..."
								className={`w-full h-32 p-4 rounded-lg border resize-none transition-colors ${
								resolvedTheme === 'dark'
										? 'bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none'
										: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none'
								}`}
								value={response}
								onChange={(e) => setResponse(e.target.value)}
						/>
						
						{/* File Upload Section */}
						<div className="space-y-3">
								<div className="flex items-center space-x-3">
								<label
										className={`cursor-pointer inline-flex items-center px-4 py-2 rounded-lg border transition-colors ${
										resolvedTheme === 'dark'
												? 'border-white/20 bg-white/5 hover:bg-white/10 text-gray-300'
												: 'border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700'
										}`}
								>
										<svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
										</svg>
										Attach Files
										<input
										type="file"
										multiple
										className="hidden"
										onChange={handleFileUpload}
										/>
								</label>
								<span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
										Upload documents, images, or other files
								</span>
								</div>
								
								{/* Display attached files */}
								{attachedFiles.length > 0 && (
								<div className="space-y-2">
										{attachedFiles.map((file, index) => (
										<div
												key={index}
												className={`flex items-center justify-between p-2 rounded-lg ${
												resolvedTheme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
												}`}
										>
												<span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
												{file.name}
												</span>
												<button
												onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}
												className={`text-sm ${
														resolvedTheme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'
												} transition-colors`}
												>
												Remove
												</button>
										</div>
										))}
								</div>
								)}
						</div>
						
						<div className="flex justify-end space-x-3">
								<button
								className={`px-4 py-2 rounded-lg font-medium transition-colors ${
										resolvedTheme === 'dark'
										? 'bg-white/10 hover:bg-white/20 text-gray-300 border border-white/20'
										: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
								}`}
								onClick={() => {
										setResponse('');
										setAttachedFiles([]);
								}}
								>
								Clear
								</button>
								<button
								className={`px-6 py-2 rounded-lg font-medium transition-colors ${
										resolvedTheme === 'dark'
										? 'bg-blue-600 hover:bg-blue-700 text-white'
										: 'bg-blue-600 hover:bg-blue-700 text-white'
								}`}
								onClick={handleSendResponse}
								disabled={!response.trim()}
								>
								Send Response
								</button>
						</div>
						</div>
				</div>
			</div>
		)}
		</div>
		);
}

export default TicketDetailPage;