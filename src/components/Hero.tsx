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
    <div className={`relative overflow-hidden min-h-screen ${isDark ? 'bg-[#0B0C0F]' : 'bg-white'}`}>
      {/* Subtle gradient overlay for depth */}
      {isDark && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/20 via-transparent to-transparent pointer-events-none" />
      )}

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
        <div className="text-center">
          {/* Main Title */}
          <h1 className={`text-5xl md:text-6xl font-bold mb-6 tracking-tight ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {t('heroTitle')}
          </h1>

          {/* Subtitle */}
          <p className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {t('heroSubtitle')}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative group">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
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
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-400 focus:ring-white/20 hover:bg-white/10'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-gray-300 hover:bg-gray-100'
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
              className={`px-8 py-4 rounded-full font-semibold border transition-all duration-300 ${
                isDark
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  : 'bg-gray-900 border-gray-900 text-white hover:bg-gray-800'
              }`}
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
