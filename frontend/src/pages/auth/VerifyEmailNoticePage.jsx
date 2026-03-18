import { useState, useEffect, useCallback } from 'react';
import usePageTitle from '@/hooks/usePageTitle';
import { Link } from 'react-router-dom';
import { MailCheck, Clock, ShoppingBag, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSendVerificationEmail } from '@/features/auth/hooks/useAuth';
import useAuthStore from '@/stores/useAuthStore';

const COOLDOWN_SECONDS = 60;

const VerifyEmailNoticePage = () => {
  usePageTitle('Yêu cầu xác thực Email');
  const user = useAuthStore((s) => s.user);
  const { mutate: sendEmail, isPending } = useSendVerificationEmail();

  const [cooldown, setCooldown] = useState(0);

  // Tick down the cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timerId = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timerId);
  }, [cooldown]);

  const handleResend = useCallback(() => {
    if (cooldown > 0 || isPending) return;
    sendEmail(undefined, {
      onSuccess: () => setCooldown(COOLDOWN_SECONDS),
    });
  }, [cooldown, isPending, sendEmail]);

  const isDisabled = isPending || cooldown > 0;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center space-y-6">
        {/* ── Icon ─────────────────────────────────────────────────────────── */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700">
          <MailCheck className="h-10 w-10 text-amber-500" />
        </div>

        {/* ── Heading ──────────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Xác thực email của bạn
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Tài khoản{' '}
            <span className="font-medium text-foreground">{user?.email ?? 'của bạn'}</span>{' '}
            chưa được xác thực. Vui lòng kiểm tra hộp thư và nhấn vào link xác thực để tiếp tục.
          </p>
        </div>

        {/* ── Steps info ───────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-muted/40 p-5 text-left space-y-3">
          {[
            { step: '1', text: 'Kiểm tra hộp thư của bạn (kể cả thư mục Spam).' },
            { step: '2', text: 'Mở email từ ShopNow và nhấn "Xác thực ngay".' },
            { step: '3', text: 'Quay lại trình duyệt và làm mới trang.' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {step}
              </span>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        {/* ── Resend button ─────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <Button
            id="btn-resend-verification"
            onClick={handleResend}
            disabled={isDisabled}
            className="w-full gap-2"
            size="lg"
          >
            {isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock className="h-4 w-4" />
                Gửi lại sau {cooldown}s
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Gửi lại email xác thực
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            Sau khi nhấn, bạn phải đợi {COOLDOWN_SECONDS} giây trước khi gửi lại.
          </p>
        </div>

        {/* ── Back link ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ShoppingBag className="h-4 w-4" />
          <Link to="/" className="font-medium text-primary hover:underline">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailNoticePage;
