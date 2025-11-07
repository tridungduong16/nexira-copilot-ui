import React from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const RecentActivity: React.FC = () => {
	const { t } = useLanguage();

	const activities = [
		{
			id: 1,
			agent: t('recentActivity.agents.promptOptimizer'),
			action: t('recentActivity.items.promptOptimizer'),
			time: t('recentActivity.times.oneHourAgo'),
			icon: '🚀',
		},
		{
			id: 2,
			agent: t('recentActivity.agents.designAgent'),
			action: t('recentActivity.items.designAgent'),
			time: t('recentActivity.times.twoHoursAgo'),
			icon: '🎨',
		},
		{
			id: 3,
			agent: t('recentActivity.agents.promptOptimizer'),
			action: t('recentActivity.items.logoCreator'),
			time: t('recentActivity.times.threeHoursAgo'),
			icon: '✨',
		},
		{
			id: 4,
			agent: t('recentActivity.agents.designAgent'),
			action: t('recentActivity.items.taglineGenerator'),
			time: t('recentActivity.times.fourHoursAgo'),
			icon: '💡',
		},
		{
			id: 5,
			agent: t('recentActivity.agents.promptOptimizer'),
			action: t('recentActivity.items.blogPostOptimizer'),
			time: t('recentActivity.times.fiveHoursAgo'),
			icon: '📝',
		},
	];

	return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
						{t('recentActivity.title')}
					</h2>
          <p className="text-xl text-gray-400">
						{t('recentActivity.subtitle')}
					</p>
				</div>

        <div className="bg-white/5 border border-white/10 rounded-2xl shadow-sm overflow-hidden backdrop-blur-md">
          <div className="px-6 py-4 bg-white/5 border-b border-white/10">
						<div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-white">
								{t('recentActivity.feedTitle')}
							</h3>
						</div>
					</div>

          <div className="divide-y divide-white/10">
						{activities.map((activity) => {
							return (
								<div
									key={activity.id}
                  className="px-6 py-4 hover:bg-white/5 transition-colors"
								>
									<div className="flex items-start space-x-4">
										<div className="flex-shrink-0">
                      <div className="bg-white/5 border border-white/10 p-2 rounded-lg">
												<span className="text-xl">{activity.icon}</span>
											</div>
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-white">
													{activity.agent}
												</p>
											</div>
                      <p className="text-sm text-gray-400 mb-2">
												{activity.action}
											</p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
												{activity.time}
											</p>
										</div>
									</div>
								</div>
							);
						})}
					</div>

          <div className="px-6 py-4 bg-white/5 border-t border-white/10">
            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
							{t('recentActivity.viewAll')} →
						</button>
					</div>
				</div>
			</div>
		</section>
	);
};

export default RecentActivity;