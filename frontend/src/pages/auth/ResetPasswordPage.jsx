import { useState } from 'react';
import usePageTitle from '@/hooks/usePageTitle';
import { useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShoppingBag, Eye, EyeOff, AlertTriangle, Loader2, Lock } from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { resetPasswordSchema } from '@/schemas/auth.schema';
import { useResetPassword } from '@/features/auth/hooks/useAuth';

// ─── Password strength indicator ─────────────────────────────────────────────
const getStrength = (password) => {
  if (!password) return { level: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const levels = [
    { level: 0, label: '', color: 'bg-muted' },
    { level: 1, label: 'Rất yếu', color: 'bg-red-500' },
    { level: 2, label: 'Yếu', color: 'bg-orange-400' },
    { level: 3, label: 'Trung bình', color: 'bg-yellow-400' },
    { level: 4, label: 'Mạnh', color: 'bg-blue-500' },
    { level: 5, label: 'Rất mạnh', color: 'bg-green-500' },
  ];
  return levels[score];
};

const PasswordStrengthBar = ({ password }) => {
  const strength = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-300 ${
              i <= strength.level ? strength.color : 'bg-muted'
            }`}
          />
        ))}
      </div>
      {strength.label && (
        <p className="text-xs text-muted-foreground">{strength.label}</p>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const ResetPasswordPage = () => {
  usePageTitle('Đặt lại mật khẩu');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');

  const { mutate: resetPassword, isPending } = useResetPassword();

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const watchNewPassword = form.watch('newPassword');

  // Invalid / missing token
  if (!token) {
    return <InvalidTokenCard />;
  }

  const onSubmit = (values) => {
    setServerError('');
    resetPassword(
      { token, ...values },
      {
        onError: (error) => {
          const msg =
            error?.response?.data?.message ||
            'Có lỗi xảy ra. Vui lòng thử lại.';
          setServerError(msg);
        },
      }
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">ShopNow</h1>
          <p className="text-sm text-muted-foreground">Tạo mật khẩu mới</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Đặt lại mật khẩu</CardTitle>
            <CardDescription>
              Nhập mật khẩu mới cho tài khoản của bạn. Mật khẩu phải có ít nhất 8 ký tự,
              bao gồm chữ hoa, chữ thường và số.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* ── Server error (expired / used token) ─────────────────────── */}
            {serverError && (
              <Alert variant="destructive" className="mb-5">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {serverError}{' '}
                  <Link to="/forgot-password" className="underline underline-offset-2 font-medium">
                    Yêu cầu link mới?
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* ── New password ─────────────────────────────────────────── */}
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu mới</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="input-new-password"
                            type={showNew ? 'text' : 'password'}
                            placeholder="Tối thiểu 8 ký tự"
                            className="pl-9 pr-10"
                            autoComplete="new-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNew((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <PasswordStrengthBar password={watchNewPassword} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ── Confirm password ─────────────────────────────────────── */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xác nhận mật khẩu</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="input-confirm-password"
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="Nhập lại mật khẩu mới"
                            className="pl-9 pr-10"
                            autoComplete="new-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  id="btn-submit-reset-password"
                  type="submit"
                  className="w-full"
                  disabled={isPending}
                >
                  {isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang xử lý...</>
                  ) : (
                    'Đặt lại mật khẩu'
                  )}
                </Button>
              </form>
            </Form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-medium text-primary hover:underline">
                Quay lại đăng nhập
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ── Sub-component: invalid / missing token ────────────────────────────────────
function InvalidTokenCard() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 border-2 border-destructive/30">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Link không hợp lệ</h1>
          <p className="text-muted-foreground">
            Link đặt lại mật khẩu không hợp lệ, đã hết hạn, hoặc đã được sử dụng.
          </p>
        </div>
        <Link to="/forgot-password">
          <Button id="btn-goto-forgot-password" className="gap-2">
            Yêu cầu link mới
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
