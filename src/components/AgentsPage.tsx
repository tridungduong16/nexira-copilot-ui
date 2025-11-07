import React, { useState } from 'react';
import { 
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Star
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { agentData } from '../data/agentData';
import { useTheme } from '../contexts/ThemeContext';

interface AgentsPageProps {
  onAgentSelect?: (agentId: string) => void;
}

const AgentsPage: React.FC<AgentsPageProps> = ({ onAgentSelect }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const { t, language } = useLanguage();
  const { resolvedTheme } = useTheme();

  const agents = agentData.map(agent => {
    const agentId = agent.id as 'data' | 'telesales' | 'qa' | 'hr' | 'marketing' | 'gamedev' | 'design' | 'training' | 'prompt-optimizer';
    return {
      ...agent,
      name: t(`agentsPage.${agentId}.name`),
      description: t(`agentsPage.${agentId}.description`),
      features: (t(`agentsPage.${agentId}.features`) as unknown as string[]),
      category: t(agent.categoryKey),
      usage: t('usageThisWeek', { count: Math.floor(Math.random() * 200) + 50 }),
    };
  });

  const categories = React.useMemo(() => [
    { id: 'all', name: t('categories.all') },
    { id: 'dataTeam', name: t('categories.dataTeam') },
    { id: 'telesales', name: t('categories.telesales') },
    { id: 'qaQc', name: t('categories.qaQc') },
    { id: 'humanResources', name: t('categories.humanResources') },
    { id: 'marketing', name: t('categories.marketing') },
    { id: 'gameDevelopment', name: t('categories.gameDevelopment') },
    { id: 'design', name: t('categories.design') },
    { id: 'training', name: t('categories.training') },
    { id: 'promptOptimizer', name: t('categories.promptOptimizer') },
  ], [language, t]);

  const filteredAgents = agents.filter(agent => {
    const agentCategoryId = agent.categoryKey.split('.')[1];
    const matchesFilter = filter === 'all' || agentCategoryId === filter;
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-5">
          {/* Sidebar */}
          <aside className={`col-span-12 lg:col-span-3 rounded-2xl p-6 border ${resolvedTheme === 'dark' ? 'bg-[#0B63CE]/10 border-[#0B63CE]/30 text-gray-200' : 'bg-white text-gray-800 border-[#0B63CE]/20'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{t('header.marketplace')}</h2>
            </div>
            <div className="space-y-6">
              <div>
                <div className={`text-xs uppercase tracking-wider mb-3 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('categories.all')}</div>
                <ul className="space-y-2">
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => setFilter(cat.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          resolvedTheme === 'dark'
                            ? (filter === cat.id ? 'text-white' : 'text-gray-300 hover:bg-[#0B63CE]/20')
                            : (filter === cat.id ? 'bg-[#0B63CE]/10 text-[#0B63CE]' : 'text-gray-700 hover:bg-gray-100')
                        }`}
                        style={filter === cat.id && resolvedTheme === 'dark' ? { background: 'rgba(11, 99, 206, 0.2)' } : undefined}
                      >
                        {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className={`mt-8 text-xs ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
              © Nexira AI
            </div>
          </aside>

          {/* Main Content */}
          <main className="col-span-12 lg:col-span-9 space-y-5">
            {/* Content panel */}
            <div className={`rounded-2xl p-6 border ${resolvedTheme === 'dark' ? 'bg-[#0B63CE]/10 border-[#0B63CE]/30' : 'bg-white border-[#0B63CE]/20'}`}>
              <div className="mb-6">
                <h1 className={`text-2xl md:text-3xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('agentsMarketplace')}</h1>
                <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-2`}>{t('agentsMarketplaceSubtitle')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAgents.map((agent, index) => {
                  const Icon = agent.icon;
                  return (
                    <div
                      key={agent.id}
                      onClick={() => {
                        if (onAgentSelect) {
                          setIsNavigating(true);
                          setTimeout(() => onAgentSelect(agent.id), 150);
                        }
                      }}
                      className={`rounded-2xl transition-all duration-300 ease-out-smooth flex flex-col overflow-hidden cursor-pointer group border animate-fade-in-up ${resolvedTheme === 'dark' ? 'bg-[#0B63CE]/5 border-[#0B63CE]/30 hover:border-[#00BFFF]/50 hover:shadow-xl hover:scale-[1.02]' : 'bg-white border-[#0B63CE]/20 hover:border-[#0B63CE]/40 hover:shadow-xl hover:scale-[1.02]'}`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className={`p-6 bg-gradient-to-br ${agent.color} text-white flex justify-between items-start`}>
                        <div>
                          <h3 className="text-xl font-semibold">{agent.name}</h3>
                          <p className="text-xs opacity-90">{agent.category}</p>
                        </div>
                        <div className="p-1 bg-white rounded-xl">
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="p-6 flex-grow">
                        <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-4`}>{agent.description}</p>
                        <ul className={`space-y-2 text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {Array.isArray(agent.features) && agent.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <Sparkles className="w-4 h-4 mr-2 text-[#00BFFF] flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className={`p-6 ${resolvedTheme === 'dark' ? 'border-t border-[#1e2328] bg-[#101214] text-gray-400' : 'border-t border-gray-200 bg-gray-50 text-gray-600'}`}>
                        <div className="flex justify-between items-center text-sm mb-3">
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1.5" />
                            {agent.usage}
                          </div>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 mr-1.5 text-yellow-400" />
                            {agent.rating} ({t('reviews', { count: Math.floor(agent.rating * 23) })})
                          </div>
                        </div>
                        <button
                          className="w-full px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center group-hover:scale-[1.02] transform-gpu hover:shadow-lg"
                          style={{ background: 'linear-gradient(90deg, #0B63CE, #3399FF)' }}
                        >
                          <span>{t('launchAgent')}</span>
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
      {isNavigating && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/20">
          <div className="h-12 w-12 rounded-full border-4 border-white/40 border-t-white animate-spin" />
        </div>
      )}
    </div>
  );
};

export default AgentsPage;