import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';

const LoginPage = () => {
  const { isAuthenticated, setAuth } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex justify-center items-center py-20">
      <div className="w-full max-w-md p-8 bg-card shadow border rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-primary">Login</h2>
        {/* TODO: Implement Login Form with react-hook-form */}
        <p className="text-muted-foreground text-center">Login Form Placeholder</p>
      </div>
    </div>
  );
};
export default LoginPage;
