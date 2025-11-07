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
    <section className="pt-12 sm:pt-16 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* remove SnowUI header to let background breathe */}

        {/* Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <div key={tile.id} className={`rounded-[32px] p-8 sm:p-10 ${tile.className}`}>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-white/10">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">{tile.title}</h3>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-gray-300/90 max-w-md">{tile.subtitle}</p>
                <div className="mt-8">
                  <button className="inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white">
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

