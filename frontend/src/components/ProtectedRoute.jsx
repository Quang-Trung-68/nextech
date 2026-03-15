import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';

/**
 * Nhóm 2 guard — Yêu cầu đã đăng nhập.
 * Không quan tâm isEmailVerified.
 * Nếu chưa đăng nhập → redirect /login (giữ lại trang cũ để quay lại sau khi login).
 */
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;
