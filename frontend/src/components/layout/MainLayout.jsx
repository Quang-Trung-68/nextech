import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PolicyBar from '@/components/layout/PolicyBar';
import { BottomNav } from '@/components/layout/BottomNav';

const MainLayout = () => {
  const location = useLocation();
  const showBottomNav =
    location.pathname === '/' ||
    ['/phone', '/laptop', '/tablet', '/accessories'].some(
      (p) => location.pathname === p || location.pathname.startsWith(`${p}/`)
    );

  return (
    <div className="min-h-svh flex flex-col font-sans selection:bg-apple-blue/20">
      <Header />
      {/* Removed container constraints so HomePage can be full bleed. Individual pages inside can use containers. */}
      <main className={`flex-1 w-full flex flex-col pt-12 ${showBottomNav ? 'pb-[calc(56px+env(safe-area-inset-bottom))] lg:pb-0' : ''}`}>
        <Outlet />
      </main>
      <PolicyBar />
      <Footer />
      {showBottomNav && <BottomNav />}
    </div>
  );
};

export default MainLayout;
