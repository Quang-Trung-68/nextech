import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';

const RegisterPage = () => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex justify-center items-center py-20">
      <div className="w-full max-w-md p-8 bg-card shadow border rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-primary">Register</h2>
         {/* TODO: Implement Register Form with react-hook-form */}
        <p className="text-muted-foreground text-center">Register Form Placeholder</p>
      </div>
    </div>
  );
};
export default RegisterPage;
