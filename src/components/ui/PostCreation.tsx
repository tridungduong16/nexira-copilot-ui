import React, { useMemo, useState, useRef, useEffect } from 'react';
import LoginModal from './LoginModal';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { knowledgeService } from '../../services/knowledgeService';
import { Post, Attachment } from '../../types/knowledge';

interface PostCreationProps {
  onPostCreated: (post: Post) => void;
  categories?: Record<string, any>;
  defaultCategory?: string;
}

const PostCreation: React.FC<PostCreationProps> = ({ onPostCreated, categories = {}, defaultCategory = 'all' }) => {
  useTheme();
  const { t } = useLanguage();
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory && defaultCategory !== 'all' ? defaultCategory : '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCategoryList, setShowCategoryList] = useState(false);

  const selectableCategories = useMemo(() => {
    return Object.entries(categories)
      .filter(([key]) => key !== 'all')
      .map(([key, label]) => ({ key, label: String(label) }));
  }, [categories]);

  useEffect(() => {
    setSelectedCategory(defaultCategory && defaultCategory !== 'all' ? defaultCategory : '');
  }, [defaultCategory]);

  const isGuest = () => {
    const provider = localStorage.getItem('nexira_login_provider');
    return !provider || provider === 'guest';
  };
  const [showLogin, setShowLogin] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() && attachments.length === 0) return;
    if (isGuest()) { setShowLogin(true); return; }

    try {
      setIsSubmitting(true);
      
      const newPost = await knowledgeService.createPost({
        content,
        category: selectedCategory || (defaultCategory !== 'all' ? defaultCategory : undefined),
        attachments: attachments
      });
      onPostCreated(newPost);
      setContent('');
      setAttachments([]);
      setSelectedCategory(defaultCategory && defaultCategory !== 'all' ? defaultCategory : '');
    } catch (error: any) {
      console.error('❌ Failed to create post:', error);
      alert('Failed to create post: ' + (error?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (isGuest()) { setShowLogin(true); return; }
    
    try {
      setIsUploading(true);
      
      // 1. Get presigned URLs for all files
      const presignResponse = await knowledgeService.getPresignedUpload(
        Array.from(files).map(file => ({
          filename: file.name,
          mime: file.type || 'application/octet-stream',
        }))
      );
      
      // 2. Upload files to S3
      await Promise.all(
        presignResponse.uploads.map(async (upload, i) => {
          try {
            await knowledgeService.uploadToS3(files[i], upload.post);
          } catch (uploadError) {
            throw uploadError;
          }
        })
      );
      
      // 3. Create attachment metadata and add to state
      const newAttachments: Attachment[] = presignResponse.uploads.map((upload, i) => ({
        type: files[i].type.startsWith('image/') ? 'image' : 
              files[i].type.startsWith('video/') ? 'video' : 'document',
        s3_key: upload.key,
        filename: upload.filename,
        mime: upload.mime,
        size_bytes: files[i].size,
        sha256: 'temp-hash', // TODO: could compute real hash if needed
      }));
      
      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (error: any) {
      console.error('❌ Failed to upload files:', error);
      alert('Failed to upload files: ' + (error?.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg p-4 mb-6">
      <div>
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('knowledgeUi.whatsOnYourMind')}
            className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="relative bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                      {attachment.type === 'image' ? '📷' : 
                       attachment.type === 'video' ? '🎬' : '📄'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {attachment.filename}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {attachment.size_bytes ? (attachment.size_bytes / 1024).toFixed(1) + ' KB' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 text-xs"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">{isUploading ? 'Uploading...' : t('knowledgeUi.photo')}</span>
              </button>
              {/* Category dropdown */}
              {selectableCategories.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowCategoryList(!showCategoryList)}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-white/10"
                  >
                    <span className="text-sm">{selectedCategory ? `#${selectableCategories.find(c => c.key === selectedCategory)?.label}` : t('knowledgeUi.category')}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showCategoryList && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                      {selectableCategories.map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => { setSelectedCategory(key); setShowCategoryList(false); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg ${selectedCategory === key ? 'bg-blue-600 text-white' : ''}`}
                        >
                          #{label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading || (!content.trim() && attachments.length === 0)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? t('knowledgeUi.posting') : 
               isUploading ? 'Uploading...' : t('knowledgeUi.post')}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            onChange={handleImageUpload}
            className="hidden"
          />
          <LoginModal
            open={showLogin}
            onClose={() => setShowLogin(false)}
            onSelect={() => { setShowLogin(false); }}
            hideGuest={true}
            dismissible={true}
          />
        </div>
      </div>
    </div>
  );
};

export default PostCreation;
