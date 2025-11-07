import React from 'react';
import { Heart, Github, Mail, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-100 text-gray-800 py-12 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8">
                <img 
                  src="/image.png" 
                  alt="Nexira AI" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-lg font-semibold">Nexira AI</h3>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              Empowering teams with intelligent AI assistance across all departments. 
              Built for productivity, designed for collaboration.
            </p>
            <div className="flex items-center text-gray-600">
              <span>Made with</span>
              <Heart className="h-4 w-4 mx-1 text-red-500" />
              <span>by your in-house AI team</span>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-800">{t('footer.product')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">{t('footer.features')}</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">{t('footer.integrations')}</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">{t('footer.pricing')}</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">{t('footer.faq')}</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-800">{t('footer.company')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">{t('footer.aboutUs')}</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">{t('footer.careers')}</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">{t('footer.blog')}</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">{t('footer.contactUs')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-800">{t('footer.resources')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">{t('footer.documentation')}</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">{t('footer.community')}</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">{t('footer.apiStatus')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-800">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">{t('footer.privacyPolicy')}</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">{t('footer.termsOfService')}</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex space-x-6 mb-4 md:mb-0">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm">{t('footer.security')}</span>
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">{t('footer.terms')}</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{t('footer.contact')}</span>
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2">
              <Github className="h-4 w-4" />
              <span className="text-sm">{t('footer.github')}</span>
            </a>
          </div>
          
          <div className="text-sm text-gray-600">
            © 2024 Nexira AI. {t('footer.allRightsReserved')}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;