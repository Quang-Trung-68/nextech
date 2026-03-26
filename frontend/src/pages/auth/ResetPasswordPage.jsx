import { useState, useEffect } from 'react';
import usePageTitle from '@/hooks/usePageTitle';
import { useSearchParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShoppingBag, Eye, EyeOff, AlertTriangle, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { z } from 'zod';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { resetPassword } from '@/api/auth.api';
import PageBackButton from '@/components/common/PageBackButton';

const schema = z.object({
  newPassword: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  confirmPassword: z.string()
}).superRefine((data, ctx) => {
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Mật khẩu xác nhận không khớp',
      path: ['confirmPassword']
    });
  }
});

const ResetPasswordPage = () => {
  usePageTitle('Đặt lại mật khẩu');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('form'); // 'form' | 'success' | 'error'
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  // Redirect if no token is found in URL
  if (!token) {
    return <Navigate to="/forgot-password" replace />;
  }

  const onSubmit = async (values) => {
    setLoading(true);
    setServerError('');
    try {
      await resetPassword(token, values.newPassword);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      const msg = error?.response?.data?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <PageBackButton className="mb-2 lg:hidden" />
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">NexTech</h1>
          <p className="text-sm text-muted-foreground">Tạo mật khẩu mới</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Đặt lại mật khẩu</CardTitle>
            <CardDescription>
              Nhập mật khẩu mới cho tài khoản của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === 'error' && serverError && (
              <Alert variant="destructive" className="mb-5">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex flex-col gap-2">
                  <span>{serverError}</span>
                  <Link to="/forgot-password" className="font-medium underline underline-offset-2">
                    Yêu cầu link mới
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            {status === 'success' ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-700">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">Đặt lại mật khẩu thành công!</p>
                  </div>
                </div>
                <Button 
                  className="w-full h-12 text-base font-semibold" 
                  onClick={() => navigate('/login')}
                >
                  Đăng nhập ngay
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                              type={showNew ? 'text' : 'password'}
                              placeholder="Tối thiểu 8 ký tự"
                              className="pl-9 pr-10 h-12 text-base"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNew((v) => !v)}
                              className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center h-11 w-11 text-muted-foreground hover:text-foreground rounded-md transition"
                              tabIndex={-1}
                              aria-label={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            >
                              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                              type={showConfirm ? 'text' : 'password'}
                              placeholder="Nhập lại mật khẩu mới"
                              className="pl-9 pr-10 h-12 text-base"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirm((v) => !v)}
                              className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center h-11 w-11 text-muted-foreground hover:text-foreground rounded-md transition"
                              tabIndex={-1}
                              aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            >
                              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang xử lý...</>
                    ) : (
                      'Đặt lại mật khẩu'
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {status !== 'success' && (
              <p className="mt-5 text-center text-sm text-muted-foreground">
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Quay lại đăng nhập
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
