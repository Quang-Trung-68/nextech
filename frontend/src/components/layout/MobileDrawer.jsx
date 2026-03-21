import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Heart, User, LogOut } from 'lucide-react';

const MobileDrawer = ({ isOpen, onClose, navLinks, isAuthenticated, clearAuth }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white z-50 shadow-2xl flex flex-col pt-6 pb-6 px-6 animate-in slide-in-from-right overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <span className="text-xl font-bold tracking-tight text-apple-dark">Menu</span>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-apple-dark hover:text-apple-blue transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex flex-col gap-4 flex-1">
          {navLinks.map((link) => (
            <Link 
              key={link.label}
              to={link.path} 
              className="text-apple-dark text-lg font-semibold py-3 border-b border-[#f5f5f7] hover:text-apple-blue transition-colors"
              onClick={onClose}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 pt-6 border-t border-[#d2d2d7]">
          {isAuthenticated ? (
            <div className="flex flex-col gap-4">
              <Link to="/favorites" className="flex items-center gap-3 text-apple-dark hover:text-apple-blue transition-colors" onClick={onClose}>
                <Heart size={20} className="text-apple-secondary" />
                <span className="font-medium text-base">Sản phẩm yêu thích</span>
              </Link>
              <Link to="/profile" className="flex items-center gap-3 text-apple-dark hover:text-apple-blue transition-colors" onClick={onClose}>
                <User size={20} className="text-apple-secondary" />
                <span className="font-medium text-base">Tài khoản của tôi</span>
              </Link>
              <button 
                onClick={() => { clearAuth(); onClose(); }}
                className="flex items-center gap-3 text-red-500 hover:text-red-600 transition-colors mt-2 text-left"
              >
                <LogOut size={20} />
                <span className="font-medium text-base">Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link 
                to="/login" 
                className="w-full py-3.5 text-center text-base font-semibold bg-[#f5f5f7] text-apple-dark rounded-xl transition-colors hover:bg-[#e8e8ed]" 
                onClick={onClose}
              >
                Đăng nhập
              </Link>
              <Link 
                to="/register" 
                className="w-full py-3.5 text-center text-base font-semibold bg-apple-dark text-white rounded-xl transition-colors hover:bg-black" 
                onClick={onClose}
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;
