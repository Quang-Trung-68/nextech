import { useEffect, useState, useCallback } from 'react';
import usePageTitle from '@/hooks/usePageTitle';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Loader2, RefreshCw, Clock, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSendVerificationEmail } from '@/features/auth/hooks/useAuth';
import useAuthStore from '@/stores/useAuthStore';
import axiosInstance from '@/lib/axios';

const COOLDOWN_SECONDS = 60;

const VerifyEmailPage = () => {
  usePageTitle('Xác thực Email');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const updateEmailVerified = useAuthStore((s) => s.updateEmailVerified);
  const { mutate: resendEmail, isPending: isResending } = useSendVerificationEmail();

  const [cooldown, setCooldown] = useState(0);

  /**
   * useQuery thay vì useMutation để fix double-call trong React StrictMode.
   *
   * Vấn đề với useMutation + useEffect:
   *   StrictMode mount #1 → mutate() → isPending=true
   *   StrictMode remount  → useMutation reset về idle (isPending=false)
   *   → kết quả từ mount #1 bị mất, UI bị stuck hoặc hiển thị null
   *
   * Tại sao useQuery hoạt động đúng:
   *   1. Deduplication theo queryKey: cùng key ['verify-email', token]
   *      → chỉ 1 network request dù StrictMode gọi 2 lần
   *   2. Kết quả được cache trong QueryClient → mount #2 tái dùng ngay lập tức
   *   3. retry:false → không retry khi token hết hạn/đã dùng
   *   4. staleTime:Infinity → không refetch tự động
   *   5. gcTime:0 → xóa cache ngay khi component unmount (token là one-time use)
   */
  const { isPending: isVerifying, isSuccess, isError, error } = useQuery({
    queryKey: ['verify-email', token],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/auth/verify-email?token=${encodeURIComponent(token)}`
      );
      return data;
    },
    enabled: !!token,      // Chỉ chạy khi có token trong URL
    retry: false,          // Không retry — token chỉ dùng 1 lần, retry sẽ luôn thất bại
    staleTime: Infinity,   // Không refetch — kết quả xác thực không bao giờ stale
    gcTime: 0,             // Xóa cache khi unmount — token đã consumed, không cần giữ lại
  });

  // Cập nhật Zustand store khi xác thực thành công
  useEffect(() => {
    if (isSuccess) {
      updateEmailVerified(true);
    }
  }, [isSuccess, updateEmailVerified]);


  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = useCallback(() => {
    if (cooldown > 0 || isResending) return;
    resendEmail(undefined, {
      onSuccess: () => setCooldown(COOLDOWN_SECONDS),
    });
  }, [cooldown, isResending, resendEmail]);

  // ── No token in URL ───────────────────────────────────────────────────────
  if (!token) {
    return (
      <StatusCard
        icon={<XCircle className="h-12 w-12 text-destructive" />}
        bg="bg-destructive/10"
        title="Link không hợp lệ"
        description="Không tìm thấy token xác thực trong URL. Vui lòng sử dụng link trong email đã gửi cho bạn."
        footer={<ResendBlock cooldown={cooldown} isResending={isResending} onResend={handleResend} />}
      />
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isVerifying) {
    return (
      <StatusCard
        icon={<Loader2 className="h-12 w-12 text-primary animate-spin" />}
        bg="bg-primary/10"
        title="Đang xác thực..."
        description="Vui lòng chờ trong giây lát."
      />
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <StatusCard
        icon={<CheckCircle2 className="h-12 w-12 text-green-600" />}
        bg="bg-green-50 dark:bg-green-900/20"
        title="Xác thực thành công! 🎉"
        description="Email của bạn đã được xác thực. Bây giờ bạn có thể sử dụng đầy đủ các tính năng của ShopNow."
        footer={
          <Link to="/">
            <Button id="btn-goto-home" className="gap-2" size="lg">
              <Home className="h-4 w-4" />
              Về trang chủ
            </Button>
          </Link>
        }
      />
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (isError) {
    const message =
      error?.response?.data?.message ||
      'Token xác thực không hợp lệ hoặc đã hết hạn.';
    return (
      <StatusCard
        icon={<XCircle className="h-12 w-12 text-destructive" />}
        bg="bg-destructive/10"
        title="Xác thực thất bại"
        description={message}
        footer={<ResendBlock cooldown={cooldown} isResending={isResending} onResend={handleResend} />}
      />
    );
  }

  return null;
};

// ── Shared layout card ────────────────────────────────────────────────────────
function StatusCard({ icon, bg, title, description, footer }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center space-y-6">
        <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-border ${bg}`}>
          {icon}
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
        {footer && <div className="pt-2">{footer}</div>}
      </div>
    </div>
  );
}

// ── Resend block (reused in multiple states) ──────────────────────────────────
function ResendBlock({ cooldown, isResending, onResend }) {
  return (
    <div className="space-y-3">
      <Button
        id="btn-resend-after-error"
        onClick={onResend}
        disabled={isResending || cooldown > 0}
        variant="outline"
        className="w-full gap-2"
        size="lg"
      >
        {isResending ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Đang gửi...</>
        ) : cooldown > 0 ? (
          <><Clock className="h-4 w-4" />Gửi lại sau {cooldown}s</>
        ) : (
          <><RefreshCw className="h-4 w-4" />Gửi lại email xác thực</>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        <Link to="/forgot-password" className="text-primary hover:underline">
          Quên mật khẩu?
        </Link>
        {' · '}
        <Link to="/" className="text-primary hover:underline">
          Về trang chủ
        </Link>
      </p>
    </div>
  );
}

export default VerifyEmailPage;
