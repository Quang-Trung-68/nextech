import { useState } from 'react';
import usePageTitle from '@/hooks/usePageTitle';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShoppingBag, Mail, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
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
import { forgotPassword } from '@/api/auth.api';
import PageBackButton from '@/components/common/PageBackButton';

const formSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

const ForgotPasswordPage = () => {
  usePageTitle('Quên mật khẩu');
  
  const [status, setStatus] = useState('form'); // 'form' | 'success'
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    setServerError('');
    try {
      await forgotPassword(values.email);
      // Dù API trả về gì cũng chuyển sang success (để không bị dò rỉ email)
      setStatus('success');
    } catch (error) {
      // Chỉ check lỗi network
      if (!error.response) {
        setServerError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng của bạn.');
      } else {
        // Dù lỗi server (400, 404, 500), vẫn chuyển sang success (trừ khi có yeu cầu khac, 
        // nhưng theo spec thì 200 hoặc server error -> success để anti-enum)
        setStatus('success');
      }
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
          <p className="text-sm text-muted-foreground">Đặt lại mật khẩu của bạn</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Quên mật khẩu</CardTitle>
            <CardDescription>
              Nhập email đã đăng ký. Hệ thống sẽ gửi link đặt lại mật khẩu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {serverError && status === 'form' && (
              <Alert variant="destructive" className="mb-5">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {status === 'success' ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">Kiểm tra email của bạn</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full h-12 text-base font-semibold">
                  <Link to="/login">Quay lại đăng nhập</Link>
                </Button>
              </div>
            ) : (
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
                              type="email"
                              placeholder="email@example.com"
                              className="pl-9 h-12 text-base"
                              autoComplete="email"
                              {...field}
                            />
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
                      'Gửi link đặt lại mật khẩu'
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {status !== 'success' && (
              <p className="mt-5 text-center text-sm text-muted-foreground">
                Quay lại{' '}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Đăng nhập
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
