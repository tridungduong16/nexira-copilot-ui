import React from 'react';
import { MessageSquare, Brain, Zap, ArrowRight } from 'lucide-react';

const steps = [
	{
		step: 1,
		title: 'Ask a question',
		description: 'Tell your AI assistant what you need help with',
		icon: MessageSquare,
		color: 'from-blue-500 to-blue-600'
	},
	{
		step: 2,
		title: 'AI Thinks',
		description: 'Our specialized AI processes your request',
		icon: Brain,
		color: 'from-purple-500 to-purple-600'
	},
	{
		step: 3,
		title: 'Get Results',
		description: 'Receive solutions tailored for your department',
		icon: Zap,
		color: 'from-yellow-500 to-yellow-600'
	}
];

const HowItWorks: React.FC = () => {
  return (
    <section className="py-20 bg-[#001F3F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">Get started with AI assistance in just three simple steps</p>
        </div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => {
						const IconComponent = step.icon;
						return (
              <div key={step.step} className="text-center relative">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-xl border" style={{ background: 'rgba(11, 99, 206, 0.15)', borderColor: 'rgba(0, 191, 255, 0.3)' }}>
                    <IconComponent className="h-8 w-8 text-[#00BFFF]" />
                  </div>
                </div>

								<div className="mb-4">
									<span className="text-sm font-medium text-[#00BFFF]">
										Step {step.step}
									</span>
									<h3 className="text-xl font-bold text-white mt-1">
										{step.title}
									</h3>
								</div>

                <p className="text-gray-300">{step.description}</p>

                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full transform -translate-x-1/2 translate-x-6">
                    <ArrowRight className="h-6 w-6 text-[#0B63CE]" />
                  </div>
                )}
							</div>
						);
					})}
				</div>

        <div className="mt-16 text-center">
          <button
            className="px-8 py-4 rounded-full font-semibold text-white transition-all duration-300 hover:shadow-xl hover:scale-105"
            style={{ background: 'linear-gradient(90deg, #0B63CE, #3399FF)' }}
          >
            Get Started Now
          </button>
        </div>
			</div>
		</section>
	);
};

export default HowItWorks;