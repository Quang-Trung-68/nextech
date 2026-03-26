import { Navigate } from 'react-router-dom';
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
import RegisterForm from '@/features/auth/components/RegisterForm';
import PageBackButton from '@/components/common/PageBackButton';

const RegisterPage = () => {
  usePageTitle('Đăng ký');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Nếu đã đăng nhập → redirect về trang chủ ngay
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-6 md:py-12">
      <div className="w-full max-w-md space-y-6">
        <PageBackButton className="mb-2 lg:hidden" />
        {/* ── Logo / App name ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            NexTech
          </h1>
          <p className="text-sm text-muted-foreground">
            Tạo tài khoản để bắt đầu mua sắm
          </p>
        </div>

        {/* ── Card wrapping the form ───────────────────────────────────── */}
        <Card className="border-0 shadow-none bg-transparent md:bg-card md:border md:shadow-sm md:rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Đăng ký</CardTitle>
            <CardDescription>
              Điền thông tin bên dưới để tạo tài khoản mới
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
