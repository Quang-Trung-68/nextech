import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import useAuthStore from '@/stores/useAuthStore';

/**
 * OAuthCallbackPage — /oauth/callback
 *
 * Intermediate page the user lands on after Google redirects back to the
 * frontend with status=success. The backend has already set HttpOnly cookies
 * at this point. This page silently calls GET /auth/me to:
 *  1. Verify the cookies are valid (confirm the OAuth flow succeeded)
 *  2. Hydrate the Zustand auth store with the user object
 *
 * On success  → navigate to home (replace so back button skips this page)
 * On failure  → navigate to login with an error query param
 *
 * The user never interacts with this page; they only see a brief loading spinner.
 */
const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  // Prevent double-calling in React Strict Mode (double useEffect in dev)
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const hydrate = async () => {
      try {
        const { data } = await axiosInstance.get('/auth/me');
        if (data?.success && data?.user) {
          setAuth(data.user);
          navigate('/', { replace: true });
        } else {
          navigate('/login?error=oauth_failed', { replace: true });
        }
      } catch {
        navigate('/login?error=oauth_failed', { replace: true });
      }
    };

    hydrate();
  }, [navigate, setAuth]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      {/* Spinner */}
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"
        role="status"
        aria-label="Đang xử lý đăng nhập..."
      />
      <p className="text-sm text-muted-foreground">Đang hoàn tất đăng nhập…</p>
    </div>
  );
};

export default OAuthCallbackPage;
