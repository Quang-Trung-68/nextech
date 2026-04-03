import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, User, ShoppingCart, Menu, X, LogOut, Package, ShieldCheck } from 'lucide-react';
import useAuthStore from '@/stores/useAuthStore';
import { useCart } from '@/features/cart/hooks/useCart';
import { useUpdateCartItem, useRemoveCartItem, useClearCart } from '@/features/cart/hooks/useCartMutations';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatVND } from '@/utils/price';
import { VariantOptionBadges } from '@/components/product/VariantOptionBadges';
import SearchDialog from '../common/SearchDialog';
import MobileDrawer from './MobileDrawer';
import { useMyFavorites } from '@/features/favorites';
import NotificationDropdown from './NotificationDropdown';
import { getSlugByCategory } from '@/constants/category';

const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const userMenuRef = useRef(null);
  const cartRef = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, user, clearAuth } = useAuthStore();

  const { totalItems, cartItems, totalPrice } = useCart();
  const cartItemCount = totalItems || 0;

  const { data: favorites = [], isLoading: isFavoritesLoading } = useMyFavorites();
  const favoriteCount = favorites.length;
  
  const { mutate: updateQuantity } = useUpdateCartItem();
  const { mutate: removeItem } = useRemoveCartItem();
  const { mutate: clearCart } = useClearCart();

  // Đóng các dropdown khi redirect trang
  useEffect(() => {
    setIsSearchOpen(false);
    setIsCartOpen(false);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setIsCartOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navLinks = [
    { label: 'Điện thoại', path: '/phone' },
    { label: 'Laptop', path: '/laptop' },
    { label: 'Máy tính bảng', path: '/tablet' },
    { label: 'Phụ kiện', path: '/accessories' },
    { label: 'Hỗ trợ', path: '/support' },
  ];

  const getIsActive = (link) => {
    if (location.pathname === link.path) return true;
    if (link.path !== '/') {
      return location.pathname.startsWith(link.path + '/');
    }
    return false;
  };

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300 font-sans backdrop-blur-md bg-white/80 border-b border-[#d2d2d7]"
      >
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-row items-center justify-between h-16">
            
            {/* Left: Logo */}
            <div className="flex-1 flex justify-start">
              <Link to="/" className="text-apple-dark hover:opacity-70 transition-opacity text-2xl font-bold tracking-tight">
                NexTech
              </Link>
            </div>
            
            {/* Middle: Desktop Menu */}
            <div className="hidden md:flex items-center justify-center space-x-8">
              {navLinks.map((link) => {
                const isActive = getIsActive(link);

                return (
                  <Link
                    key={link.label}
                    to={link.path}
                    className={`relative inline-block text-[15px] tracking-[0.01em] transition-colors ${
                      isActive ? 'text-apple-blue' : 'text-apple-dark hover:text-apple-blue'
                    }`}
                  >
                    {/* Span ẩn luôn giữ kích thước font-bold → không bị layout shift */}
                    <span className="invisible font-bold block h-0 overflow-hidden select-none" aria-hidden="true">
                      {link.label}
                    </span>
                    {/* Text thật đặt absolute, không ảnh hưởng width */}
                    <span className={`absolute inset-0 flex items-center justify-center ${isActive ? 'font-bold' : 'font-medium'}`}>
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>
            
            {/* Right: Icons */}
            <div className="flex-1 flex justify-end items-center space-x-3 sm:space-x-4 md:space-x-6 text-apple-dark">
              {/* Search */}
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)} 
                className="hover:text-apple-blue transition-colors relative focus:outline-none"
              >
                <Search size={22} strokeWidth={1.5} />
              </button>
              
              {isAuthenticated ? (
                <>
                  {/* Heart */}
                  <Link 
                    to="/favorites" 
                    className="hidden md:block hover:text-apple-blue transition-colors relative focus:outline-none cursor-pointer"
                  >
                    <Heart size={22} strokeWidth={1.5} />
                  </Link>

                  <NotificationDropdown />
                  
                  {/* Cart */}
                  <div 
                    className="relative hidden md:block"
                    ref={cartRef}
                  >
                    <button 
                      className="hover:text-apple-blue transition-colors relative flex items-center py-2 focus:outline-none"
                      onClick={() => setIsCartOpen(!isCartOpen)}
                    >
                      <ShoppingCart size={22} strokeWidth={1.5} />
                      {cartItemCount > 0 && (
                        <span className="absolute top-[2px] -right-[8px] bg-apple-blue text-white text-[10px] rounded-full min-w-[17px] h-[17px] flex items-center justify-center font-bold shadow-sm px-[3px]">
                          {cartItemCount > 99 ? '99+' : cartItemCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Mini Cart Dropdown */}
                    {isCartOpen && (
                      <div className="absolute right-0 top-full mt-2 bg-white border border-[#d2d2d7] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-5 w-[340px] z-[110] animate-in fade-in zoom-in-95 duration-200">
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
                          <div className="flex flex-col gap-4 mb-5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {cartItems.map((item) => {
                              const listUnit =
                                item.originalUnitPrice != null && item.originalUnitPrice !== ''
                                  ? Number(item.originalUnitPrice)
                                  : Number(item.price);
                              const finalU =
                                item.finalPrice != null && item.finalPrice !== ''
                                  ? Number(item.finalPrice)
                                  : listUnit;
                              const showSale =
                                finalU < listUnit - 0.5 || (item.discountPercent ?? 0) > 0;
                              return (
                              <div key={item.id} className="flex gap-3">
                                <img 
                                  src={item.image || '/placeholder.png'} 
                                  alt={item.name} 
                                  className="w-14 h-14 object-cover rounded-md border border-border" 
                                />
                                <div className="flex-1 flex flex-col justify-between min-w-0">
                                  <Link 
                                    to={item.slug && item.category ? `/${getSlugByCategory(item.category)}/${item.slug}` : '#'} 
                                    className="text-[13px] font-semibold text-apple-dark line-clamp-2 hover:text-apple-blue transition-colors"
                                  >
                                    {item.name}
                                  </Link>
                                  <VariantOptionBadges options={item.variantOptions} className="mt-1" />
                                  <div className="flex justify-between items-center mt-2 group/cart-controls gap-2">
                                    <div className="flex items-center bg-[#f5f5f7] rounded-md overflow-hidden border border-[#d2d2d7] shrink-0">
                                      <button 
                                        className="w-6 h-6 flex items-center justify-center hover:bg-[#e8e8ed] text-apple-dark transition-colors"
                                        onClick={() => item.quantity > 1 ? updateQuantity({ productId: item.productId, quantity: item.quantity - 1, variantId: item.variantId }) : removeItem({ productId: item.productId, variantId: item.variantId })}
                                      >
                                        -
                                      </button>
                                      <span className="w-6 flex items-center justify-center text-[11px] font-medium border-x border-[#d2d2d7]">
                                        {item.quantity}
                                      </span>
                                      <button 
                                        className="w-6 h-6 flex items-center justify-center hover:bg-[#e8e8ed] text-apple-dark transition-colors disabled:opacity-50"
                                        onClick={() => updateQuantity({ productId: item.productId, quantity: item.quantity + 1, variantId: item.variantId })}
                                        disabled={item.quantity >= item.stock}
                                      >
                                        +
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0 justify-end">
                                      <div className="text-right min-w-0">
                                        {showSale ? (
                                          <span className="text-[13px] font-bold text-red-500 block leading-tight">
                                            {formatVND(finalU)}
                                          </span>
                                        ) : (
                                          <span className="text-[14px] font-bold text-apple-dark block leading-tight">
                                            {formatVND(finalU)}
                                          </span>
                                        )}
                                        {showSale && (
                                          <span className="text-[11px] line-through text-gray-400 block leading-tight">
                                            {formatVND(listUnit)}
                                          </span>
                                        )}
                                      </div>
                                      <button 
                                        className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover/cart-controls:opacity-100 sm:opacity-100 shrink-0"
                                        onClick={() => removeItem({ productId: item.productId, variantId: item.variantId })}
                                        title="Xóa sản phẩm"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );})}
                          </div>
                        )}

                        {cartItemCount > 0 && (
                          <div className="flex justify-between items-center mb-4 pt-4 border-t border-[#f5f5f7]">
                            <span className="text-[15px] text-apple-secondary font-medium">Tổng cộng:</span>
                            <span className="text-[17px] font-bold text-apple-dark">{formatCurrency(totalPrice)}</span>
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          {cartItemCount > 0 && (
                            <button 
                              onClick={() => {
                                navigate('/checkout');
                              }}
                              className="w-full bg-apple-blue hover:bg-apple-blue/90 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center text-[15px]"
                            >
                              Thanh toán ngay
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              navigate('/cart');
                            }}
                            className={`w-full font-semibold py-3 px-4 rounded-xl transition-all text-[15px] ${
                              cartItemCount > 0 
                                ? 'bg-apple-gray hover:bg-[#e8e8ed] text-apple-dark' 
                                : 'bg-apple-blue hover:bg-apple-blue/90 text-white shadow-sm'
                            }`}
                          >
                            Xem chi tiết giỏ hàng
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* User */}
                  <div className="relative hidden md:block" ref={userMenuRef}>
                    <button 
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          navigate('/profile');
                        } else {
                          setIsUserMenuOpen(!isUserMenuOpen);
                        }
                      }}
                      className="hover:text-apple-blue transition-colors flex items-center focus:outline-none"
                    >
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-[#d2d2d7]" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-center text-apple-dark">
                          <User size={18} strokeWidth={1.5} />
                        </div>
                      )}
                    </button>
                    
                    {/* Click Dropdown */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 z-[110]">
                         <div className="bg-white border border-[#d2d2d7] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-[260px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            
                            {/* User Info Header */}
                            <div className="p-4 border-b border-[#f5f5f7] flex items-center gap-3 bg-[#fafafa]">
                              {user?.avatar ? (
                                <img src={user.avatar} alt={user?.name} className="w-12 h-12 rounded-full object-cover border border-[#d2d2d7]" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-center text-apple-dark shrink-0">
                                  <User size={24} />
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
                    )}
                  </div>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-4 ml-2">
                  <Link to="/login" className="text-[14px] font-medium text-apple-dark hover:text-apple-blue transition-colors">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="text-[14px] font-medium bg-apple-dark hover:bg-black text-white px-5 py-2 rounded-full transition-colors flex items-center justify-center">
                    Đăng ký
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden hover:text-apple-blue transition-colors ml-2 focus:outline-none"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </nav>
        </div>
      </header>
      
      <MobileDrawer 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        navLinks={navLinks} 
        isAuthenticated={isAuthenticated} 
        clearAuth={clearAuth} 
      />
      
      {/* Search Overlay */}
      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Header;
