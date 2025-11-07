import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { knowledgeService } from '../services/knowledgeService';
import { Post } from '../types/knowledge';
import PostCreation from './ui/PostCreation';
import PostCard from './ui/PostCard';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorMessage from './ui/ErrorMessage';
import EmptyState from './ui/EmptyState';

const KnowledgeBasePage: React.FC = () => {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    category: 'all' as string,
  });
  const [showStarred, setShowStarred] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = showStarred
        ? await knowledgeService.getMyStarred({ page: filters.page, limit: filters.limit })
        : await knowledgeService.getPosts({ page: filters.page, limit: filters.limit, category: filters.category });
      setPosts(response.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filters, showStarred]);

  const handlePostCreated = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(prevPosts => 
      prevPosts.map(post => post.id === updatedPost.id ? updatedPost : post)
    );
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B0C0F]">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B0C0F]">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <ErrorMessage message={error} onRetry={fetchPosts} />
        </div>
      </div>
    );
  }

  const categories = (t('categories') as any) || {};

  return (
    <div className={`min-h-screen text-gray-900 dark:text-gray-200`}>
      <div className="py-8 px-0 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('knowledgePage.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300">{t('knowledgePage.subtitle')}</p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <aside className="hidden md:block md:col-span-2 lg:col-span-2 space-y-6 pl-4">
            {/* Search removed */}

            {/* Categories list */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-white/10 p-4 sticky top-6">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">{t('knowledgeUi.categoriesTitle')}</h3>
              <div className="flex flex-col space-y-2">
                {Object.entries(categories).map(([key, label]: [string, any], index: number) => (
                  <React.Fragment key={key}>
                    <button
                      onClick={() => { setShowStarred(false); setFilters({ ...filters, category: key, page: 1 }); }}
                      className={`text-left px-3 py-2 rounded-md transition-colors ${
                        filters.category === key && !showStarred
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      {String(label)}
                    </button>
                    {index === 0 && (
                      <button
                        onClick={() => { setShowStarred(true); setFilters({ ...filters, page: 1, category: 'all' }); }}
                        className={`text-left px-3 py-2 rounded-md transition-colors ${
                          showStarred
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        {t('knowledgeUi.myStarred')}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

          </aside>

          {/* Main content */}
          <main className="col-span-12 md:col-span-10 lg:col-span-10 xl:col-span-10 space-y-6">
            {/* Post Creation */}
            <PostCreation onPostCreated={handlePostCreated} categories={categories} defaultCategory={filters.category} />

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.length === 0 ? (
                <EmptyState 
                  title={t('knowledgePage.emptyTitle')}
                  description={t('knowledgePage.emptySubtitle')}
                  icon="search"
                />
              ) : (
                posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onPostUpdated={handlePostUpdated}
                    onPostDeleted={handlePostDeleted}
                  />
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
