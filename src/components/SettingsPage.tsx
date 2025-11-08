import React, { useEffect, useMemo, useState } from 'react';
import { Check, Globe, Moon, Sun, Monitor, Database, Shield, SlidersHorizontal, Sparkles, Trash2, Download, ChevronDown, Brain, PlugZap, Plus, KeyRound, Link2 } from 'lucide-react';
import LoginModal from './ui/LoginModal';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import LoadingOverlay from './ui/LoadingOverlay';

type TabKey = 'general' | 'appearance' | 'features' | 'privacy' | 'personalization' | 'integrations';

// Stable helper components moved outside to prevent remounting on every state change
const Section: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({ title, description, children }) => {
  const { isDark } = useTheme();
  return (
    <div className={`${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'} rounded-2xl p-6 sm:p-8`}>
      <div className="mb-6">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        {description && <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>}
      </div>
      {children}
    </div>
  );
};

const RadioCard: React.FC<{
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = ({ selected, onClick, title, description, icon }) => {
  const { isDark } = useTheme();
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-4 rounded-xl border p-4 transition-colors ${
        selected
          ? (isDark ? 'border-blue-500/40 bg-blue-500/10' : 'border-blue-500/30 bg-blue-50')
          : (isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50')
    }`}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</span>
          {selected && <Check className="h-4 w-4 text-blue-400" />}
        </div>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
      </div>
    </button>
  );
};

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }> = ({ checked, onChange, label, description }) => {
  const { isDark } = useTheme();
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <div>
        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</p>
        {description && <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : (isDark ? 'bg-white/20' : 'bg-gray-300')}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  );
};

// keep but exportable for potential reuse; not currently used in this file
// ModelChip reserved for future use

const SettingsPage: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [langLoading, setLangLoading] = useState(false);
  // theme is managed by ThemeContext now
  const [defaultModel, setDefaultModel] = useState('gpt-4o-mini');
  const [provider, setProvider] = useState('openai');
  // reserved appearance states (not used in UI)
  const [enableSuggestions, setEnableSuggestions] = useState(true);
  const [enableCodeInterpreter, setEnableCodeInterpreter] = useState(false);
  const [rememberConversations, setRememberConversations] = useState(true);
  const [customizeText, setCustomizeText] = useState('');
  const [autoMemories, setAutoMemories] = useState(true);
  const [userRules, setUserRules] = useState<string[]>([
    'Always ask me to run terminal command to test server or new feature before end agent tasks',
    'Do not make redundant comments or docstring, just basic docstring',
    'Use uv tools (uv run/sync/add) instead of pip',
  ]);
  const [newRule, setNewRule] = useState('');
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [loginProvider, setLoginProvider] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  type McpEndpoint = { id: string; name: string; url: string; apiKey?: string; enabled: boolean };
  const [mcpEndpoints, setMcpEndpoints] = useState<McpEndpoint[]>([
    { id: 'figma', name: 'Figma MCP', url: '', apiKey: '', enabled: false },
    { id: 'browser', name: 'Browser MCP', url: '', apiKey: '', enabled: false },
    { id: 'github', name: 'GitHub MCP', url: '', apiKey: '', enabled: false },
  ]);
  const [newMcp, setNewMcp] = useState<{ name: string; url: string; apiKey: string }>({ name: '', url: '', apiKey: '' });

  const PROVIDER_MODELS: Record<string, string[]> = {
    openai: ['gpt-4o-mini', 'gpt-4.1', 'o3-mini'],
    anthropic: ['claude-3.5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
    google: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'],
    local: ['llama-3.1-8b', 'mistral-7b-instruct', 'phi-3-mini'],
  };

  const [customModels, setCustomModels] = useState<Record<string, { id: string; apiKey: string }[]>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('nexira_models_custom') || '{}');
      return { openai: [], anthropic: [], google: [], local: [], ...(saved || {}) };
    } catch {
      return { openai: [], anthropic: [], google: [], local: [] };
    }
  });

  const [modelsEnabled, setModelsEnabled] = useState<Record<string, Record<string, boolean>>>(() => {
    const initial: Record<string, Record<string, boolean>> = {};
    Object.keys(PROVIDER_MODELS).forEach((prov) => {
      initial[prov] = {};
      PROVIDER_MODELS[prov].forEach((m) => {
        initial[prov][m] = true;
      });
    });
    try {
      const saved = JSON.parse(localStorage.getItem('nexira_models_enabled') || '{}');
      Object.keys(saved || {}).forEach((prov) => {
        initial[prov] = { ...(initial[prov] || {}), ...(saved[prov] || {}) };
      });
    } catch {}
    return initial;
  });

  const [overrideBaseUrl, setOverrideBaseUrl] = useState(false);
  const [providerBaseUrl, setProviderBaseUrl] = useState('https://api.openai.com/v1');
  const [providerApiKey, setProviderApiKey] = useState('');
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [isKeyVerified, setIsKeyVerified] = useState(false);
  
  // Compute enabled models for current provider
  const enabledModelsForProvider = useMemo(() => {
    const builtins = (PROVIDER_MODELS[provider] || []).filter((m) => (modelsEnabled[provider] || {})[m]);
    const customs = (customModels[provider] || []).filter((m) => (modelsEnabled[provider] || {})[m.id]).map((m)=>m.id);
    return Array.from(new Set([...builtins, ...customs]));
  }, [provider, modelsEnabled, customModels]);

  const availableModels = useMemo(() => {
    const builtins = PROVIDER_MODELS[provider] || [];
    const customs = (customModels[provider] || []).map((m) => m.id);
    const merged = Array.from(new Set([...builtins, ...customs]));
    return merged;
  }, [provider, customModels]);

  useEffect(() => {
    if (!enabledModelsForProvider.includes(defaultModel)) {
      setDefaultModel(enabledModelsForProvider[0] || '');
    }
  }, [provider, enabledModelsForProvider, defaultModel]);

  // Persist settings so ChatPage can read the allowed models
  useEffect(() => {
    try { localStorage.setItem('nexira_models_enabled', JSON.stringify(modelsEnabled)); } catch {}
  }, [modelsEnabled]);

  useEffect(() => {
    try { localStorage.setItem('nexira_models_custom', JSON.stringify(customModels)); } catch {}
  }, [customModels]);

  useEffect(() => {
    try { localStorage.setItem('nexira_default_model', defaultModel); } catch {}
  }, [defaultModel]);

  useEffect(() => {
    const provider = localStorage.getItem('nexira_login_provider');
    const name = localStorage.getItem('nexira_user_name');
    let avatar = localStorage.getItem('nexira_user_avatar') || '';
    // Prefer stored profile object if avatar not set yet
    if (!avatar) {
      try {
        const stored = JSON.parse(localStorage.getItem('nexira_user') || '{}');
        if (stored && stored.picture) {
          avatar = stored.picture;
          try { localStorage.setItem('nexira_user_avatar', avatar); } catch {}
        }
      } catch {}
    }
    // As a last resort, hydrate from backend if email available
    (async () => {
      if (!avatar && (provider === 'google' || provider === 'email')) {
        const email = localStorage.getItem('nexira_user_email') || '';
        if (email) {
          try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/user/info', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
              body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (data && data.picture) {
              avatar = data.picture;
              try { localStorage.setItem('nexira_user_avatar', avatar); } catch {}
              setUserAvatar(avatar);
            }
          } catch {}
        }
      }
    })();
    setLoginProvider(provider);
    setUserName(name);
    setUserAvatar(avatar || null);
  }, []);

  // Ensure login modal auto-closes when user becomes authenticated
  useEffect(() => {
    if (loginProvider && loginProvider !== 'guest') {
      setShowLogin(false);
      try { sessionStorage.setItem('nexira_login_ack', '1'); } catch {}
    }
  }, [loginProvider]);

  // Reflect changes immediately when login info updates (same-tab storage updates)
  useEffect(() => {
    const onStorage = () => {
      setIsHydrating(true);
      const provider = localStorage.getItem('nexira_login_provider');
      const name = localStorage.getItem('nexira_user_name');
      const avatar = localStorage.getItem('nexira_user_avatar');
      setLoginProvider(provider);
      setUserName(name);
      setUserAvatar(avatar);
      setTimeout(() => setIsHydrating(false), 400);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addCustomModel = (prov: string, id: string, apiKey: string) => {
    const trimmedId = id.trim();
    if (!trimmedId) return;
    setCustomModels((prev) => ({
      ...prev,
      [prov]: [...(prev[prov] || []), { id: trimmedId, apiKey }],
    }));
    setModelsEnabled((prev) => ({
      ...prev,
      [prov]: { ...(prev[prov] || {}), [trimmedId]: true },
    }));
    setDefaultModel(trimmedId);
  };

  const toggleModelEnabled = (prov: string, id: string) => {
    setModelsEnabled((prev) => ({
      ...prev,
      [prov]: { ...(prev[prov] || {}), [id]: !(prev[prov] || {})[id] },
    }));
  };

  const tabs = useMemo(
    () => [
      { key: 'general', label: t('settingsPage.tabs.general'), icon: Globe },
      { key: 'appearance', label: t('settingsPage.tabs.appearance'), icon: SlidersHorizontal },
      { key: 'personalization', label: t('settingsPage.tabs.personalization'), icon: Brain },
      { key: 'integrations', label: t('settingsPage.tabs.integrations'), icon: PlugZap },
      { key: 'features', label: t('settingsPage.tabs.features'), icon: Monitor },
      { key: 'privacy', label: t('settingsPage.tabs.privacy'), icon: Shield },
    ] as { key: TabKey; label: string; icon: React.ComponentType<any> }[],
    [language, t]
  );


  return (
    <div className={`min-h-[calc(100vh-64px)] ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
      <LoadingOverlay show={isHydrating} />
      <LoadingOverlay show={langLoading} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 md:col-span-4 lg:col-span-3">
            <div className={`${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'} rounded-2xl p-3`}>
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as TabKey)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm mb-1 transition-colors ${
                    isDark
                      ? (activeTab === key ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5')
                      : (activeTab === key ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50')
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="col-span-12 md:col-span-8 lg:col-span-9 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('settingsPage.title')}</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('settingsPage.subtitle')}</p>
              </div>
            </div>

            {activeTab === 'general' && (
              <div className="space-y-6">
                <Section title={t('settingsPage.general.account')}>
                  {loginProvider ? (
                    <div className="flex items-center gap-4">
                      <img src={userAvatar || (loginProvider === 'guest' ? '/frontend/public/capybara.png' : '/figma/icon-user-circle.svg')} onError={(e)=>{(e.currentTarget as HTMLImageElement).src=(loginProvider === 'guest' ? '/frontend/public/capybara.png' : '/figma/icon-user-circle.svg');}} alt="avatar" className={`h-10 w-10 rounded-full object-cover border ${isDark ? 'border-white/10' : 'border-gray-200'}`} />
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{userName || 'Guest'}</div>
                         <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('settingsPage.general.providerLabel')}: {loginProvider}</div>
                      </div>
                      <div className="flex gap-2">
                        {loginProvider !== 'guest' ? (
                          <>
                            <button
                              onClick={() => {
                                const newName = prompt('Display name', userName || '') || userName || '';
                                if (newName) {
                                  localStorage.setItem('nexira_user_name', newName);
                                  setUserName(newName);
                                  window.dispatchEvent(new StorageEvent('storage'));
                                }
                              }}
                              className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                            >
                              {t('settingsPage.general.edit')}
                            </button>
                            <button
                              onClick={() => {
                                // Reset to guest session
                                try { (window as any).google?.accounts?.id?.disableAutoSelect?.(); } catch {}
                                try { (window as any).google?.accounts?.id?.revoke?.(localStorage.getItem('nexira_user_email') || '', () => {}); } catch {}
                                try { localStorage.setItem('nexira_login_provider', 'guest'); } catch {}
                                try { localStorage.removeItem('nexira_user'); } catch {}
                                try { localStorage.removeItem('nexira_user_email'); } catch {}
                                try { localStorage.removeItem('nexira_user_name'); } catch {}
                                try { localStorage.setItem('nexira_user_avatar', '/frontend/public/capybara.png'); } catch {}
                                try { localStorage.removeItem('nexira_user_id'); } catch {}
                                try { sessionStorage.removeItem('nexira_login_ack'); } catch {}
                                setLoginProvider('guest');
                                setUserName('Guest');
                                setUserAvatar('/frontend/public/capybara.png');
                                window.dispatchEvent(new StorageEvent('storage'));
                              }}
                              className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-red-600/20 border border-red-500/30 text-red-200 hover:bg-red-600/30' : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'}`}
                            >
                              {t('settingsPage.general.logout')}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              try { sessionStorage.removeItem('nexira_login_ack'); } catch {}
                              setShowLogin(true);
                            }}
                            className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-blue-600/20 border border-blue-500/30 text-blue-200 hover:bg-blue-600/30' : 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100'}`}
                          >
                            {t('header.login')}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={`flex items-center justify-between gap-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span>{t('settingsPage.general.guest')}</span>
                      <button
                        onClick={() => {
                          try { sessionStorage.removeItem('nexira_login_ack'); } catch {}
                          setShowLogin(true);
                        }}
                        className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-blue-600/20 border border-blue-500/30 text-blue-200 hover:bg-blue-600/30' : 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100'}`}
                      >
                        {t('header.login')}
                      </button>
                    </div>
                  )}
                </Section>
                <LoginModal
                  open={showLogin}
                  onClose={() => setShowLogin(false)}
                  onSelect={() => {
                    setShowLogin(false);
                    try { sessionStorage.setItem('nexira_login_ack', '1'); } catch {}
                    window.dispatchEvent(new StorageEvent('storage'));
                  }}
                />
                <Section title={t('settingsPage.general.language')}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setLangLoading(true); setLanguage('en'); setTimeout(() => setLangLoading(false), 400); }}
                      className={`px-4 py-2 rounded-lg border text-sm ${
                        language === 'en'
                          ? (isDark ? 'border-blue-500/40 bg-blue-500/10 text-white' : 'border-blue-500/30 bg-blue-50 text-gray-900')
                          : (isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50')
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => { setLangLoading(true); setLanguage('vi'); setTimeout(() => setLangLoading(false), 400); }}
                      className={`px-4 py-2 rounded-lg border text-sm ${
                        language === 'vi'
                          ? (isDark ? 'border-blue-500/40 bg-blue-500/10 text-white' : 'border-blue-500/30 bg-blue-50 text-gray-900')
                          : (isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50')
                      }`}
                    >
                      VIE
                    </button>
                  </div>
                </Section>

              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <Section title={t('settingsPage.appearance.theme')} description={t('settingsPage.appearance.description')}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <RadioCard
                      selected={theme === 'auto'}
                      onClick={() => setTheme('auto')}
                      title={t('settingsPage.appearance.auto')}
                      description="Match system setting"
                      icon={<Monitor className="h-5 w-5 text-gray-300" />}
                    />
                    <RadioCard
                      selected={theme === 'light'}
                      onClick={() => setTheme('light')}
                      title={t('settingsPage.appearance.light')}
                      description="Bright and clean"
                      icon={<Sun className="h-5 w-5 text-yellow-300" />}
                    />
                    <RadioCard
                      selected={theme === 'dark'}
                      onClick={() => setTheme('dark')}
                      title={t('settingsPage.appearance.dark')}
                      description="Sleek and focused"
                      icon={<Moon className="h-5 w-5 text-indigo-300" />}
                    />
                  </div>
                </Section>
              </div>
            )}


            {activeTab === 'personalization' && (
              <div className="space-y-6">
                <Section title={t('settingsPage.personalization.memories')} description={t('settingsPage.subtitle')}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('settingsPage.personalization.enableMemories')}</span>
                    <button
                      onClick={() => setAutoMemories(!autoMemories)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoMemories ? 'bg-blue-600' : (isDark ? 'bg-white/20' : 'bg-gray-300')}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${autoMemories ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className={`px-3 py-1.5 rounded-lg text-xs ${isDark ? 'bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10' : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'}`}>{t('settingsPage.personalization.reviewPending')}</button>
                    <button className={`px-3 py-1.5 rounded-lg text-xs ${isDark ? 'bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10' : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'}`}>{t('settingsPage.personalization.clearAll')}</button>
                  </div>
                </Section>

                <Section title={t('settingsPage.personalization.userRules')} description={t('settingsPage.subtitle')}>
                  <div className="space-y-2">
                    {userRules.map((r, idx) => (
                      <div key={`${r}-${idx}`} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
                        <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{r}</span>
                        <button onClick={() => setUserRules((prev) => prev.filter((_, i) => i !== idx))} className={`${isDark ? 'text-gray-400 hover:text-red-300' : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'} rounded-md p-1`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <input
                      value={newRule}
                      onChange={(e) => setNewRule(e.target.value)}
                      placeholder={t('settingsPage.personalization.addNewRule')}
                      className={`flex-1 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-[#14171B] text-gray-200 placeholder-gray-500 border border-white/10' : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300'}`}
                    />
                    <button
                      onClick={() => {
                        if (newRule.trim()) {
                          setUserRules((prev) => [...prev, newRule.trim()]);
                          setNewRule('');
                        }
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? 'bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                      <Plus className="h-4 w-4" /> {t('settingsPage.personalization.addRule')}
                    </button>
                  </div>
                </Section>

                <Section title={t('settingsPage.personalization.customize')} description={t('settingsPage.personalization.personalizeTextLabel')}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{t('settingsPage.personalization.tone')}</label>
                      <select className={`w-full rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-[#14171B] text-gray-200 border border-white/10' : 'bg-white text-gray-900 border border-gray-300'}`}>
                        <option value="friendly">{t('settingsPage.personalization.tones.friendly')}</option>
                        <option value="professional">{t('settingsPage.personalization.tones.professional')}</option>
                        <option value="concise">{t('settingsPage.personalization.tones.concise')}</option>
                        <option value="enthusiastic">{t('settingsPage.personalization.tones.enthusiastic')}</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{t('settingsPage.personalization.responseLength')}</label>
                      <select className={`w-full rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-[#14171B] text-gray-200 border border-white/10' : 'bg-white text-gray-900 border border-gray-300'}`}>
                        <option value="short">{t('settingsPage.personalization.responseLengthOptions.short')}</option>
                        <option value="balanced">{t('settingsPage.personalization.responseLengthOptions.balanced')}</option>
                        <option value="detailed">{t('settingsPage.personalization.responseLengthOptions.detailed')}</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{t('settingsPage.personalization.formatting')}</label>
                      <div className="flex items-center gap-3">
                        <label className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <input type="checkbox" className="accent-blue-600" defaultChecked /> {t('settingsPage.personalization.markdownTables')}
                        </label>
                        <label className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <input type="checkbox" className="accent-blue-600" /> {t('settingsPage.personalization.codeBlocks')}
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{t('settingsPage.personalization.stylePreferences')}</label>
                      <div className="flex items-center gap-3">
                        <label className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <input type="checkbox" className="accent-blue-600" /> {t('settingsPage.personalization.avoidEmojis')}
                        </label>
                        <label className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <input type="checkbox" className="accent-blue-600" defaultChecked /> {t('settingsPage.personalization.bulletFirst')}
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('settingsPage.personalization.personalizeTextLabel')}</label>
                    <textarea
                      value={customizeText}
                      onChange={(e) => setCustomizeText(e.target.value.slice(0, 1500))}
                      placeholder={t('settingsPage.personalization.personalizePlaceholder')}
                      className={`w-full min-h-[140px] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-[#14171B] text-gray-200 placeholder-gray-500 border border-white/10' : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300'}`}
                    />
                    <div className={`mt-2 flex items-center justify-between text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span>{t('settingsPage.personalization.tip')}</span>
                      <span>{customizeText.length}/1500</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className={`px-4 py-2 rounded-xl ${isDark ? 'bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{t('settingsPage.personalization.save')}</button>
                      <button onClick={() => setCustomizeText('')} className={`px-4 py-2 rounded-xl ${isDark ? 'bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{t('settingsPage.personalization.clear')}</button>
                    </div>
                  </div>
                </Section>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <Section title={t('settingsPage.integrations.mcpEndpoints')} description={t('settingsPage.integrations.enableConfigure')}>
                  <div className="space-y-2">
                    {mcpEndpoints.map((ep, i) => (
                      <div key={ep.id} className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <PlugZap className="h-4 w-4" />
                            <span className="text-sm font-medium">{ep.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setMcpEndpoints((prev) => {
                                const copy = [...prev];
                                copy[i] = { ...prev[i], enabled: !prev[i].enabled };
                                return copy;
                              })}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ep.enabled ? 'bg-blue-600' : (isDark ? 'bg-white/20' : 'bg-gray-300')}`}
                              aria-label="Toggle MCP"
                            >
                              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${ep.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                            </button>
                            <button
                              onClick={() => setMcpEndpoints((prev) => prev.filter((_, idx) => idx !== i))}
                              className={`${isDark ? 'text-gray-400 hover:text-red-300 hover:bg-white/10' : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'} p-1 rounded-md`}
                              aria-label="Delete MCP"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="relative">
                            <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{t('settingsPage.integrations.url')}</label>
                            <div className="flex items-center gap-2">
                              <Link2 className="h-4 w-4 text-gray-400" />
                              <input
                                value={ep.url}
                                onChange={(e) => setMcpEndpoints((prev) => { const c=[...prev]; c[i] = { ...prev[i], url: e.target.value }; return c; })}
                                placeholder={import.meta.env.VITE_API_URL + '/mcp'}
                                className={`flex-1 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-[#14171B] text-gray-200 placeholder-gray-500 border border-white/10' : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300'}`}
                              />
                            </div>
                          </div>
                          <div className="relative md:col-span-2">
                            <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{t('settingsPage.integrations.apiKey')}</label>
                            <div className="flex items-center gap-2">
                              <KeyRound className="h-4 w-4 text-gray-400" />
                              <input
                                type="password"
                                value={ep.apiKey || ''}
                                onChange={(e) => setMcpEndpoints((prev) => { const c=[...prev]; c[i] = { ...prev[i], apiKey: e.target.value }; return c; })}
                                placeholder="Optional"
                                className={`flex-1 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-[#14171B] text-gray-200 placeholder-gray-500 border border-white/10' : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300'}`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('settingsPage.integrations.addNewMcp')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        value={newMcp.name}
                        onChange={(e) => setNewMcp({ ...newMcp, name: e.target.value })}
                        placeholder={t('settingsPage.integrations.name')}
                        className={`rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-[#14171B] text-gray-200 placeholder-gray-500 border border-white/10' : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300'}`}
                      />
                      <input
                        value={newMcp.url}
                        onChange={(e) => setNewMcp({ ...newMcp, url: e.target.value })}
                        placeholder={t('settingsPage.integrations.url')}
                        className={`rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-[#14171B] text-gray-200 placeholder-gray-500 border border-white/10' : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300'}`}
                      />
                      <div className="flex gap-2">
                        <input
                          value={newMcp.apiKey}
                          onChange={(e) => setNewMcp({ ...newMcp, apiKey: e.target.value })}
                          placeholder={`${t('settingsPage.integrations.apiKey')} (optional)`}
                          className={`flex-1 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 ${isDark ? 'bg-[#14171B] text-gray-200 placeholder-gray-500 border border-white/10' : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300'}`}
                        />
                        <button
                          onClick={() => {
                            if (!newMcp.name || !newMcp.url) return;
                            setMcpEndpoints((prev) => [...prev, { id: `${Date.now()}`, name: newMcp.name, url: newMcp.url, apiKey: newMcp.apiKey, enabled: true }]);
                            setNewMcp({ name: '', url: '', apiKey: '' });
                          }}
                          className={`px-4 py-2 rounded-xl ${isDark ? 'bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                          {t('settingsPage.integrations.add')}
                        </button>
                      </div>
                    </div>
                  </div>
                </Section>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-6">
                <Section title={t('settingsPage.features.experimental')}>
                  <Toggle checked={enableCodeInterpreter} onChange={setEnableCodeInterpreter} label={t('settingsPage.features.codeInterpreter')} description={t('settingsPage.features.codeInterpreterDesc')} />
                  <Toggle checked={false} onChange={() => {}} label={t('settingsPage.features.webBrowsing')} description={t('settingsPage.features.webBrowsingDesc')} />
                  <Toggle checked={false} onChange={() => {}} label={t('settingsPage.features.voiceInput')} description={t('settingsPage.features.voiceInputDesc')} />
                </Section>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <Section title={t('settingsPage.privacy.dataControls')} description={t('settingsPage.privacy.manageData')}>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? 'bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                      <Download className="h-4 w-4" /> {t('settingsPage.privacy.exportData')}
                    </button>
                    <button className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? 'bg-white/5 border border-white/10 text-red-300 hover:bg-white/10' : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'}`}>
                      <Trash2 className="h-4 w-4" /> {t('settingsPage.privacy.clearHistory')}
                    </button>
                  </div>
                  <div className={`mt-6 pt-4 ${isDark ? 'border-t border-white/10' : 'border-t border-gray-200'}`}>
                    <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Database className="h-4 w-4" /> {t('settingsPage.privacy.note')}
                    </div>
                  </div>
                </Section>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

