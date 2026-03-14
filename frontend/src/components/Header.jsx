import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, User, ShoppingCart, Menu, X } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../lib/axios';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { isAuthenticated, user, clearAuth } = useAuthStore();

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await axiosInstance.get('/cart');
      return res.data;
    },
    enabled: isAuthenticated,
  });

  const cartItemCount = cartData?.items?.length || 0;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Điện thoại', path: '/products?category=smartphone' },
    { label: 'Laptop', path: '/products?category=laptop' },
    { label: 'Máy tính bảng', path: '/products?category=tablet' },
    { label: 'Phụ kiện', path: '/products?category=accessory' },
    { label: 'Khuyến mãi', path: '/products?sale=true' },
  ];

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-sans ${
          isScrolled 
            ? 'bg-[rgba(255,255,255,0.85)] backdrop-blur-md border-b border-[#d2d2d7]' 
            : 'bg-white'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <nav className="flex items-center justify-between h-14">
            
            {/* Left: Logo */}
            <div className="flex-1 flex justify-start">
              <Link to="/" className="text-apple-dark hover:opacity-70 transition-opacity text-xl font-bold tracking-tight">
                NexTech
              </Link>
            </div>
            
            {/* Middle: Desktop Menu */}
            <div className="hidden md:flex items-center justify-center space-x-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.label}
                  to={link.path} 
                  className="text-apple-dark text-[13px] tracking-[0.01em] font-medium hover:text-apple-blue transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            {/* Right: Icons */}
            <div className="flex-1 flex justify-end items-center space-x-5 text-apple-dark">
              {/* Search */}
              <button onClick={() => setIsSearchOpen(true)} className="hover:text-apple-blue transition-colors relative">
                <Search size={18} strokeWidth={1.5} />
              </button>
              
              {isAuthenticated ? (
                <>
                  {/* Heart */}
                  <Link to="/favorites" className="hidden sm:block hover:text-apple-blue transition-colors">
                    <Heart size={18} strokeWidth={1.5} />
                  </Link>
                  
                  {/* Cart */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsCartOpen(!isCartOpen)} 
                      className="hover:text-apple-blue transition-colors relative flex items-center"
                    >
                      <ShoppingCart size={18} strokeWidth={1.5} />
                      {cartItemCount > 0 && (
                        <span className="absolute -top-[6px] -right-[8px] bg-apple-blue text-white text-[9px] rounded-full w-[15px] h-[15px] flex items-center justify-center font-bold shadow-sm">
                          {cartItemCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Mini Cart Placeholder */}
                    {isCartOpen && (
                      <div className="absolute right-0 top-[140%] bg-white border border-[#d2d2d7] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-5 w-[320px] z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="mb-4">
                          <h4 className="font-semibold text-apple-dark">Giỏ hàng của bạn</h4>
                          <p className="text-sm text-apple-secondary">Đang có {cartItemCount} sản phẩm</p>
                        </div>
                        
                        <div className="flex flex-col gap-3 mb-6 min-h-[120px] items-center justify-center border border-dashed border-[#d2d2d7] rounded-xl py-4 bg-apple-gray/30">
                           <ShoppingCart size={24} className="text-[#d2d2d7] mb-2" />
                           <span className="text-sm text-apple-secondary font-medium">
                             Dữ liệu giỏ hàng trống
                           </span>
                        </div>

                        <button 
                          onClick={() => {
                            setIsCartOpen(false);
                            navigate('/checkout');
                          }}
                          className="w-full bg-apple-blue hover:bg-apple-blue/90 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center"
                        >
                          Thanh toán ngay
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* User */}
                  <div className="relative group/user hidden sm:block">
                    <Link to="/profile" className="hover:text-apple-blue transition-colors">
                      <User size={18} strokeWidth={1.5} />
                    </Link>
                    <div className="absolute right-0 top-[95%] pt-2 hidden group-hover/user:block">
                       <div className="bg-white border border-[#d2d2d7] rounded-xl shadow-lg p-2 w-40 flex flex-col gap-1">
                          {user?.role === 'ADMIN' && (
                            <Link to="/admin" className="px-3 py-2 text-sm text-apple-dark hover:bg-apple-gray rounded-lg transition-colors">Admin</Link>
                          )}
                          <Link to="/profile" className="px-3 py-2 text-sm text-apple-dark hover:bg-apple-gray rounded-lg transition-colors">Cá nhân</Link>
                          <button onClick={clearAuth} className="px-3 py-2 text-sm text-left text-red-500 hover:bg-apple-gray rounded-lg transition-colors">Đăng xuất</button>
                       </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-4 ml-2">
                  <Link to="/login" className="text-[13px] font-medium text-apple-dark hover:text-apple-blue transition-colors">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="text-[13px] font-medium bg-apple-dark hover:bg-black text-white px-4 py-1.5 rounded-full transition-colors flex items-center justify-center">
                    Đăng ký
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden hover:text-apple-blue transition-colors ml-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-14 left-0 right-0 bg-white border-b border-[#d2d2d7] shadow-lg py-4 px-6 flex flex-col gap-3 animate-in slide-in-from-top-2">
            {navLinks.map((link) => (
              <Link 
                key={link.label}
                to={link.path} 
                className="text-apple-dark text-base font-semibold py-3 border-b border-[#f5f5f7] last:border-none hover:text-apple-blue transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            <div className={`mt-2 pt-4 border-t border-[#d2d2d7] ${isAuthenticated ? 'flex items-center gap-8' : 'flex flex-col gap-3'}`}>
               {isAuthenticated ? (
                 <>
                   <Link to="/favorites" className="flex flex-col items-center gap-1.5 text-apple-secondary hover:text-apple-dark transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                     <Heart size={22} strokeWidth={1.5} />
                     <span className="text-[11px] font-medium">Yêu thích</span>
                   </Link>
                   <Link to="/profile" className="flex flex-col items-center gap-1.5 text-apple-secondary hover:text-apple-dark transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                     <User size={22} strokeWidth={1.5} />
                     <span className="text-[11px] font-medium">Tài khoản</span>
                   </Link>
                 </>
               ) : (
                 <>
                   <Link to="/login" className="w-full py-2.5 text-center text-[13px] font-medium bg-apple-gray hover:bg-[#e8e8ed] text-apple-dark rounded-xl transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                     Đăng nhập
                   </Link>
                   <Link to="/register" className="w-full py-2.5 text-center text-[13px] font-medium bg-apple-dark hover:bg-black text-white rounded-xl transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                     Đăng ký
                   </Link>
                 </>
               )}
            </div>
          </div>
        )}
      </header>
      
      {/* Full-width Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-md animate-in fade-in flex flex-col p-6 sm:p-24 selection:bg-apple-blue/20">
          <div className="max-w-[800px] w-full mx-auto relative mt-16 sm:mt-0">
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="absolute -top-16 sm:-top-20 right-0 text-apple-secondary hover:text-apple-dark transition-colors p-2"
            >
              <X size={36} strokeWidth={1.5} />
            </button>
            <div className="flex items-center border-b-[2px] border-apple-dark pb-4">
              <Search size={32} className="text-apple-dark mr-4 shrink-0" strokeWidth={2} />
              <input 
                autoFocus
                type="text" 
                placeholder="Tìm kiếm sản phẩm, thương hiệu..." 
                className="w-full text-2xl sm:text-4xl font-medium sm:font-semibold bg-transparent border-none outline-none placeholder:text-[#d2d2d7] text-apple-dark font-sans"
              />
            </div>
            
            <div className="mt-10">
              <h4 className="text-xs font-semibold text-apple-secondary uppercase tracking-[0.05em] mb-4">Liên kết nhanh</h4>
              <div className="flex flex-wrap gap-2.5">
                {['iPhone 15 Pro Max', 'MacBook Air M2', 'iPad Pro', 'AirPods Pro 2'].map(term => (
                  <button 
                    key={term}
                    className="px-4 py-2.5 rounded-full bg-apple-gray/50 hover:bg-[#e8e8ed] text-apple-dark text-[13px] font-medium transition-colors border border-transparent hover:border-[#d2d2d7]"
                    onClick={() => {
                        setIsSearchOpen(false);
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
