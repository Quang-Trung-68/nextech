import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, AlertCircle } from 'lucide-react';
import { registerSchema } from '@/schemas/auth.schema';
import { useRegister } from '@/features/auth/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import useTranslatedError from '@/i18n/useTranslatedError';

// ─── Password Strength Helpers ────────────────────────────────────────────────
/**
 * Returns a score 0–4 based on met criteria.
 * Criteria: length≥8, uppercase, lowercase, digit, special char
 */
function getPasswordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const STRENGTH_CONFIG = [
  { label: '', color: 'bg-border' },               // 0 – empty
  { label: 'auth:register.strength.veryWeak', color: 'bg-destructive' },   // 1
  { label: 'auth:register.strength.weak', color: 'bg-orange-400' },         // 2
  { label: 'auth:register.strength.medium', color: 'bg-yellow-400' },  // 3
  { label: 'auth:register.strength.strong', color: 'bg-green-500' },          // 4
  { label: 'auth:register.strength.veryStrong', color: 'bg-emerald-500' },   // 5
];

const PasswordStrengthBar = ({ password }) => {
  const { t } = useTranslation(['auth']);
  const score = getPasswordStrength(password);
  const { label, color } = STRENGTH_CONFIG[score];

  return (
    <div className="space-y-1 mt-2">
      {/* 5 segment bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((seg) => (
          <div
            key={seg}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              seg <= score ? color : 'bg-border'
            }`}
          />
        ))}
      </div>
      {password && (
        <p className={`text-xs font-medium ${
          score <= 2 ? 'text-destructive' :
          score === 3 ? 'text-yellow-500' : 'text-green-600'
        }`}>
          {label ? t(label) : ''}
        </p>
      )}
    </div>
  );
};

// ─── Register Form ────────────────────────────────────────────────────────────
const RegisterForm = () => {
  const { t } = useTranslation(['auth', 'common']);
  const getTranslatedError = useTranslatedError();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { mutate: register, isPending, error: serverError } = useRegister();

  const {
    register: formRegister,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  // Watch password value để tính strength realtime
  const passwordValue = watch('password');

  const onSubmit = (data) => {
    // Strip confirmPassword trước khi gửi lên server
    const { confirmPassword: _cp, ...payload } = data;
    register(payload);
  };

  const serverErrorMessage = serverError ? getTranslatedError(serverError) : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* ── Name ──────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label
          htmlFor="register-name"
          className="block text-sm font-medium text-foreground"
        >
          {t('auth:register.nameLabel')}
        </label>
        <input
          id="register-name"
          type="text"
          autoComplete="name"
          placeholder="Nguyễn Văn A"
          className={`w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none transition
            focus:ring-2 focus:ring-primary focus:border-primary
            ${errors.name ? 'border-destructive focus:ring-destructive' : 'border-border'}`}
          {...formRegister('name')}
        />
        {errors.name && (
          <p className="text-xs text-destructive flex items-center gap-1 mt-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.name.message}
          </p>
        )}
      </div>

      {/* ── Email ─────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label
          htmlFor="register-email"
          className="block text-sm font-medium text-foreground"
        >
          {t('auth:register.emailLabel')}
        </label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={`w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none transition
            focus:ring-2 focus:ring-primary focus:border-primary
            ${errors.email ? 'border-destructive focus:ring-destructive' : 'border-border'}`}
          {...formRegister('email')}
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
          htmlFor="register-password"
          className="block text-sm font-medium text-foreground"
        >
          {t('auth:register.passwordLabel')}
        </label>
        <div className="relative">
          <input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className={`w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm shadow-sm outline-none transition
              focus:ring-2 focus:ring-primary focus:border-primary
              ${errors.password ? 'border-destructive focus:ring-destructive' : 'border-border'}`}
            {...formRegister('password')}
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
        {/* Password strength bar — hiển thị realtime */}
        <PasswordStrengthBar password={passwordValue} />
        {errors.password && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* ── Confirm Password ───────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label
          htmlFor="register-confirm-password"
          className="block text-sm font-medium text-foreground"
        >
          {t('auth:register.confirmPasswordLabel')}
        </label>
        <div className="relative">
          <input
            id="register-confirm-password"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className={`w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm shadow-sm outline-none transition
              focus:ring-2 focus:ring-primary focus:border-primary
              ${errors.confirmPassword ? 'border-destructive focus:ring-destructive' : 'border-border'}`}
            {...formRegister('confirmPassword')}
          />
          <button
            type="button"
            aria-label={showConfirm ? t('common:actions.hidePassword', 'Hide password') : t('common:actions.showPassword', 'Show password')}
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-destructive flex items-center gap-1 mt-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {errors.confirmPassword.message}
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

      {/* ── Submit ────────────────────────────────────────────────────── */}
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
            <UserPlus className="h-4 w-4" />
            {t('auth:register.submitBtn')}
          </>
        )}
      </button>

      {/* ── Link to Login ──────────────────────────────────────────────── */}
      <p className="text-center text-sm text-muted-foreground">
        {t('auth:register.hasAccount')}{' '}
        <Link
          to="/login"
          className="font-medium text-primary hover:underline"
        >
          {t('common:nav.login')}
        </Link>
      </p>
    </form>
  );
};

export default RegisterForm;
