import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import GlassButton from './ui/GlassButton';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface HeroProps {
  onSubmitPrompt?: (value: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onSubmitPrompt }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={`relative overflow-hidden min-h-screen ${isDark ? 'bg-[#001F3F]' : 'bg-[#E6F0FF]'}`}>
      {/* Sky Gradient Overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #0B63CE 0%, #3399FF 50%, #00BFFF 100%)'
        }}
      />

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
        <div className="text-center">
          {/* Main Title with Gradient */}
          <h1 className={`text-5xl md:text-7xl font-bold mb-6 tracking-tight ${
            isDark ? 'text-white' : 'text-[#001F3F]'
          }`}
          style={{
            background: isDark ? 'linear-gradient(90deg, #3399FF, #00BFFF)' : 'linear-gradient(90deg, #0B63CE, #3399FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: isDark ? 'transparent' : undefined,
            backgroundClip: isDark ? 'text' : undefined
          }}>
            {t('heroTitle')}
          </h1>

          {/* Subtitle */}
          <p className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {t('heroSubtitle')}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative group">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10 ${
                isDark ? 'text-[#00BFFF]' : 'text-[#0B63CE]'
              }`} />
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.querySelector('input') as HTMLInputElement | null;
                const v = input?.value || '';
                if (onSubmitPrompt && v.trim()) onSubmitPrompt(v.trim());
              }}>
                <input
                  type="text"
                  placeholder={t('heroSearchPlaceholder')}
                  className={`relative z-10 w-full pl-12 pr-4 py-4 rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 font-medium ${
                    isDark
                      ? 'bg-white/10 border-[#0B63CE]/30 text-white placeholder-gray-300 focus:ring-[#0B63CE]/50 hover:bg-white/15 hover:border-[#0B63CE]/50'
                      : 'bg-white border-[#0B63CE]/20 text-gray-900 placeholder-gray-500 focus:ring-[#0B63CE]/50 hover:bg-white/80 hover:border-[#0B63CE]/40'
                  }`}
                />
              </form>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center mt-2">
            <GlassButton
              onClick={() => {
                if (onSubmitPrompt) {
                  onSubmitPrompt('');
                } else {
                  navigate('/chat');
                }
              }}
              className="px-8 py-4 rounded-full font-semibold border-0 transition-all duration-300 text-white hover:shadow-xl hover:scale-105"
              style={{
                background: 'linear-gradient(90deg, #0B63CE, #3399FF)'
              }}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {t('exploreNow')}
              </span>
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
