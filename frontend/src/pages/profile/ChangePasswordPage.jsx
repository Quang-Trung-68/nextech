import { useState } from 'react';
import usePageTitle from '@/hooks/usePageTitle';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShoppingBag, Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { changePasswordSchema } from '@/schemas/auth.schema';
import { useChangePassword } from '@/features/auth/hooks/useAuth';

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
const ChangePasswordPage = () => {
  usePageTitle('Đổi mật khẩu');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');

  const { mutate: changePassword, isPending } = useChangePassword();

  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const watchNewPassword = form.watch('newPassword');

  const onSubmit = (values) => {
    setServerError('');
    changePassword(values, {
      onError: (error) => {
        const msg =
          error?.response?.data?.message ||
          'Không thể thay đổi mật khẩu. Vui lòng thử lại.';
        setServerError(msg);
      },
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">NexTech</h1>
          <p className="text-sm text-muted-foreground">Bảo mật tài khoản</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Đổi mật khẩu</CardTitle>
            <CardDescription>
              Sau khi đổi thành công, bạn sẽ bị đăng xuất khỏi tất cả thiết bị.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* ── Security note ─────────────────────────────────────────────── */}
            <div className="mb-5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">⚠️ Lưu ý quan trọng</p>
              <p className="text-amber-700 dark:text-amber-300">
                Để bảo mật, tất cả phiên đăng nhập hiện tại sẽ bị đăng xuất sau khi đổi mật khẩu.
                Bạn sẽ cần đăng nhập lại trên tất cả thiết bị.
              </p>
            </div>

            {/* ── Server error ─────────────────────────────────────────────── */}
            {serverError && (
              <Alert variant="destructive" className="mb-5">
                <AlertDescription>{serverError}</AlertDescription>
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
                            id="input-change-new-password"
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
                      <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="input-change-confirm-password"
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
                  id="btn-submit-change-password"
                  type="submit"
                  className="w-full"
                  disabled={isPending}
                >
                  {isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang xử lý...</>
                  ) : (
                    'Đổi mật khẩu'
                  )}
                </Button>
              </form>
            </Form>

            {/* ── Back link ─────────────────────────────────────────────────── */}
            <div className="mt-5 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <Link to="/" className="font-medium text-primary hover:underline">
                Quay về trang chủ
              </Link>
              <span>·</span>
              <Link to="/forgot-password" className="font-medium text-primary hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
