import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, User, ShoppingCart, Menu, X, LogOut, Package, Settings, ShieldCheck } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import { useCart } from '../features/cart/hooks/useCart';
import { useUpdateCartItem, useRemoveCartItem, useClearCart } from '../features/cart/hooks/useCartMutations';
import { formatCurrency } from '../utils/formatCurrency';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { isAuthenticated, user, clearAuth } = useAuthStore();

  const { totalItems, cartItems, totalPrice } = useCart();
  const cartItemCount = totalItems || 0;
  
  const { mutate: updateQuantity } = useUpdateCartItem();
  const { mutate: removeItem } = useRemoveCartItem();
  const { mutate: clearCart } = useClearCart();

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
                  <div 
                    className="relative"
                    onMouseEnter={() => setIsCartOpen(true)}
                    onMouseLeave={() => setIsCartOpen(false)}
                  >
                    <button 
                      className="hover:text-apple-blue transition-colors relative flex items-center py-2"
                      onClick={() => navigate('/cart')}
                    >
                      <ShoppingCart size={18} strokeWidth={1.5} />
                      {cartItemCount > 0 && (
                        <span className="absolute top-[2px] -right-[8px] bg-apple-blue text-white text-[9px] rounded-full w-[15px] h-[15px] flex items-center justify-center font-bold shadow-sm">
                          {cartItemCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Mini Cart Placeholder */}
                    {isCartOpen && (
                      <div className="absolute right-[-20%] top-[70%] bg-white border border-[#d2d2d7] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-5 w-[320px] z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="mb-4 flex flex-row items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-apple-dark">Giỏ hàng của bạn</h4>
                            <p className="text-sm text-apple-secondary">Đang có {cartItemCount} sản phẩm</p>
                          </div>
                          {cartItemCount > 0 && (
                            <button 
                              className="text-xs text-red-500 font-medium hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
                              onClick={() => {
                                clearCart();
                                setIsCartOpen(false);
                              }}
                            >
                              Xóa tất cả
                            </button>
                          )}
                        </div>
                        
                        {cartItemCount === 0 ? (
                          <div className="flex flex-col gap-3 mb-6 min-h-[120px] items-center justify-center border border-dashed border-[#d2d2d7] rounded-xl py-4 bg-apple-gray/30">
                            <ShoppingCart size={24} className="text-[#d2d2d7] mb-2" />
                            <span className="text-sm text-apple-secondary font-medium">
                              Dữ liệu giỏ hàng trống
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4 mb-5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            {cartItems.map(item => (
                              <div key={item.id} className="flex gap-3">
                                <img 
                                  src={item.image || '/placeholder.png'} 
                                  alt={item.name} 
                                  className="w-12 h-12 object-cover rounded-md border border-border" 
                                />
                                <div className="flex-1 flex flex-col justify-between">
                                  <Link 
                                    to={`/products/${item.productId}`} 
                                    className="text-xs font-semibold text-apple-dark line-clamp-2 hover:text-apple-blue transition-colors"
                                    onClick={() => setIsCartOpen(false)}
                                  >
                                    {item.name}
                                  </Link>
                                  <div className="flex justify-between items-center mt-2 group/cart-controls">
                                    <div className="flex items-center bg-[#f5f5f7] rounded-md overflow-hidden border border-[#d2d2d7]">
                                      <button 
                                        className="w-5 h-5 flex items-center justify-center hover:bg-[#e8e8ed] text-apple-dark transition-colors"
                                        onClick={() => item.quantity > 1 ? updateQuantity({ productId: item.productId, quantity: item.quantity - 1 }) : removeItem(item.productId)}
                                      >
                                        -
                                      </button>
                                      <span className="w-5 flex items-center justify-center text-[10px] font-medium border-x border-[#d2d2d7]">
                                        {item.quantity}
                                      </span>
                                      <button 
                                        className="w-5 h-5 flex items-center justify-center hover:bg-[#e8e8ed] text-apple-dark transition-colors disabled:opacity-50"
                                        onClick={() => updateQuantity({ productId: item.productId, quantity: item.quantity + 1 })}
                                        disabled={item.quantity >= item.stock}
                                      >
                                        +
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[13px] font-bold text-primary">{formatCurrency(item.price)}</span>
                                      <button 
                                        className="w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover/cart-controls:opacity-100 sm:opacity-100"
                                        onClick={() => removeItem(item.productId)}
                                        title="Xóa sản phẩm"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {cartItemCount > 0 && (
                          <div className="flex justify-between items-center mb-4 pt-4 border-t border-[#f5f5f7]">
                            <span className="text-sm text-apple-secondary font-medium">Tổng cộng:</span>
                            <span className="text-lg font-bold text-apple-dark">{formatCurrency(totalPrice)}</span>
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          {cartItemCount > 0 && (
                            <button 
                              onClick={() => {
                                setIsCartOpen(false);
                                navigate('/checkout');
                              }}
                              className="w-full bg-apple-blue hover:bg-apple-blue/90 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center text-sm"
                            >
                              Thanh toán ngay
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setIsCartOpen(false);
                              navigate('/cart');
                            }}
                            className={`w-full font-semibold py-2.5 px-4 rounded-xl transition-all text-sm ${
                              cartItemCount > 0 
                                ? 'bg-apple-gray hover:bg-[#e8e8ed] text-apple-dark' 
                                : 'bg-apple-blue hover:bg-apple-blue/90 text-white shadow-sm'
                            }`}
                          >
                            Xem giỏ hàng
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* User */}
                  <div className="relative group/user hidden sm:block">
                    <Link to="/profile" className="hover:text-apple-blue transition-colors flex items-center">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover border border-[#d2d2d7]" />
                      ) : (
                        <User size={18} strokeWidth={1.5} />
                      )}
                    </Link>
                    
                    {/* Hover Dropdown */}
                    <div className="absolute right-0 top-[60%] pt-3 hidden group-hover/user:block z-50">
                       <div className="bg-white border border-[#d2d2d7] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-[260px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
                          
                          {/* User Info Header */}
                          <div className="p-4 border-b border-[#f5f5f7] flex items-center gap-3 bg-[#fafafa]">
                            {user?.avatar ? (
                              <img src={user.avatar} alt={user?.name} className="w-10 h-10 rounded-full object-cover border border-[#d2d2d7]" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-center text-apple-dark">
                                <User size={20} />
                              </div>
                            )}
                            <div className="flex flex-col min-w-0 pr-2">
                               <span className="text-[15px] font-semibold text-apple-dark truncate">{user?.name || 'Người dùng'}</span>
                               <span className="text-[13px] text-apple-secondary truncate">{user?.email || 'Thành viên mới'}</span>
                            </div>
                          </div>

                          {/* Links */}
                          <div className="p-2 flex flex-col gap-0.5">
                            {user?.role === 'ADMIN' && (
                              <Link to="/admin" className="px-3 py-2 text-[14px] text-apple-dark hover:bg-apple-gray rounded-xl transition-colors flex items-center gap-3 font-medium">
                                <ShieldCheck size={18} className="text-apple-blue" />
                                Theo dõi quản trị
                              </Link>
                            )}
                            
                            <Link to="/profile" className="px-3 py-2 text-[14px] text-apple-dark hover:bg-apple-gray rounded-xl transition-colors flex items-center gap-3 font-medium">
                              <User size={18} className="text-[#86868b]" />
                              Tài khoản của tôi
                            </Link>
                            
                            <Link to="/profile/orders" className="px-3 py-2 text-[14px] text-apple-dark hover:bg-apple-gray rounded-xl transition-colors flex items-center gap-3 font-medium">
                              <Package size={18} className="text-[#86868b]" />
                              Quản lý đơn hàng
                            </Link>

                            <Link to="/favorites" className="px-3 py-2 text-[14px] text-apple-dark hover:bg-apple-gray rounded-xl transition-colors flex items-center gap-3 font-medium">
                              <Heart size={18} className="text-[#86868b]" />
                              Sản phẩm yêu thích
                            </Link>
                          </div>

                          {/* Logout */}
                          <div className="p-2 border-t border-[#f5f5f7]">
                            <button onClick={clearAuth} className="w-full px-3 py-2 text-[14px] text-left text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-3 font-medium">
                              <LogOut size={18} />
                              Đăng xuất tài khoản
                            </button>
                          </div>

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
