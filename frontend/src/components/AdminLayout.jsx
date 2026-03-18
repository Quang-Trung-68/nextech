import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 overflow-auto bg-muted/20">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
