/**
 * Utility functions for user management
 */

export interface CurrentUser {
  id: string | null;
  email: string | null;
  name: string | null;
  avatar: string | null;
  provider: string | null;
}

/**
 * Get current user information from localStorage
 */
export const getCurrentUser = (): CurrentUser => {
  try {
    const id = localStorage.getItem('nexira_user_id');
    const email = localStorage.getItem('nexira_user_email');
    const name = localStorage.getItem('nexira_user_name');
    const avatar = localStorage.getItem('nexira_user_avatar');
    const provider = localStorage.getItem('nexira_login_provider');
    
    return {
      id,
      email,
      name,
      avatar,
      provider
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return {
      id: null,
      email: null,
      name: null,
      avatar: null,
      provider: null
    };
  }
};

/**
 * Get current user ID for API calls
 */
export const getCurrentUserId = (): string | null => {
  return getCurrentUser().id;
};

/**
 * Check if user is authenticated (not guest)
 */
export const isUserAuthenticated = (): boolean => {
  const provider = localStorage.getItem('nexira_login_provider');
  return provider === 'google' || provider === 'email';
};

/**
 * Ensure there is a stable user id for API calls.
 * - If authenticated and email exists, prefer that.
 * - Otherwise, create a persistent device-based guest id and use it.
 * This prevents conversations from "disappearing" when navigating between pages
 * due to switching between temporary ids (e.g., missing user-id defaulting to 'guest').
 */
export const ensureStableUserId = (): string => {
  try {
    const existing = localStorage.getItem('nexira_user_id');
    if (existing && existing.trim()) return existing;

    const email = localStorage.getItem('nexira_user_email');
    if (email && email.trim()) {
      localStorage.setItem('nexira_user_id', email);
      return email;
    }

    // Generate or reuse a device id to remain stable across navigation
    let deviceId = localStorage.getItem('nexira_device_id');
    if (!deviceId) {
      deviceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('nexira_device_id', deviceId);
    }
    const guestId = `guest:${deviceId}`;
    localStorage.setItem('nexira_user_id', guestId);
    if (!localStorage.getItem('nexira_login_provider')) {
      localStorage.setItem('nexira_login_provider', 'guest');
    }
    return guestId;
  } catch (e) {
    // As a last resort, return plain 'guest' (still functional, but not stable)
    return 'guest';
  }
};
