import React from 'react';
import { 
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { agentData } from '../data/agentData';

interface AIAgentsProps {
  onAgentSelect?: (agentId: string) => void;
}

const AIAgents: React.FC<AIAgentsProps> = ({ onAgentSelect }) => {
  const { t } = useLanguage();

  const agents = agentData.map(agent => {
    const agentId = agent.id.replace('-', ''); // Handle 'prompt-optimizer'
    return {
      ...agent,
      name: t(`aiAgents.${agentId}.name`),
      description: t(`aiAgents.${agentId}.description`),
      features: [
        t(`aiAgents.${agentId}.features.0`),
        t(`aiAgents.${agentId}.features.1`),
        t(`aiAgents.${agentId}.features.2`),
        t(`aiAgents.${agentId}.features.3`),
      ],
      usage: t('aiAgents.hr.usage', { count: 127 }) // This needs to be dynamic
    }
  }).slice(0, 7); // Show a subset of agents on the homepage

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('aiAgents.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('aiAgents.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {agents.map((agent) => {
            const IconComponent = agent.icon;
            return (
              <div
                key={agent.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${agent.color}`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{agent.usage}</p>
                      <div className="flex items-center text-yellow-500">
                        <Sparkles className="h-3 w-3 mr-1" />
                        <span className="text-xs">{t('aiAgents.active')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{agent.name}</h3>
                  <p className="text-gray-600 mb-4">{agent.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    {agent.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-500">
                        <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => onAgentSelect?.(agent.id)}
                    className="w-full bg-gray-50 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2 group-hover:bg-blue-50 group-hover:text-blue-600"
                  >
                    <span>{t('aiAgents.startChatting')}</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AIAgents;