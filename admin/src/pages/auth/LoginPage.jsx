import { Navigate, Link } from 'react-router-dom';
import usePageTitle from '@/hooks/usePageTitle';
import { ShoppingBag } from 'lucide-react';
import useAuthStore from '@/stores/useAuthStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import LoginForm from '@/features/auth/components/LoginForm';
import PageBackButton from '@/components/common/PageBackButton';

const LoginPage = () => {
  usePageTitle('Đăng nhập');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-6 md:py-12">
      <div className="w-full max-w-md space-y-6">
        <PageBackButton className="mb-2 lg:hidden" />
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            NexTech CMS
          </h1>
          <p className="text-sm text-muted-foreground">
            Đăng nhập để quản lý hệ thống
          </p>
        </div>

        <Card className="border-0 shadow-none bg-transparent md:bg-card md:border md:shadow-sm md:rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Đăng nhập</CardTitle>
            <CardDescription>
              Nhập email và mật khẩu quản trị viên
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoginForm />

            <div className="flex justify-center -mt-1">
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
