import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';

/**
 * Nhóm 3 guard — Yêu cầu đã đăng nhập VÀ đã xác thực email.
 *
 * Logic kiểm tra theo thứ tự ưu tiên:
 *   1. Chưa đăng nhập            → redirect /login  (lưu trang cũ để quay lại sau)
 *   2. Đã login, chưa verify email → redirect /verify-email-notice
 *   3. Đã login + đã verify       → render <Outlet /> bình thường
 *
 * Lưu ý: Frontend guard này bổ sung cho backend guard (require-email-verified
 * middleware). Dù user bypass được frontend, backend vẫn trả 403 và Axios
 * interceptor sẽ redirect /verify-email-notice.
 */
const VerifiedRoute = () => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // Chưa đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Đã đăng nhập nhưng chưa verify email
  if (!user?.isEmailVerified) {
    return <Navigate to="/verify-email-notice" replace />;
  }

  // Đủ điều kiện
  return <Outlet />;
};

export default VerifiedRoute;
