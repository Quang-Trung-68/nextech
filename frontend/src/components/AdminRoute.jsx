import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';

const AdminRoute = () => {
    const { user, isAuthenticated } = useAuthStore();
    
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    
    // If authenticated but not admin -> redirect to home
    return user?.role === 'ADMIN' ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;
