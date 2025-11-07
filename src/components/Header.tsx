import React, { useState } from 'react';
import LoadingOverlay from './ui/LoadingOverlay';
import { Menu, X, LogIn } from 'lucide-react';
import GlassButton from './ui/GlassButton';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import LoginModal from './ui/LoginModal';

interface HeaderProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  currentPage: string;
}

const Header: React.FC<HeaderProps> = ({ 
  isMobileMenuOpen, 
  setIsMobileMenuOpen, 
  currentPage
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      const provider = localStorage.getItem('nexira_login_provider');
      const storedUser = localStorage.getItem('nexira_user');
      const nameFromStorage = localStorage.getItem('nexira_user_name');
      let avatar = localStorage.getItem('nexira_user_avatar') || '';
      const email = localStorage.getItem('nexira_user_email') || '';
      const isRealProvider = provider === 'google' || provider === 'email';
      // Ensure stable user-id is set for backend authorization
      try {
        const existingId = localStorage.getItem('nexira_user_id');
        if (!existingId && email) {
          localStorage.setItem('nexira_user_id', email);
        }
      } catch {}
      if (isRealProvider) {
        let finalName = nameFromStorage;
        let storedName = '';
        if (storedUser) {
          try { storedName = (JSON.parse(storedUser).name as string) || ''; } catch {}
        }
        const isPlaceholder = !finalName || ['Google User', 'Email User', 'Guest'].includes(finalName);
        if ((isPlaceholder && storedName) || (!finalName && storedName)) {
          finalName = storedName;
          try { localStorage.setItem('nexira_user_name', finalName); } catch {}
        }
        if (!finalName) {
          finalName = provider === 'google' ? 'Google User' : 'Email User';
        }
        // If avatar missing for google/email, try fetch from backend user profile
        if ((!avatar || avatar === '') && email) {
          try {
            const resp = await fetch(import.meta.env.VITE_API_URL + '/user/info', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
              body: JSON.stringify({ email })
            });
            const data = await resp.json();
            const pic = (data && data.picture) || '';
            const backendName = (data && (data.name || data.username || data.display_name)) || '';
            if (pic) {
              avatar = pic;
              try { localStorage.setItem('nexira_user_avatar', avatar); } catch {}
            }
            if (backendName) {
              finalName = backendName;
              try { localStorage.setItem('nexira_user_name', backendName); } catch {}
            }
          } catch {}
        }
        setUserName(finalName);
        setUserAvatar(avatar || '/figma/icon-user-circle.svg');

        // Close any login modal listeners by marking session as acknowledged
        try { sessionStorage.setItem('nexira_login_ack', '1'); } catch {}
        // Ensure modal is closed after successful login (OAuth redirect or One Tap)
        setShowLogin(false);

        // Persist user info without overwriting avatar with a placeholder
        try {
          await fetch(import.meta.env.VITE_API_URL + '/user/update_info', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'accept': 'application/json'
            },
            body: JSON.stringify({
              email: email,
              provider: provider,
              name: finalName,
              // Only send picture if we actually have one, avoid blank overwrite
              ...(avatar ? { picture: avatar } : {}),
            })
          });
        } catch {}

      } else {
        if (provider === 'guest') {
          setUserName('Guest');
          setUserAvatar('/frontend/public/capybara.png');
        } else {
          setUserName(null);
          setUserAvatar(null);
        }
      }
    };
    load();
    window.addEventListener('storage', load);
    // Explicit custom event from LoginModal to rehydrate immediately
    window.addEventListener('nexira-login', load as any);
    return () => {
      window.removeEventListener('storage', load);
      window.removeEventListener('nexira-login', load as any);
    };
  }, []);

  // Auto prompt login on first visit in this session (unless already logged in)
  React.useEffect(() => {
    const provider = localStorage.getItem('nexira_login_provider');
    const promptedThisSession = sessionStorage.getItem('nexira_login_prompted');
    const alreadyLoggedInThisSession = sessionStorage.getItem('nexira_login_ack') === '1';
    // If never chosen or previously chose 'guest', show modal again at reload
    if (!alreadyLoggedInThisSession && (!provider || provider === 'guest')) {
      if (!promptedThisSession) {
        setTimeout(() => setShowLogin(true), 250);
        sessionStorage.setItem('nexira_login_prompted', '1');
      } else if (provider === 'guest') {
        setTimeout(() => setShowLogin(true), 250);
      }
    }
  }, []);
  const handleNavClick = (page: string) => {
    const path = page === 'agents' ? '/marketplace' : `/${page}`;
    if ((page === 'agents' && currentPage === 'agents') || page === currentPage) {
      return;
    }
    setIsLoading(true);
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      navigate(path);
      setIsLoading(false);
    }, 250);
  };

  const isGlass = ['agents', 'knowledge', 'settings', 'help', 'chat', 'tickets'].includes(currentPage);

  // using GlassButton below instead of navBtnClass

  return (
    <>
    <header className={`bg-transparent sticky top-0 z-50 overflow-hidden`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`${currentPage === 'home' ? 'mt-2 md:mt-3 rounded-full glass-ios px-4' : 'mt-2 md:mt-3 rounded-full glass-white glass-white-hover px-4'} }`}>
        <div className="flex justify-between items-center h-16 relative">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => handleNavClick('agents')}
          >
            <div className="w-10 h-10">
              <img
                src="/image.png"
                alt="Nexira AI"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl font-bold leading-none text-[#0B63CE]">{t('header.nexiraAI')}</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-3 absolute left-1/2 -translate-x-1/2">
            {([
              {k: 'agents', label: t('header.marketplace')},
              {k: 'knowledge', label: t('header.knowledge')},
              {k: 'settings', label: t('header.settings')},
              {k: 'help', label: t('header.help')},
            ] as const).map((item) => {
              const isActive = currentPage === item.k || (item.k === 'agents' && currentPage.includes('-analyst'));
              if (isGlass) {
                const navToneClass = 'glass-white glass-white-hover';
                return (
                  <GlassButton
                    key={item.k}
                    className={`px-4 py-2 rounded-full ${navToneClass} ${isActive ? 'opacity-100' : 'opacity-80'}`}
                    onClick={() => handleNavClick(item.k)}
                  >
                    <span className={`font-medium ${isActive ? 'text-[#0B63CE]' : 'text-gray-700'}`}>{item.label}</span>
                  </GlassButton>
                );
              }
              return (
                <button
                  key={item.k}
                  onClick={() => handleNavClick(item.k)}
                  className={`font-medium transition-colors ${isActive ? 'text-[#0B63CE]' : 'text-gray-700 hover:text-[#00BFFF]'}`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Compact login button → detailed login & profile moved to Settings */}
            {userName ? (
              <button
                onClick={() => navigate('/settings')}
                className={`${isGlass ? 'btn-glass' : 'bg-white'} pl-2 pr-3 py-1.5 rounded-full flex items-center gap-2 text-[#0B63CE]`}
                title="Open settings"
              >
                <img src={userAvatar || '/figma/icon-user-circle.svg'} alt="avatar" className="h-6 w-6 rounded-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/figma/icon-user-circle.svg'; }} />
                <span className="hidden sm:inline text-sm font-medium">{userName}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className={`${isGlass ? 'btn-glass' : 'bg-white'} px-3 py-2 rounded-full flex items-center gap-2 text-[#0B63CE]`}
                title="Sign in"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">{t('header.login')}</span>
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className={`md:hidden ${isGlass ? 'border-transparent bg-transparent backdrop-blur-md' : 'border-t border-gray-200 bg-white'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <button
              onClick={() => handleNavClick('agents')}
              className={`block w-full text-left px-4 py-2 rounded-full font-medium ${currentPage === 'agents' || currentPage.includes('-analyst') ? (isGlass ? 'btn-glass text-gray-800' : 'text-blue-600 bg-blue-50') : (isGlass ? 'chip-glass text-gray-800 hover:opacity-90' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100')}`}
            >
              {t('header.marketplace')}
            </button>
            <button 
              onClick={() => handleNavClick('knowledge')}
              className={`block w-full text-left px-4 py-2 rounded-full font-medium ${currentPage === 'knowledge' ? (isGlass ? 'btn-glass text-gray-800' : 'text-blue-600 bg-blue-50') : (isGlass ? 'chip-glass text-gray-800 hover:opacity-90' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100')}`}
            >
              {t('header.knowledge')}
            </button>
            <button 
              onClick={() => handleNavClick('settings')}
              className={`block w-full text-left px-4 py-2 rounded-full font-medium ${currentPage === 'settings' ? (isGlass ? 'btn-glass text-gray-800' : 'text-blue-600 bg-blue-50') : (isGlass ? 'chip-glass text-gray-800 hover:opacity-90' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100')}`}
            >
              {t('header.settings')}
            </button>
            <button 
              onClick={() => handleNavClick('help')}
              className={`block w-full text-left px-4 py-2 rounded-full font-medium ${currentPage === 'help' ? (isGlass ? 'btn-glass text-gray-800' : 'text-blue-600 bg-blue-50') : (isGlass ? 'chip-glass text-gray-800 hover:opacity-90' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100')}`}
            >
              {t('header.help')}
            </button>
          </div>
        </div>
      )}
      <LoginModal
        open={showLogin}
        onSelect={async (provider, { email, password }) => {
          localStorage.setItem('nexira_login_provider', provider);
          // mark acknowledged for this session to avoid re-prompting
          sessionStorage.setItem('nexira_login_ack', '1');
          // Clear placeholder info when choosing guest so header stays anonymous
          if (provider === 'guest') {
            localStorage.removeItem('nexira_user_name');
            localStorage.removeItem('nexira_user_avatar');
          }
          setShowLogin(false);
          if (provider === 'guest') {
            // Immediately reflect Guest in header
            setUserName('Guest');
            setUserAvatar('/frontend/public/capybara.png');
            try { localStorage.setItem('nexira_user_avatar', '/frontend/public/capybara.png'); } catch {}
          } else {
            // For google/email we refresh from storage to reflect name
            const name = localStorage.getItem('nexira_user_name');
            const avatar = localStorage.getItem('nexira_user_avatar');
            if (name && name !== 'Guest') {
              setUserName(name);
              setUserAvatar(avatar || '/figma/icon-user-circle.svg');
            }
            await fetch(import.meta.env.VITE_API_URL + '/user/update_info', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json'
              },
              body: JSON.stringify({
                email: email,
                provider: provider,
                password: password,
                name: name,
                picture: avatar || '/figma/icon-user-circle.svg',
              })
            });
          }
          // notify same-tab listeners (Settings) to hydrate immediately
          window.dispatchEvent(new StorageEvent('storage'));
          // After choosing, show loading overlay briefly and go to settings to customize avatar and name
          setIsLoading(true);
          setTimeout(() => {
            navigate('/settings');
            setIsLoading(false);
          }, 450);
          // refresh state to reflect in header immediately (only if not guest)
          const name = localStorage.getItem('nexira_user_name');
          const avatar = localStorage.getItem('nexira_user_avatar');
          if (provider !== 'guest' && name) {
            setUserName(name);
            setUserAvatar(avatar || '/figma/icon-user-circle.svg');
          }
        }}
      />
    </header>
    <LoadingOverlay show={isLoading} iconSrc={'/image.png'} />
    </>
  );
};

export default Header;