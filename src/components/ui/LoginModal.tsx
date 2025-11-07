import React, { useState } from 'react';
import { Mail, User, X } from 'lucide-react';

type LoginProvider = 'google' | 'email' | 'guest';

interface LoginModalProps {
  open: boolean;
  onClose?: () => void;
  onSelect: (provider: LoginProvider, { email, password }: { email: string, password: string }) => void;
  hideGuest?: boolean;
  dismissible?: boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose, onSelect, hideGuest, dismissible = false }) => {
  const [mode, setMode] = useState<'menu' | 'email' | 'signup'>('menu');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordMatch, setIsPasswordMatch] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEmailExists, setIsEmailExists] = useState(false);

  const handleSignin = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/email/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password }),
      });

      const data = await response.json();

      if (data) {
        localStorage.setItem('nexira_login_provider', 'email');
        if (email.trim()) {
          localStorage.setItem('nexira_user_name', name.trim());
          localStorage.setItem('nexira_user', JSON.stringify({ name: name.trim(), email: email.trim(), picture: '/frontend/public/capybara.png' }));
          localStorage.setItem('nexira_user_email', email.trim());
          localStorage.setItem('nexira_user_avatar', '/frontend/public/capybara.png');
        } else {
          setErrorMessage('Something went wrong. Please try again.');
          return;
        }
        try { localStorage.setItem('nexira_user_id', email.trim()); } catch {}
        setErrorMessage('');
        setIsEmailExists(false);
        setIsPasswordMatch(true);
        onSelect('email', { email: email, password: password });
        try { window.dispatchEvent(new StorageEvent('storage')); } catch {}
      }
      else {
        setErrorMessage('Invalid email or password');
      }
    } catch (error) {
      setErrorMessage('Something went wrong. Please try again.');
    }
  }

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setIsPasswordMatch(false);
      setErrorMessage('Passwords do not match');
      return;
    }
    setIsPasswordMatch(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/user/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!data) {
        localStorage.setItem('nexira_login_provider', 'email');
        if (email.trim()) {
          localStorage.setItem('nexira_user_name', name.trim());
          localStorage.setItem('nexira_user', JSON.stringify({ name: name.trim(), email: email.trim(), picture: '/frontend/public/capybara.png' }));
          localStorage.setItem('nexira_user_email', email.trim());
          localStorage.setItem('nexira_user_avatar', '/frontend/public/capybara.png');
        } else {
          setErrorMessage('Something went wrong. Please try again.');
          return;
        }
        try { localStorage.setItem('nexira_user_id', email.trim()); } catch {}
        setErrorMessage('');
        setIsEmailExists(false);
        setIsPasswordMatch(true);
        onSelect('email', { email: email, password: password });
        try { window.dispatchEvent(new StorageEvent('storage')); } catch {}
      } else {
        setIsEmailExists(true);
        setErrorMessage('An account with this email already exists. Please sign in instead.');
      }
    } catch (error) {
      setIsEmailExists(false);
      setErrorMessage('Something went wrong. Please try again.');
    }
  };
  
  // Auto-hide only if session acknowledged AND provider is not guest
  try {
    const provider = localStorage.getItem('nexira_login_provider') || 'guest';
    const ack = sessionStorage.getItem('nexira_login_ack') === '1';
    if (ack && provider !== 'guest') {
      if (open && onClose) onClose();
      return null;
    }
  } catch {}
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={dismissible ? onClose : undefined} />
      {/* card */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl glass-white p-6">
        {dismissible && (
          <button onClick={onClose} className="absolute right-3 top-3 p-2 rounded-full hover:bg-black/5">
            <X className="h-5 w-5 text-gray-700" />
          </button>
        )}
        {mode === 'menu' ? (
          <>
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Sign in to Nexira AI</h3>
              <p className="text-sm text-gray-600">Choose a method to continue.</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                  const oauthClientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || clientId;
                  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
                  // Prefer full Google Login page via OAuth if redirect URI is configured
                  if (window.google?.accounts?.oauth2 && oauthClientId && redirectUri) {
                    const codeClient = window.google.accounts.oauth2.initCodeClient({
                      client_id: oauthClientId,
                      scope: 'openid email profile',
                      redirect_uri: redirectUri,
                      ux_mode: 'redirect'
                    });
                    codeClient.requestCode();
                    return;
                  }
                  // Fallback to One Tap / ID token prompt
                  if (window.google?.accounts?.id && clientId) {
                    window.google.accounts.id.initialize({
                      client_id: clientId,
                      callback: (response: any) => {
                        try {
                          const payload = JSON.parse(atob(response.credential.split('.')[1]));
                          localStorage.setItem('nexira_login_provider', 'google');
                          localStorage.setItem('nexira_user_name', payload.name || '');
                          localStorage.setItem('nexira_user_avatar', payload.picture || '');
                          if (payload.email) localStorage.setItem('nexira_user_email', payload.email);
                          try { localStorage.setItem('nexira_user_id', payload.email || payload.sub || payload.name || ''); } catch {}
                          localStorage.setItem('nexira_user', JSON.stringify({ name: payload.name, email: payload.email, picture: payload.picture }));
                          localStorage.setItem('nexira_user_email', payload.email);
                          localStorage.setItem('nexira_user_avatar', payload.picture || '/frontend/public/capybara.png');
                        } catch {}
                        onSelect('google', { email: '', password: '' });
                        try { window.dispatchEvent(new StorageEvent('storage')); } catch {}
                        try { window.dispatchEvent(new Event('nexira-login')); } catch {}
                      }
                    });
                    window.google.accounts.id.prompt();
                  } else {
                    // Last-resort fallback when Google keys/script are not configured
                    // Ensure a non-guest identity is stored so Settings shows a proper user entry
                    localStorage.setItem('nexira_login_provider', 'google');
                    if (!localStorage.getItem('nexira_user_name')) {
                      localStorage.setItem('nexira_user_name', 'Google User');
                    }
                    // Do NOT use company logo for user avatar; leave empty to use neutral icon in UI
                    if (!localStorage.getItem('nexira_user_avatar')) {
                      localStorage.setItem('nexira_user_avatar', '');
                    }
                    try {
                      const name = localStorage.getItem('nexira_user_name') || 'Google User';
                      const email = localStorage.getItem('nexira_user_email') || '';
                      const picture = localStorage.getItem('nexira_user_avatar') || '';
                      localStorage.setItem('nexira_user', JSON.stringify({ name, email, picture }));
                      if (email) localStorage.setItem('nexira_user_id', email);
                    } catch {}
                    onSelect('google', { email: '', password: '' });
                    try { window.dispatchEvent(new StorageEvent('storage')); } catch {}
                    try { window.dispatchEvent(new Event('nexira-login')); } catch {}
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-black/10 bg-white hover:bg-white/90 transition-colors text-gray-900"
              >
                {/* Google G icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
              <button
                onClick={() => {
                  setMode('email');
                  setErrorMessage('');
                  setIsEmailExists(false);
                  setIsPasswordMatch(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-black/10 bg-white hover:bg-white/90 transition-colors text-gray-900"
              >
                <Mail className="h-4 w-4" />
                <span>Sign in with Email</span>
              </button>
            </div>
          </>
        ) : mode === 'email' ? (
          <>
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Sign in with Email</h3>
              <p className="text-sm text-gray-600">Enter your email and password to continue.</p>
            </div>
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white"
              />
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <button className="text-blue-600 hover:text-blue-800">
                  Forgot password?
                </button>
              </div>
              <div className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <button 
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage('');
                    setIsEmailExists(false);
                    setIsPasswordMatch(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign up here
                </button>
              </div>
              {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
              <div className="flex gap-2">
                <button onClick={() => {
                  setMode('menu');
                  setErrorMessage('');
                  setIsEmailExists(false);
                  setIsPasswordMatch(true);
                }} className="px-4 py-3 rounded-xl border border-black/10 bg-white flex-1">Back</button>
                <button onClick={() => {
                  handleSignin();
                }} className="px-4 py-3 rounded-xl bg-gray-900 text-white flex-1">Continue</button>
              </div>
            </div>
          </>
        ) : mode === 'signup' ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
              <p className="text-gray-600">Join Nexira and start chatting with AI</p>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={`w-full px-4 py-3 rounded-xl border bg-white ${isEmailExists ? 'border-red-500' : 'border-black/10'}`}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={`w-full px-4 py-3 rounded-xl border bg-white ${isPasswordMatch ? 'border-black/10' : 'border-red-500'}`}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className={`w-full px-4 py-3 rounded-xl border bg-white ${isPasswordMatch ? 'border-black/10' : 'border-red-500'}`}
              />
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-gray-600">
                  I agree to the{' '}
                  <button className="text-blue-600 hover:text-blue-800">Terms of Service</button>
                  {' '}and{' '}
                  <button className="text-blue-600 hover:text-blue-800">Privacy Policy</button>
                </span>
              </div>
              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button 
                  onClick={() => {
                    setMode('email');
                    setErrorMessage('');
                    setIsEmailExists(false);
                    setIsPasswordMatch(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign in here
                </button>
              </div>
              {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
              <div className="flex gap-2">
                <button onClick={() => {
                  setMode('menu');
                  setErrorMessage('');
                  setIsEmailExists(false);
                  setIsPasswordMatch(true);
                }} className="px-4 py-3 rounded-xl border border-black/10 bg-white flex-1">Back</button>
                <button onClick={() => {
                  handleSignup();
                  try { window.dispatchEvent(new StorageEvent('storage')); } catch {}
                  try { window.dispatchEvent(new Event('nexira-login')); } catch {}
                }} className="px-4 py-3 rounded-xl bg-gray-900 text-white flex-1">Create Account</button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default LoginModal;

