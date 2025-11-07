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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[] | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = showStarred
        ? await knowledgeService.getMyStarred({ page: filters.page, limit: filters.limit })
        : await knowledgeService.getPosts({ page: filters.page, limit: filters.limit, category: filters.category });
      setPosts(response.posts || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load posts';
      console.error('Knowledge page error:', errorMessage);
      setError(errorMessage);
      setPosts([]);
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

  const runSearch = async (q: string) => {
    // Preserve user input (including trailing spaces) in the UI
    setSearchQuery(q);
    const query = q.trim();
    if (!query) {
      setSearchResults(null);
      return;
    }
    try {
      const res = await knowledgeService.searchPosts({ query, page: 1, limit: 10, min_score: 0.35 });
      setSearchResults(res.posts || []);
    } catch (e) {
      // suppress search errors
    } finally {
      // no-op
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
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
        {/* Header with inline search */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{t('knowledgePage.title')}</h1>
            <p className="text-gray-600 dark:text-gray-300">{t('knowledgePage.subtitle')}</p>
          </div>
          <div className="w-full md:w-[420px]">
            <textarea
              value={searchQuery}
              onChange={(e) => runSearch(e.target.value)}
              placeholder={t('knowledgePage.searchPlaceholder')}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  runSearch(searchQuery);
                }
              }}
              className="w-full rounded-xl px-4 py-2 border text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 resize-none"
              style={{
                background: 'rgba(11, 99, 206, 0.05)',
                borderColor: 'rgba(11, 99, 206, 0.2)',
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <aside className="hidden md:block md:col-span-2 lg:col-span-2 space-y-6 pl-4">
            {/* Search removed */}

            {/* Categories list */}
            <div className="rounded-lg shadow-sm border p-4 sticky top-6"
              style={{
                background: 'rgba(11, 99, 206, 0.05)',
                borderColor: 'rgba(11, 99, 206, 0.2)'
              }}>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">{t('knowledgeUi.categoriesTitle')}</h3>
              <div className="flex flex-col space-y-2">
                {Object.entries(categories).map(([key, label]: [string, any], index: number) => (
                  <React.Fragment key={key}>
                    <button
                      onClick={() => { setShowStarred(false); setFilters({ ...filters, category: key, page: 1 }); }}
                      className={`text-left px-3 py-2 rounded-md transition-colors ${
                        filters.category === key && !showStarred
                          ? 'text-white'
                          : 'text-gray-700 dark:text-gray-200'
                      }`}
                      style={filters.category === key && !showStarred ? {
                        background: 'linear-gradient(90deg, #0B63CE, #3399FF)'
                      } : {
                        background: 'rgba(11, 99, 206, 0.05)'
                      }}
                    >
                      {String(label)}
                    </button>
                    {index === 0 && (
                      <button
                        onClick={() => { setShowStarred(true); setFilters({ ...filters, page: 1, category: 'all' }); }}
                        className={`text-left px-3 py-2 rounded-md transition-colors ${
                          showStarred
                            ? 'text-white'
                            : 'text-gray-700 dark:text-gray-200'
                        }`}
                        style={showStarred ? {
                          background: 'linear-gradient(90deg, #0B63CE, #3399FF)'
                        } : {
                          background: 'rgba(11, 99, 206, 0.05)'
                        }}
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
              {(searchResults ?? posts).length === 0 ? (
                <EmptyState 
                  title={t('knowledgePage.emptyTitle')}
                  description={t('knowledgePage.emptySubtitle')}
                  icon="search"
                />
              ) : (
                (searchResults ?? posts).map(post => (
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

          {/* Right panel removed to restore full-width posts */}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBasePage;