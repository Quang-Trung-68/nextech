import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0 h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-50">
        <h2 className="text-lg font-bold">Quản trị viên</h2>
        <Sheet>
          <SheetTrigger className="p-2 border rounded-md hover:bg-muted transition-colors">
            <Menu className="w-5 h-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[240px]">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu Admin</SheetTitle>
            </SheetHeader>
            <Sidebar isMobile />
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 p-4 md:p-6 lg:p-10 overflow-auto bg-muted/20 w-full min-w-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
