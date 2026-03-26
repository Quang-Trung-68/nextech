import { NavLink, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, Lock, LogOut, ChevronRight } from 'lucide-react';
import useAuthStore from '@/stores/useAuthStore';

/** Generate a stable hue from userId for the avatar fallback background */
function getAvatarColor(userId = '') {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 60%, 50%)`;
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

const navItems = [
  { to: '/profile', label: 'Thông tin cá nhân', icon: User, end: true },
  { to: '/profile/orders', label: 'Đơn hàng của tôi', icon: Package },
  { to: '/profile/addresses', label: 'Địa chỉ giao hàng', icon: MapPin },
];

const ProfileSidebar = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    clearAuth();
    navigate('/login');
  };

  const bgColor = getAvatarColor(user?.id);
  const initials = getInitials(user?.name);

  return (
    <>
      {/* ── Desktop Sidebar ────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-[260px] shrink-0 bg-white border border-[#e5e5ea] rounded-2xl shadow-sm overflow-hidden sticky top-24 self-start">
        {/* User info */}
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6 border-b border-[#f5f5f7]">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm overflow-hidden"
            style={{ backgroundColor: user?.avatar ? 'transparent' : bgColor }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="text-center min-w-0">
            <p className="font-semibold text-apple-dark text-[15px] truncate max-w-[180px]">{user?.name}</p>
            <p className="text-xs text-apple-secondary truncate max-w-[180px] mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-apple-blue/10 text-apple-blue'
                    : 'text-apple-dark hover:bg-apple-gray hover:text-apple-dark'
                }`
              }
            >
              {({ isActive }) => {
                const Icon = item.icon;
                return (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-apple-blue' : 'text-apple-secondary group-hover:text-apple-dark'
                      }`}
                    />
                    <span>{item.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-apple-blue" />}
                  </>
                );
              }}
            </NavLink>
          ))}

          {/* Change password — external link */}
          <NavLink
            to="/profile/change-password"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-apple-blue/10 text-apple-blue'
                  : 'text-apple-dark hover:bg-apple-gray hover:text-apple-dark'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Lock
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-apple-blue' : 'text-apple-secondary group-hover:text-apple-dark'
                  }`}
                />
                <span>Đổi mật khẩu</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-apple-blue" />}
              </>
            )}
          </NavLink>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-[#f5f5f7]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Tab Bar ──────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-[#d2d2d7] flex items-stretch pb-[env(safe-area-inset-bottom)] h-[calc(56px+env(safe-area-inset-bottom))] shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] text-[10px] font-medium transition-colors ${
                isActive ? 'text-apple-blue' : 'text-apple-secondary'
              }`
            }
          >
            {({ isActive }) => {
              const Icon = item.icon;
              return (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-apple-blue' : 'text-apple-secondary'}`} />
                  <span className="leading-tight text-center">{item.label.split(' ')[0]}</span>
                </>
              );
            }}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] text-[10px] font-medium text-red-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Thoát</span>
        </button>
      </nav>
    </>
  );
};

export default ProfileSidebar;
