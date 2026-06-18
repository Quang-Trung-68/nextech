import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="min-h-svh flex flex-col font-sans bg-slate-50 dark:bg-slate-950 justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
