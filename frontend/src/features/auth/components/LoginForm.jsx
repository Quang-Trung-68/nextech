import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { loginSchema } from '@/schemas/auth.schema';
import { useLogin } from '@/features/auth/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import useTranslatedError from '@/i18n/useTranslatedError';

const LoginForm = () => {
  const { t } = useTranslation(['auth', 'common']);
  const getTranslatedError = useTranslatedError();
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending, error: serverError } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data) => {
    login(data);
  };

  // Trích xuất message lỗi từ server response
  const serverErrorMessage = serverError ? getTranslatedError(serverError) : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* ── Email ─────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label
          htmlFor="login-email"
          className="block text-sm font-medium text-foreground"
        >
          {t('auth:login.emailLabel')}
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={`w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none transition
            focus:ring-2 focus:ring-primary focus:border-primary
            ${errors.email ? 'border-destructive focus:ring-destructive' : 'border-border'}`}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive flex items-center gap-1 mt-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* ── Password ──────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label
          htmlFor="login-password"
          className="block text-sm font-medium text-foreground"
        >
          {t('auth:login.passwordLabel')}
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className={`w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm shadow-sm outline-none transition
              focus:ring-2 focus:ring-primary focus:border-primary
              ${errors.password ? 'border-destructive focus:ring-destructive' : 'border-border'}`}
            {...register('password')}
          />
          <button
            type="button"
            aria-label={showPassword ? t('common:actions.hidePassword', 'Hide password') : t('common:actions.showPassword', 'Show password')}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive flex items-center gap-1 mt-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* ── Server Error Alert ─────────────────────────────────────────── */}
      {serverErrorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{serverErrorMessage}</span>
        </div>
      )}

      {/* ── Submit Button ──────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            {t('common:status.loading')}
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            {t('auth:login.submitBtn')}
          </>
        )}
      </button>

      {/* ── Link to Register ───────────────────────────────────────────── */}
      <p className="text-center text-sm text-muted-foreground">
        {t('auth:login.noAccount')}{' '}
        <Link
          to="/register"
          className="font-medium text-primary hover:underline"
        >
          {t('common:nav.register')}
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;
