import { Link } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

const Navbar = () => {
  const { isAuthenticated, user, clearAuth } = useAuthStore();

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await axiosInstance.get('/cart');
      return res.data;
    },
    enabled: isAuthenticated, // Chỉ trigger fetch dữ liệu giỏ hàng nếu user đã login
  });

  // Lấy length hoặc total quantity tùy thuộc vào format trả về của backend
  const cartItemCount = cartData?.items?.length || 0;

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-card text-card-foreground shadow-sm border-b">
      <Link to="/" className="text-2xl font-bold tracking-tight text-primary">E-Commerce</Link>
      
      <div className="flex items-center gap-6">
        {isAuthenticated && (
          <Link to="/cart" className="relative flex items-center hover:text-primary transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
        )}

        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Hello, {user?.name}</span>
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className="text-sm font-medium hover:text-primary transition-colors">Admin</Link>
            )}
            <button 
              onClick={clearAuth} 
              className="text-sm font-medium text-destructive hover:underline"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">Login</Link>
            <Link to="/register" className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
