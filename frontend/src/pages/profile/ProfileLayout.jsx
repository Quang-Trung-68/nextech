import { Outlet } from 'react-router-dom';
import ProfileSidebar from '@/features/profile/components/ProfileSidebar';

const ProfileLayout = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-apple-gray/30">
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex gap-6 md:gap-8 items-start">
          {/* Sidebar */}
          <ProfileSidebar />

          {/* Main content */}
          <main className="flex-1 min-w-0 pb-20 md:pb-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;
