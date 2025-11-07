import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Auth Callback mounted');
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      navigate('/login');
      return;
    }

    (async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + '/google/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify({ code })
        });
        const data = await res.json();
        const user = data.user;

        localStorage.setItem('nexira_login_provider', 'google');
        localStorage.setItem('nexira_user', JSON.stringify(user));
        localStorage.setItem('nexira_user_name', user.name);
        localStorage.setItem('nexira_user_avatar', user.picture);
        localStorage.setItem('nexira_user_email', user.email);
        // Use email as stable id for headers
        try { localStorage.setItem('nexira_user_id', user.email || user.name || ''); } catch {}
        sessionStorage.setItem('nexira_login_ack', '1');
        window.dispatchEvent(new Event('storage'));

        navigate('/settings');
      } catch (err) {
        console.error('Auth failed:', err);
        navigate('/login');
      }
    })();
  }, []);

  return <p>Signing you in with Google...</p>;
};

export default AuthCallback;