import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/features/cart/hooks/useCart';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const location = useLocation();
  const { totalItems } = useCart();

  // Hide BottomNav on certain pages if it's placed globally.
  // Actually, wait, the prompt says "Bottom Navigation Bar (Homepage + Products List only)".
  // If we only render it on those pages, we can just export it.
  
  const navItems = [
    {
      name: 'Trang chủ',
      href: '/',
      icon: Home,
    },
    {
      name: 'Sản phẩm',
      href: '/products',
      icon: LayoutGrid,
    },
    {
      name: 'Giỏ hàng',
      href: '/cart',
      icon: ShoppingBag,
      badge: totalItems > 0 ? totalItems : null,
    },
    {
      name: 'Cá nhân',
      href: '/profile',
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#d2d2d7] lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-[56px] px-2">
        {navItems.map((item) => {
          // Xử lý active trạng thái
          const isActive = 
            item.href === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px] gap-1 transition-colors select-none",
                isActive ? "text-apple-blue" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={cn("transition-transform duration-200", isActive && "scale-110")}
                />
                
                {item.badge != null && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 ring-2 ring-white z-10">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium tracking-tight",
                isActive && "font-bold"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
