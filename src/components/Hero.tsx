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

  //<div className="relative overflow-hidden text-gray-200 trill-theme -mt-20 pt-20 min-h-[100vh] pb-24 md:pb-32">
  return (
      <div className="absolute inset-0">
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          opacity: 0.7,
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      />
      {/* Light overlay only for dark theme */}
      {isDark && <div className="pointer-events-none absolute inset-0 bg-black/10" />}
      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
        <div className="text-center">
          {/* Main Title */}
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            {t('heroTitle')}
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/85 mb-10 max-w-3xl mx-auto drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]">
            {t('heroSubtitle')}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative group">
              {/* Subtle transparent glass glow on hover */}
              <div className="pointer-events-none absolute -inset-[2px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/25 blur-[3px]" />
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10 ${isDark ? 'text-white/70' : 'text-gray-400'}`} />
              <form onSubmit={(e) => { e.preventDefault(); const form = e.currentTarget; const input = form.querySelector('input') as HTMLInputElement | null; const v = input?.value || ''; if (onSubmitPrompt && v.trim()) onSubmitPrompt(v.trim()); }}>
                <input
                  type="text"
                  placeholder={t('heroSearchPlaceholder')}
                  className={`relative z-10 w-full pl-12 pr-4 py-4 rounded-2xl glass-ios transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 hover:glass-ios-hover font-medium ${
                    isDark ? 'text-white placeholder-gray-300 caret-white' : 'text-gray-900 placeholder-gray-600 caret-gray-900'
                  }`}
                />
              </form>
            </div>
          </div>

          {/* Removed tags row for a cleaner hero */}

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
              className={`px-8 py-4 rounded-full font-semibold glass-ios glass-ios-hover ${isDark ? 'text-white' : 'text-gray-800'}`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {t('exploreNow')}
              </span>
            </GlassButton>
          </div>
        </div>
      </div>
      {/* Decorative subtle accents already added above */}
    </div>
  );
};

export default Hero;
