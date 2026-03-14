import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';

const ProtectedRoute = () => {
    const { isAuthenticated } = useAuthStore();
    const location = useLocation();
    
    // Redirect to login but save the attempted location so you can return after login
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;
