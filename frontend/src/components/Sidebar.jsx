import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';

const Sidebar = () => {
  const links = [
    { name: 'Dashboard', to: '/admin/overview' },
    { name: 'Products', to: '/admin/products' },
    { name: 'Orders', to: '/admin/orders' },
    { name: 'Users', to: '/admin/users' },
  ];

  return (
    <aside className="w-64 bg-card shadow-sm border-r min-h-screen flex flex-col p-4">
      <h2 className="text-lg font-bold mb-6 text-foreground px-2">Admin Panel</h2>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            // "end" prop: ngăn /admin match active khi đang ở /admin/products, /admin/orders,...
            // Chỉ cần đặt end=true cho route cha /admin (index route)
            end={link.to === '/admin/overview'}
            className={({ isActive }) =>
              cn(
                'p-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )
            }
          >
            {link.name}
          </NavLink>
        ))}

        <NavLink
          to="/"
          end
          className="mt-8 p-2 rounded-md text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border-t border-border pt-4"
        >
          Back to Shop
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
