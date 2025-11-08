import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Star,
  Briefcase,
  Code as CodeIcon,
  Palette as PaletteIcon
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { agentData } from '../data/agentData';
import { useTheme } from '../contexts/ThemeContext';

interface AgentsPageProps {
  onAgentSelect?: (agentId: string) => void;
}

const AgentsPage: React.FC<AgentsPageProps> = ({ onAgentSelect }) => {
  const [activeDepartment, setActiveDepartment] = useState<'all' | 'technology' | 'business' | 'creative'>('all');
  const [isNavigating, setIsNavigating] = useState(false);
  const { t, language } = useLanguage();
  const { resolvedTheme } = useTheme();

  const agents = agentData.map(agent => {
    const agentId = agent.id as 'data' | 'telesales' | 'qa' | 'hr' | 'marketing' | 'gamedev' | 'design' | 'training' | 'prompt-optimizer' | 'research-documentation' | 'game-mechanics' | 'frontend-dev' | 'finance-accounting' | 'employee-training' | 'compliance-legal';
    return {
      ...agent,
      name: t(`agentsPage.${agentId}.name`),
      description: t(`agentsPage.${agentId}.description`),
      features: (t(`agentsPage.${agentId}.features`) as unknown as string[]),
      category: t(agent.categoryKey),
      usage: t('usageThisWeek', { count: Math.floor(Math.random() * 200) + 50 }),
    };
  });

  const departments = [
    { id: 'all' as const, name: 'All Departments', icon: null },
    { id: 'technology' as const, name: 'Technology', icon: CodeIcon },
    { id: 'business' as const, name: 'Business', icon: Briefcase },
    { id: 'creative' as const, name: 'Creative', icon: PaletteIcon },
  ];

  const filteredAgents = agents.filter(agent => {
    if (activeDepartment === 'all') return true;
    return agent.department === activeDepartment;
  });

  const groupedAgents = React.useMemo(() => {
    const groups: Record<string, typeof agents> = {
      technology: [],
      business: [],
      creative: [],
    };

    filteredAgents.forEach(agent => {
      if (agent.department && groups[agent.department]) {
        groups[agent.department].push(agent);
      }
    });

    return groups;
  }, [filteredAgents]);

  const renderAgentCard = (agent: typeof agents[0]) => {
    const Icon = agent.icon;
    return (
      <div
        key={agent.id}
        onClick={() => {
          if (onAgentSelect && !agent.comingSoon) {
            setIsNavigating(true);
            setTimeout(() => onAgentSelect(agent.id), 150);
          }
        }}
        className={`rounded-2xl transition-all duration-200 ease-out-smooth flex flex-col overflow-hidden border ${agent.comingSoon ? 'cursor-not-allowed opacity-75' : 'cursor-pointer group'} ${resolvedTheme === 'dark' ? 'bg-[#0B63CE]/5 border-[#0B63CE]/30' : 'bg-white border-[#0B63CE]/20'} ${!agent.comingSoon && (resolvedTheme === 'dark' ? 'hover:border-[#00BFFF]/50 hover:shadow-lg' : 'hover:border-[#0B63CE]/40 hover:shadow-lg')}`}
      >
        <div className={`p-6 bg-gradient-to-br ${agent.color} text-white flex justify-between items-start relative`}>
          {agent.comingSoon && (
            <div className="absolute top-4 right-4 bg-yellow-500 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
              Coming Soon
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold">{agent.name}</h3>
            <p className="text-xs opacity-90">{agent.category}</p>
          </div>
          <div className="p-1 bg-white rounded-xl" style={{ marginTop: agent.comingSoon ? '32px' : '0' }}>
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
            disabled={agent.comingSoon}
            className={`w-full px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center ${!agent.comingSoon ? 'group-hover:scale-[1.02] transform-gpu hover:shadow-lg' : 'opacity-60 cursor-not-allowed'}`}
            style={{ background: 'linear-gradient(90deg, #0B63CE, #3399FF)' }}
          >
            <span>{agent.comingSoon ? 'Coming Soon' : t('launchAgent')}</span>
            {!agent.comingSoon && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`rounded-2xl p-6 border mb-6 ${resolvedTheme === 'dark' ? 'bg-[#0B63CE]/10 border-[#0B63CE]/30' : 'bg-white border-[#0B63CE]/20'}`}>
          <div className="mb-6">
            <h1 className={`text-2xl md:text-3xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('agentsMarketplace')}</h1>
            <p className={`${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-2`}>{t('agentsMarketplaceSubtitle')}</p>
          </div>

          {/* Department Tabs */}
          <div className="flex flex-wrap gap-3 mb-8">
            {departments.map((dept) => {
              const DeptIcon = dept.icon;
              return (
                <button
                  key={dept.id}
                  onClick={() => setActiveDepartment(dept.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    activeDepartment === dept.id
                      ? 'text-white shadow-lg scale-105'
                      : resolvedTheme === 'dark'
                      ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={
                    activeDepartment === dept.id
                      ? { background: 'linear-gradient(90deg, #0B63CE, #3399FF)' }
                      : undefined
                  }
                >
                  {DeptIcon && <DeptIcon className="w-5 h-5" />}
                  <span>{dept.name}</span>
                </button>
              );
            })}
          </div>

          {/* Show all agents if "All Departments" is selected */}
          {activeDepartment === 'all' ? (
            <div className="space-y-10">
              {/* Technology Department */}
              {groupedAgents.technology.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <CodeIcon className={`w-6 h-6 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h2 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Technology</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedAgents.technology.map(agent => renderAgentCard(agent))}
                  </div>
                </div>
              )}

              {/* Business Department */}
              {groupedAgents.business.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Briefcase className={`w-6 h-6 ${resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                    <h2 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Business</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedAgents.business.map(agent => renderAgentCard(agent))}
                  </div>
                </div>
              )}

              {/* Creative Department */}
              {groupedAgents.creative.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <PaletteIcon className={`w-6 h-6 ${resolvedTheme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                    <h2 className={`text-xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Creative</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedAgents.creative.map(agent => renderAgentCard(agent))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Show only selected department */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map(agent => renderAgentCard(agent))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentsPage;
