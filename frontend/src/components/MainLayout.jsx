import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-apple-blue/20">
      <Header />
      {/* Removed container constraints so HomePage can be full bleed. Individual pages inside can use containers. */}
      <main className="flex-1 w-full flex flex-col pt-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
