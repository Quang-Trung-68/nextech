import { Navigate, useSearchParams } from 'react-router-dom';
import usePageTitle from '@/hooks/usePageTitle';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import useAuthStore from '@/stores/useAuthStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import LoginForm from '@/features/auth/components/LoginForm';

// Google "G" SVG icon (official brand colours, no external dependency)
const GoogleIcon = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const LoginPage = () => {
  usePageTitle('Đăng nhập');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('error');

  // Nếu đã đăng nhập → redirect về trang chủ ngay
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  /**
   * IMPORTANT: Must use window.location.href (full browser redirect).
   * Axios/fetch cannot trigger the OAuth flow because the browser needs
   * to follow the redirect chain and ultimately set a cross-origin cookie.
   */
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* ── Logo / App name ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            ShopNow
          </h1>
          <p className="text-sm text-muted-foreground">
            Đăng nhập để tiếp tục mua sắm
          </p>
        </div>

        {/* ── OAuth error alert (from query param) ─────────────────────── */}
        {oauthError === 'oauth_failed' && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Đăng nhập bằng Google thất bại. Vui lòng thử lại.</span>
          </div>
        )}

        {/* ── Card wrapping the form ───────────────────────────────────── */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Đăng nhập</CardTitle>
            <CardDescription>
              Nhập email và mật khẩu của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoginForm />

            {/* ── Divider ───────────────────────────────────────────────── */}
            <div className="relative flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">hoặc</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* ── Google OAuth Button ──────────────────────────────────── */}
            <button
              id="btn-google-login"
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2.5 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors duration-150"
            >
              <GoogleIcon />
              Đăng nhập với Google
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
