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
} from 'lucide-react';

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
    { name: 'Dashboard', to: '/admin/overview', icon: LayoutDashboard },
    { name: 'Products', to: '/admin/products', icon: Package },
    { name: 'Orders', to: '/admin/orders', icon: ShoppingCart },
    { name: 'Users', to: '/admin/users', icon: Users },
    { name: 'Coupons', to: '/admin/coupons', icon: Tag },
  ];

  return (
    <aside 
      className={cn(
        "bg-card shadow-sm flex flex-col p-4 transition-[width] duration-200 ease-in-out relative h-full",
        !isMobile ? "border-r min-h-screen" : "w-full border-r-0",
        !isMobile && collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {!isMobile && (
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 bg-border rounded-full p-0.5 border shadow-sm z-10 hover:bg-muted text-foreground"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}

      {!isMobile && collapsed ? (
        <h2 className="text-sm font-medium mb-6 text-foreground text-center truncate">UX</h2>
      ) : (
        <h2 className="text-sm font-medium mb-6 text-foreground px-2 truncate">Admin Panel</h2>
      )}

      {/* Admin Profile */}
      <div 
        className={cn("flex items-center gap-3 mb-6 px-2", !isMobile && collapsed ? "justify-center px-0" : "")}
        title={!isMobile && collapsed ? `${user?.name} · ${user?.email}` : undefined}
      >
        <Avatar 
          src={user?.avatar} 
          fallback={user?.name?.charAt(0) || 'A'} 
          className="flex-shrink-0"
        />
        {(!collapsed || isMobile) && (
          <div className="flex flex-col min-w-0 overflow-hidden">
            <span className="font-medium text-sm truncate">{user?.name}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
            <span className="mt-1 text-[10px] uppercase font-bold tracking-wider inline-flex justify-center border rounded-md px-1 w-max border-primary/20 bg-primary/10 text-primary">
              Administrator
            </span>
          </div>
        )}
      </div>

      <nav className="flex flex-col gap-1 flex-1">
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
          title={!isMobile && collapsed ? "Back to Shop" : undefined}
          className={({ isActive }) => cn(
            'flex items-center rounded-md font-medium transition-colors',
            !isMobile && collapsed ? 'justify-center p-2' : 'gap-3 py-1.5 px-2 text-sm',
            'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <ArrowLeft size={20} className="flex-shrink-0" />
          {(!collapsed || isMobile) && <span className="truncate">Back to Shop</span>}
        </NavLink>
        
        <button
          onClick={() => logout()}
          title={!isMobile && collapsed ? "Logout" : undefined}
          className={cn(
            'flex items-center rounded-md font-medium transition-colors text-destructive hover:bg-destructive/10 mt-auto',
            !isMobile && collapsed ? 'justify-center p-2' : 'gap-3 py-1.5 px-2 text-sm'
          )}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {(!collapsed || isMobile) && <span className="truncate">Logout</span>}
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
