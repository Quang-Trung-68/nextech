import { useState } from 'react';
import usePageTitle from '@/hooks/usePageTitle';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShoppingBag, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { forgotPasswordSchema } from '@/schemas/auth.schema';
import { useForgotPassword } from '@/features/auth/hooks/useAuth';

const ForgotPasswordPage = () => {
  usePageTitle('Quên mật khẩu');
  const [submitted, setSubmitted] = useState(false);
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (values) => {
    forgotPassword(values, {
      onSuccess: () => setSubmitted(true),
      onError: () => setSubmitted(true), // Always treat as success (anti-enumeration)
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
          <p className="text-sm text-muted-foreground">Đặt lại mật khẩu của bạn</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Quên mật khẩu</CardTitle>
            <CardDescription>
              Nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu nếu email tồn tại.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* ── Submitted state (static message — anti-enumeration) ────── */}
            {submitted ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">Yêu cầu đã được gửi</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Nếu email <strong>{form.getValues('email')}</strong> tồn tại trong hệ thống,
                      chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (kể cả thư mục Spam).
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Link có hiệu lực trong <strong>1 giờ</strong>.
                    </p>
                  </div>
                </div>
                <Button
                  id="btn-back-to-login-after-forgot"
                  variant="outline"
                  className="w-full"
                  onClick={() => { setSubmitted(false); form.reset(); }}
                >
                  Gửi lại với email khác
                </Button>
              </div>
            ) : (
              /* ── Form ──────────────────────────────────────────────────── */
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="input-forgot-email"
                              type="email"
                              placeholder="email@example.com"
                              className="pl-9"
                              autoComplete="email"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    id="btn-submit-forgot-password"
                    type="submit"
                    className="w-full"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang xử lý...</>
                    ) : (
                      'Gửi link đặt lại mật khẩu'
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {/* ── Back to login ─────────────────────────────────────────── */}
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Nhớ mật khẩu rồi?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Đăng nhập
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
