import React from 'react';
import { ShoppingBag, BookOpen, FlaskConical, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const HomeShowcase: React.FC = () => {
  const { t } = useLanguage();

  const tiles = [
    {
      id: 'marketplace',
      title: t('header.marketplace'),
      subtitle: t('agentsMarketplaceSubtitle'),
      icon: ShoppingBag,
      className: 'bg-gradient-to-b from-[#15131D] to-[#393540] text-white',
    },
    {
      id: 'knowledge',
      title: t('knowledgePage.title'),
      subtitle: t('knowledgePage.subtitle'),
      icon: BookOpen,
      className: 'bg-white/5 border border-white/10 backdrop-blur-md text-gray-100',
    },
    {
      id: 'prompt-lab',
      title: t('promptOptimizerPage.title'),
      subtitle: t('promptOptimizerPage.labSubtitle'),
      icon: FlaskConical,
      className: 'bg-white/5 border border-white/10 backdrop-blur-md text-gray-100',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-[#001F3F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <div
                key={tile.id}
                className="rounded-3xl p-8 sm:p-10 border backdrop-blur-sm text-white hover:shadow-xl transition-all duration-300"
                style={{
                  background: 'rgba(11, 99, 206, 0.1)',
                  borderColor: 'rgba(11, 99, 206, 0.3)'
                }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(0, 191, 255, 0.2)' }}>
                      <Icon className="h-6 w-6 text-[#00BFFF]" />
                    </div>
                    <h3 className="text-xl font-bold">{tile.title}</h3>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-gray-300 max-w-md">{tile.subtitle}</p>
                <div className="mt-8">
                  <button className="inline-flex items-center gap-2 text-sm font-medium text-[#00BFFF] hover:text-white transition-colors">
                    <span>Explore</span>
                    <ArrowRight className="h-4 w-4" />
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

export default HomeShowcase;

