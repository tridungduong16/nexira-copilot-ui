import { createContext, useState, useContext, ReactNode } from 'react';
import { translations } from '../translations';

type Language = 'en' | 'vi';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const resolvePath = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const t = (key: string, replacements?: { [key: string]: string | number }) => {
    const translation = resolvePath(translations[language], key) || resolvePath(translations.en, key);

    if (translation === undefined) {
      return key;
    }

    if (typeof translation === 'string') {
      if (replacements) {
        let replaced = translation;
        Object.keys(replacements).forEach(rKey => {
          replaced = replaced.replace(`{${rKey}}`, String(replacements[rKey]));
        });
        return replaced;
      }
      return translation;
    }
    
    // For arrays and objects, return as is.
    return translation;
  };


  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
