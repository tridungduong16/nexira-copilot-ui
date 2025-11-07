import React, { useState, useEffect } from 'react';
import { User, LogOut, Settings, Shield, ChevronDown } from 'lucide-react';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

interface GoogleAuthProps {
  onUserChange?: (user: GoogleUser | null) => void;
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({ onUserChange }) => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Simulate Google Auth (in real implementation, you would use Google OAuth)
  const mockGoogleAuth = () => {
    return new Promise<GoogleUser>((resolve) => {
      setTimeout(() => {
        const mockUser: GoogleUser = {
          id: '123456789',
          email: 'dung.nguyen@nexira.ai',
          name: 'Dung Nguyen',
          picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
          verified_email: true
        };
        resolve(mockUser);
      }, 1500);
    });
  };

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('nexira_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        onUserChange?.(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('nexira_user');
      }
    }
    setIsInitialized(true);
  }, [onUserChange]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // In real implementation, this would be:
      // const response = await gapi.auth2.getAuthInstance().signIn();
      // const profile = response.getBasicProfile();
      
      const googleUser = await mockGoogleAuth();
      setUser(googleUser);
      localStorage.setItem('nexira_user', JSON.stringify(googleUser));
      onUserChange?.(googleUser);
    } catch (error) {
      console.error('Google login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nexira_user');
    onUserChange?.(null);
    setIsDropdownOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center space-x-4">
        <div className="animate-pulse bg-gray-700 rounded-full w-10 h-10"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span>{isLoading ? 'Logging in...' : 'Sign in with Google'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 hover:bg-gray-100 rounded-lg p-2 transition-colors"
      >
        <div className="hidden md:block text-right">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-600">{user.email}</p>
        </div>
        
        <div className="relative">
          <img
            src={user.picture || '/frontend/public/capybara.png'}
            alt={user.name}
            className="w-10 h-10 rounded-full border-2 border-white object-cover"
            onError={(e) => {
              // Fallback to capybara if image fails to load
              e.currentTarget.src = '/frontend/public/capybara.png';
            }}
          />
          {user.verified_email && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <Shield className="w-2 h-2 text-white" />
            </div>
          )}
        </div>
        
        <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg z-50 border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={user.picture || '/frontend/public/capybara.png'}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/frontend/public/capybara.png';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-sm text-gray-600 truncate">{user.email}</p>
                {user.verified_email && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Shield className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-600">Verified</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-2">
            <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <User className="h-4 w-4" />
              <span>Account Information</span>
            </button>
            
            <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
            
            <div className="border-t border-gray-200 my-2"></div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default GoogleAuth;