import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PolicyBar from '@/components/layout/PolicyBar';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-apple-blue/20">
      <Header />
      {/* Removed container constraints so HomePage can be full bleed. Individual pages inside can use containers. */}
      <main className="flex-1 w-full flex flex-col pt-12">
        <Outlet />
      </main>
      <PolicyBar />
      <Footer />
    </div>
  );
};

export default MainLayout;
