import React, { useState } from 'react';
import { 
  Send, 
  Upload, 
  CheckCircle, 
  MessageSquare,
  Phone,
  Mail,
  User,
  FileText,
  Zap,
  Book,
  Star,
  ArrowLeft
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface SupportTicket {
  id: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
}

const HelpPage: React.FC = () => {
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    subject: '',
    priority: 'medium',
    category: 'technical',
    description: '',
    attachments: [] as File[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [ticketId, setTicketId] = useState('');

  const departments = [
    t('helpPage.departments.hr'), t('helpPage.departments.marketing'), t('helpPage.departments.finance'), t('helpPage.departments.design'), t('helpPage.departments.gameDev'),
    t('helpPage.departments.sales'), t('helpPage.departments.qa'), t('helpPage.departments.uiux'), t('helpPage.departments.data'), t('helpPage.departments.telesales'), t('helpPage.departments.ld')
  ];

  const categories = [
    { id: 'technical', name: t('helpPage.categories.technical'), icon: Zap },
    { id: 'account', name: t('helpPage.categories.account'), icon: User },
    { id: 'feature', name: t('helpPage.categories.feature'), icon: Star },
    { id: 'training', name: t('helpPage.categories.training'), icon: Book },
    { id: 'billing', name: t('helpPage.categories.billing'), icon: FileText },
    { id: 'other', name: t('helpPage.categories.other'), icon: MessageSquare }
  ];

  const priorities = [
    { id: 'low', name: t('helpPage.priorities.low'), color: 'text-green-400', bgColor: 'bg-green-900/30' },
    { id: 'medium', name: t('helpPage.priorities.medium'), color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' },
    { id: 'high', name: t('helpPage.priorities.high'), color: 'text-orange-400', bgColor: 'bg-orange-900/30' },
    { id: 'urgent', name: t('helpPage.priorities.urgent'), color: 'text-red-400', bgColor: 'bg-red-900/30' }
  ];

  const faqItems = [
    {
      question: 'How do I get started with an AI Agent?',
      answer: 'You can start by selecting an Agent suitable for your department from the Marketplace page, then follow the initial setup instructions.',
      category: 'Getting Started'
    },
    {
      question: 'I forgot my password, how can I reset it?',
      answer: 'Click on "Forgot Password" on the login page, enter your email, and follow the instructions in the email sent to you.',
      category: 'Account'
    },
    {
      question: 'Can AI Agents handle sensitive data?',
      answer: 'Yes, the system is designed with high-level security measures. All data is encrypted and complies with international security standards.',
      category: 'Security'
    },
    {
      question: 'How can I optimize my prompts for better results?',
      answer: 'Check out the Prompt Optimization Lab and refer to the articles in our knowledge base about effective prompt engineering techniques.',
      category: 'Usage'
    }
  ];

  const recentTickets: SupportTicket[] = [
    {
      id: 'TK-001',
      subject: 'Unable to upload file in Finance Agent',
      priority: 'high',
      status: 'in-progress',
      createdAt: '2024-01-15'
    },
    {
      id: 'TK-002',
      subject: 'Request to add Excel export feature',
      priority: 'medium',
      status: 'open',
      createdAt: '2024-01-14'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({ 
        ...prev, 
        attachments: [...prev.attachments, ...Array.from(e.target.files!)]
      }));
    }
  };

  const uploadToS3 = async (file: File, post: any) => {
    const fd = new FormData();
    Object.entries(post.fields).forEach(([k, v]) => fd.append(k, v as any));
    fd.append("file", file);
    const res = await fetch(post.url, { method: "POST", body: fd });
    if (!res.ok) throw new Error("S3 upload failed");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (localStorage.getItem('nexira_user') === "undefined") {
      setError("Please login to submit a ticket");
      setIsSubmitting(false);
      return;
    }

    const email = JSON.parse(localStorage.getItem('nexira_user') ?? '{}').email;
    JSON.parse(localStorage.getItem('nexira_user') ?? '{}').name;

    if (email !== formData.email) {
      setError("Please use the same email as your login email");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/ticket/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_email: formData.email,
          subject: formData.subject,
          priority: formData.priority,
          category: formData.category,
          description: formData.description,
          attachments: Array.from(formData.attachments).map((f) => ({
            s3_key: "dev-1",
            filename: f.name,
            mime: f.type || "application/octet-stream",
            size_bytes: f.size,
            sha256: "dev-1"
          })),
          status: 'in-review',
          assigned_to: '',
        })
      });
      const data = await response.json();
      if (data.message !== 'Ticket created successfully') {
        setError("Error creating ticket, please try again");
      }

      let uploads: Array<{ key: string; filename: string; mime: string; post: any }> = [];
      if (formData.attachments.length > 0) {
        const presignRes = await fetch(import.meta.env.VITE_API_URL + "/ticket/file_presign_upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            files: Array.from(formData.attachments).map((f) => ({
              filename: f.name,
              mime: f.type || "application/octet-stream",
              ticket_number: String(data.ticket_id.ticket_number ?? ""),
            })),
          }),
        });
        if (!presignRes.ok) throw new Error(`presign HTTP ${presignRes.status}`);
        const presigned = await presignRes.json();
        uploads = presigned.uploads ?? [];
      }

      await Promise.all(
        uploads.map((u, i) => uploadToS3(formData.attachments[i], u.post))
      );

      const filesMeta = uploads.map((u, i) => ({
        s3_key: u.key,
        filename: formData.attachments[i].name,
        mime: formData.attachments[i].type || "application/octet-stream",
        size_bytes: formData.attachments[i].size,
        sha256: "dev-1",
        uploaded_at: new Date().toISOString(),
      }));

      const editResponse = await fetch(import.meta.env.VITE_API_URL + '/ticket/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          ticket_id: data.ticket_id.ticket_number,
          attachments: filesMeta,
          subject: formData.subject,
          priority: formData.priority,
          category: formData.category,
          description: formData.description,
          customer_name: formData.name,
          customer_email: formData.email,
          assigned_to: '',
          status: 'in-review'
        })
      });

      if (editResponse.ok) {
        setIsSubmitting(false);
        setIsSubmitted(true);
        setTicketId(data.ticket_id.ticket_number);
      } else {
        setError("Error creating ticket, please try again");
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
      setError('Error submitting form');
    }
  };

  if (isSubmitted) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${resolvedTheme === 'dark' ? 'bg-[#0B172A]' : 'bg-gray-50'}`}>
        <div className="max-w-md mx-auto text-center">
          <div className={`${resolvedTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-8`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${resolvedTheme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'}`}>
              <CheckCircle className={`h-8 w-8 ${resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <h2 className={`text-2xl font-bold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('helpPage.submittedTitle')}</h2>
            <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-6`}>{t('helpPage.submittedSubtitle')}</p>
            <div className={`${resolvedTheme === 'dark' ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'} rounded-lg p-4 mb-6`}>
              <p className={`${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-700'} text-sm`}>
                <strong>{t('helpPage.ticketId')}:</strong> {ticketId ? `#${ticketId}` : `TK-${Date.now().toString().slice(-6)}`}
              </p>
            </div>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setFormData({
                  name: '', email: '', department: '', subject: '', 
                  priority: 'medium', category: 'technical', description: '', attachments: []
                });
                setTicketId('');
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {t('helpPage.submitAnother')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-transparent text-gray-200' : 'bg-transparent text-gray-900'}`}>
      {/* Header */}
      <div className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => navigate('/help')}
            className={`flex items-center mb-6 ${resolvedTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('support.actions.back')}
          </button>
          <div className="text-center">
            <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('helpPage.title')}</h1>
            <p className={`${resolvedTheme === 'dark' ? 'text-xl text-gray-300' : 'text-xl text-gray-600'} max-w-3xl mx-auto`}>{t('helpPage.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Support Form */}
          <div className="lg:col-span-2">
            <div className={`${resolvedTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-2xl shadow-sm`}>
              <div className={`p-6 ${resolvedTheme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                <h2 className={`text-2xl font-bold flex items-center ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  <MessageSquare className="h-6 w-6 mr-3 text-blue-300" />
                  {t('helpPage.form.title')}
                </h2>
                <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-2`}>{t('helpPage.form.description')}</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className={`block text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('helpPage.form.name')}
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full rounded-lg px-3 py-2 focus:ring-blue-600 focus:border-blue-600 ${resolvedTheme === 'dark' ? 'bg-gray-900 border border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'}`}
                      placeholder="e.g., John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className={`block text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('helpPage.form.email')}
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full rounded-lg px-3 py-2 focus:ring-blue-600 focus:border-blue-600 ${resolvedTheme === 'dark' ? 'bg-gray-900 border border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'}`}
                      placeholder="e.g., john.doe@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label htmlFor="department" className={`block text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('helpPage.form.department')}
                  </label>
                  <select
                    name="department"
                    id="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className={`w-full rounded-lg px-3 py-2 focus:ring-blue-600 focus:border-blue-600 ${resolvedTheme === 'dark' ? 'bg-gray-900 border border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'}`}
                    required
                  >
                    <option value="">{t('helpPage.form.selectDepartment')}</option>
                    {departments.map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className={`block text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('helpPage.form.subject')}
                  </label>
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full rounded-lg px-3 py-2 focus:ring-blue-600 focus:border-blue-600 ${resolvedTheme === 'dark' ? 'bg-gray-900 border border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'}`}
                    placeholder="e.g., Unable to access Marketing Agent"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className={`block text-sm font-medium mb-3 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('helpPage.form.category')}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                        className={`flex items-center space-x-2 p-3 rounded-lg transition-colors text-left ${
                          formData.category === cat.id
                            ? (resolvedTheme === 'dark' ? 'bg-white/10 border border-white/20 text-white' : 'bg-blue-50 border border-blue-200 text-blue-700')
                            : (resolvedTheme === 'dark' ? 'bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-300' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700')
                        }`}
                      >
                        <cat.icon className="h-5 w-5 text-blue-300" />
                        <span className="text-sm font-medium">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className={`block text-sm font-medium mb-3 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('helpPage.form.priority')}
                  </label>
                  <div className="flex items-center space-x-3">
                    {priorities.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, priority: p.id }))}
                        className={`inline-flex items-center justify-center h-10 px-4 rounded-full text-sm font-medium transition-colors border whitespace-nowrap min-w-[120px] text-center ${
                          formData.priority === p.id
                            ? (resolvedTheme === 'dark' ? `${p.bgColor} ${p.color} border-transparent` : 'bg-blue-50 border-blue-200 text-blue-700')
                            : (resolvedTheme === 'dark' ? 'bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700')
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className={`block text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('helpPage.form.descriptionLabel')}
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={6}
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`w-full rounded-lg px-3 py-2 focus:ring-blue-600 focus:border-blue-600 ${resolvedTheme === 'dark' ? 'bg-gray-900 border border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'}`}
                    placeholder={t('helpPage.form.descriptionPlaceholder')}
                    required
                  ></textarea>
                </div>

                {/* Attachments */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('helpPage.form.attachments')}
                  </label>
                  <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${resolvedTheme === 'dark' ? 'border-gray-700 bg-gray-900/30' : 'border-gray-300 bg-white'}`}>
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className={`flex text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <label
                          htmlFor="file-upload"
                          className={`relative cursor-pointer rounded-md font-medium focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 ${resolvedTheme === 'dark' ? 'bg-white/10 text-blue-300 hover:text-blue-400' : 'bg-blue-50 text-blue-700 hover:text-blue-800'}`}
                        >
                          <span>{t('helpPage.form.upload')}</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileUpload} multiple />
                        </label>
                         <p className="pl-1">{t('helpPage.form.dragDrop')}</p>
                      </div>
                       <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('helpPage.form.fileHint')}</p>
                    </div>
                  </div>
                  {formData.attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-300">{t('helpPage.form.selectedFiles')}</h4>
                      <ul className="space-y-2">
                        {formData.attachments.map((file, index) => (
                          <li key={index} className="flex items-center justify-between bg-gray-900 p-2 rounded-md border border-gray-700">
                            <span className="text-sm text-gray-300 truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }))}
                              className="text-red-300 hover:text-red-400"
                            >
                              {t('helpPage.form.remove')}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    className="w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        <span>{t('helpPage.form.submitting')}</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        <span>{t('helpPage.form.submit')}</span>
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {/* Contact Info */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
              <h3 className={`text-xl font-bold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('helpPage.contact.title')}</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className={`h-5 w-5 mt-1 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div>
                    <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('helpPage.contact.email')}</p>
                    <a href="mailto:support@nexira.ai" className={`${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>support@nexira.ai</a>
                    <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{t('helpPage.contact.responseTime')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className={`h-5 w-5 mt-1 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div>
                    <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('helpPage.contact.phone')}</p>
                    <p className={`${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>(+84) 123 456 789</p>
                    <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{t('helpPage.contact.hours')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
              <h3 className={`text-xl font-bold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('helpPage.faq.title')}</h3>
              <div className="space-y-3">
                {faqItems.map((item, index) => (
                  <div key={index} className={`${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50 border border-gray-200'} p-3 rounded-lg`}>
                    <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.question}</p>
                    <p className={`text-sm mt-1 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Tickets */}
            <div className={`${resolvedTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
              <h3 className={`text-xl font-bold mb-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('helpPage.recent.title')}</h3>
              <ul className="space-y-3">
                {recentTickets.map(ticket => (
                  <li key={ticket.id} className={`${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50 border border-gray-200'} p-3 rounded-lg flex justify-between items-center`}>
                    <div>
                      <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{ticket.subject}</p>
                      <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>ID: {ticket.id}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      ticket.status === 'resolved'
                        ? (resolvedTheme === 'dark' ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700')
                        : ticket.status === 'in-progress'
                          ? (resolvedTheme === 'dark' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700')
                          : (resolvedTheme === 'dark' ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700')
                    }`}>
                      {({
                        open: t('helpPage.status.open'),
                        'in-progress': t('helpPage.status.inProgress'),
                        resolved: t('helpPage.status.resolved')
                      } as Record<string, string>)[ticket.status]}
                    </span>
                  </li>
                ))}
                {recentTickets.length === 0 && (
                  <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{t('helpPage.recent.empty')}</p>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;