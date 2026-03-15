import usePageTitle from '../hooks/usePageTitle';

const AdminUserPage = () => {
  usePageTitle('Quản lý Người dùng | Quản trị');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manage Users</h1>
      <p className="text-muted-foreground">User table and management placeholder</p>
    </div>
  );
};
export default AdminUserPage;
