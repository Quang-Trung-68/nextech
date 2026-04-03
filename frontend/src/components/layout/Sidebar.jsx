import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import useAuthStore from '@/stores/useAuthStore';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  ArrowLeft, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Tag,
  Settings,
  Warehouse,
  Truck,
  Barcode,
} from 'lucide-react';
import NotificationDropdown from '@/components/layout/NotificationDropdown';

// Custom Avatar component replacing Shadcn Avatar to avoid missing dependencies
const Avatar = ({ src, fallback, className }) => {
  const [error, setError] = useState(false);
  return (
    <div className={cn("relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted items-center justify-center", className)}>
      {src && !error ? (
        <img 
          src={src} 
          className="aspect-square h-full w-full object-cover" 
          onError={() => setError(true)} 
          alt="Avatar"
        />
      ) : (
        <span className="text-muted-foreground font-medium uppercase text-xs">{fallback}</span>
      )}
    </div>
  );
};

const Sidebar = ({ isMobile }) => {
  const user = useAuthStore((s) => s.user);
  const { mutate: logout } = useLogout();
  
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('adminSidebarCollapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', collapsed);
  }, [collapsed]);

  const links = [
    { name: 'Tổng quan', to: '/admin/overview', icon: LayoutDashboard },
    { name: 'Sản phẩm', to: '/admin/products', icon: Package },
    { name: 'Đơn hàng', to: '/admin/orders', icon: ShoppingCart },
    { name: 'Nhà cung cấp', to: '/admin/inventory/suppliers', icon: Warehouse },
    { name: 'Nhập kho', to: '/admin/inventory/stock-imports', icon: Truck },
    { name: 'Serial / IMEI', to: '/admin/inventory/serials', icon: Barcode },
    { name: 'Người dùng', to: '/admin/users', icon: Users },
    { name: 'Mã giảm giá', to: '/admin/coupons', icon: Tag },
    { name: 'Cài đặt', to: '/admin/settings', icon: Settings },
  ];

  return (
    <aside 
      className={cn(
        "bg-card shadow-sm flex flex-col p-4 transition-[width] duration-200 ease-in-out relative h-full overflow-visible",
        !isMobile ? "border-r min-h-screen" : "w-full border-r-0",
        !isMobile && collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {!isMobile && (
        <button 
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-4 bg-border rounded-full p-0.5 border shadow-sm z-10 hover:bg-muted text-foreground"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}

      {/* Đầu nav: badge vai trò (khi mở rộng / mobile); không còn chữ "QT" */}
      <div className="mb-4 flex flex-col gap-4 shrink-0">
        {(!collapsed || isMobile) && (
          <div className="px-2 pt-0.5">
            <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider border rounded-md px-2 py-1 border-primary/20 bg-primary/10 text-primary">
              Quản trị viên
            </span>
          </div>
        )}

        <div
          className={cn(
            'flex items-center gap-3 px-2',
            !isMobile && collapsed ? 'justify-center px-0' : '',
          )}
          title={!isMobile && collapsed ? `${user?.name} · ${user?.email}` : undefined}
        >
          <Avatar
            src={user?.avatar}
            fallback={user?.name?.charAt(0) || 'A'}
            className="flex-shrink-0 h-9 w-9"
          />
          {(!collapsed || isMobile) && (
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium">{user?.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
            </div>
          )}
        </div>

        <div
          className={cn('px-2', !isMobile && collapsed ? 'flex justify-center px-0' : '')}
          title={!isMobile && collapsed ? 'Thông báo' : undefined}
        >
          <div className="text-muted-foreground [&_button]:text-muted-foreground [&_button:hover]:text-foreground">
            <NotificationDropdown variant="sidebar" />
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin/overview'}
            title={!isMobile && collapsed ? link.name : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md font-medium transition-colors',
                !isMobile && collapsed ? 'justify-center p-2' : 'gap-3 py-1.5 px-2 text-sm',
                isActive
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <link.icon size={20} className="flex-shrink-0" />
            {(!collapsed || isMobile) && <span className="truncate">{link.name}</span>}
          </NavLink>
        ))}

        <div className="my-2 border-t border-border" />

        <NavLink
          to="/"
          end
          title={!isMobile && collapsed ? 'Về cửa hàng' : undefined}
          className={() => cn(
            'flex items-center rounded-md font-medium transition-colors',
            !isMobile && collapsed ? 'justify-center p-2' : 'gap-3 py-1.5 px-2 text-sm',
            'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <ArrowLeft size={20} className="flex-shrink-0" />
          {(!collapsed || isMobile) && <span className="truncate">Về cửa hàng</span>}
        </NavLink>
        
        <button
          onClick={() => logout()}
          title={!isMobile && collapsed ? 'Đăng xuất' : undefined}
          className={cn(
            'flex items-center rounded-md font-medium transition-colors text-destructive hover:bg-destructive/10 mt-auto',
            !isMobile && collapsed ? 'justify-center p-2' : 'gap-3 py-1.5 px-2 text-sm'
          )}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {(!collapsed || isMobile) && <span className="truncate">Đăng xuất</span>}
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
