import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Users, MessageSquare, Settings as SettingsIcon, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { agentData } from '../data/agentData';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const highlights = [
    {
      icon: Users,
      title: 'Multi-disciplinary AI agents',
      description: 'Access specialized agents across design, content, HR, and development',
    },
    {
      icon: Users,
      title: 'Context-aware collaboration',
      description: 'Agents work together seamlessly for complex projects',
    },
    {
      icon: MessageSquare,
      title: 'Human-like conversations',
      description: 'Natural and intuitive conversational workflow',
    },
    {
      icon: SettingsIcon,
      title: 'Tool integrations',
      description: 'Connect with your favorite apps and creative tools',
    },
    {
      icon: Globe,
      title: 'Scalable for all teams',
      description: 'Perfect for startups, teams, and enterprises',
    },
  ];

  const featuredAgents = agentData.filter(agent => agent.popular).slice(0, 5).map(agent => ({
    ...agent,
    name: t(`agentsPage.${agent.id}.name`)
  }));

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#001F3F]' : 'bg-[#E6F0FF]'}`}>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, #0B63CE 0%, #3399FF 50%, #00BFFF 100%)'
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8"
              style={{
                background: 'rgba(11, 99, 206, 0.1)',
                borderColor: 'rgba(11, 99, 206, 0.3)'
              }}>
              <Sparkles className="w-4 h-4 text-[#00BFFF]" />
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-[#001F3F]'}`}>
                Your All-in-One Multi-Agent Platform
              </span>
            </div>

            {/* Main Title */}
            <h1
              className={`text-5xl md:text-7xl font-bold mb-6 tracking-tight ${isDark ? 'text-white' : 'text-[#001F3F]'}`}
              style={{
                background: 'linear-gradient(90deg, #0B63CE, #3399FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: isDark ? 'transparent' : undefined,
                backgroundClip: isDark ? 'text' : undefined
              }}
            >
              Nexira Copilot
            </h1>

            {/* Subtitle */}
            <p className={`text-xl md:text-2xl mb-8 max-w-4xl mx-auto font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              For Work, Creativity, and Innovation
            </p>

            {/* Description */}
            <p className={`text-lg md:text-xl mb-12 max-w-4xl mx-auto leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Nexira Copilot is a next-generation multi-agent ecosystem that brings together intelligent digital co-workers — each designed to supercharge your productivity and creativity. Whether you're designing a brand identity, writing a blog, coding an app, or managing a team, Nexira Copilot connects you with specialized AI agents who think, collaborate, and create like human experts.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate('/marketplace')}
                className="px-8 py-4 rounded-full font-semibold text-white transition-all duration-300 hover:shadow-xl hover:scale-105"
                style={{ background: 'linear-gradient(90deg, #0B63CE, #3399FF)' }}
              >
                Explore Agents
              </button>
              <button
                onClick={() => navigate('/chat')}
                className={`px-8 py-4 rounded-full font-semibold transition-all duration-300 border ${
                  isDark
                    ? 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                    : 'bg-white border-[#0B63CE]/30 text-[#0B63CE] hover:border-[#0B63CE]/50'
                }`}
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <p className="text-lg md:text-xl max-w-4xl mx-auto leading-relaxed">
              With a single click, you can access an ever-growing roster of professional agents — from designers to developers, writers to strategists — all working in sync through an intuitive, conversational interface. Nexira Copilot helps you <span className="font-semibold text-[#0B63CE]">ideate faster</span>, <span className="font-semibold text-[#0B63CE]">execute smarter</span>, and <span className="font-semibold text-[#0B63CE]">scale effortlessly</span>.
            </p>
          </div>

          {/* Agent Icons */}
          <div className="flex flex-wrap justify-center gap-6 mb-20">
            {featuredAgents.map((agent, index) => {
              return (
                <div
                  key={index}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer"
                  style={{
                    background: 'rgba(11, 99, 206, 0.05)',
                    borderColor: 'rgba(11, 99, 206, 0.2)'
                  }}
                  onClick={() => navigate('/marketplace')}
                >
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${agent.color}`}>
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-[#001F3F]'}`}>
                    {agent.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Highlights */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-16 ${isDark ? 'text-white' : 'text-[#001F3F]'}`}>
            Key Highlights
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {highlights.map((highlight, index) => {
              const Icon = highlight.icon;
              return (
                <div
                  key={index}
                  className="p-8 rounded-2xl border transition-all duration-300 hover:shadow-xl"
                  style={{
                    background: 'rgba(11, 99, 206, 0.05)',
                    borderColor: 'rgba(11, 99, 206, 0.2)'
                  }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(0, 191, 255, 0.15)' }}>
                      <Icon className="w-6 h-6 text-[#00BFFF]" />
                    </div>
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#001F3F]'}`}>
                      {highlight.title}
                    </h3>
                  </div>
                  <p className={`text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {highlight.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-12 rounded-3xl border"
            style={{
              background: 'rgba(11, 99, 206, 0.08)',
              borderColor: 'rgba(11, 99, 206, 0.3)'
            }}>
            <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-[#001F3F]'}`}>
              Ready to Transform Your Workflow?
            </h2>
            <p className={`text-lg mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Join thousands of teams already using Nexira Copilot to accelerate their work and unleash creativity.
            </p>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-10 py-4 rounded-full font-semibold text-white text-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              style={{ background: 'linear-gradient(90deg, #0B63CE, #3399FF)' }}
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
