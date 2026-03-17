import { Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from '../stores/useAuthStore';
import { toast } from '../lib/toast';

const AdminRoute = () => {
    const { user, isAuthenticated } = useAuthStore();
    
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    
    // If authenticated but not admin -> show toast and redirect to home
    if (user?.role !== 'ADMIN') {
      return <NotAdminRedirect />;
    }
    
    return <Outlet />;
};

// Separate component to use hooks for toast side-effect
const NotAdminRedirect = () => {
  useEffect(() => {
    toast.error('Bạn không có quyền truy cập trang này');
  }, []);
  return <Navigate to="/" replace />;
};

export default AdminRoute;
