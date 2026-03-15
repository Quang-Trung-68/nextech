import usePageTitle from '../hooks/usePageTitle';

const AdminOrderPage = () => {
  usePageTitle('Quản lý Đơn hàng | Quản trị');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manage Orders</h1>
      <p className="text-muted-foreground">Order table and management placeholder</p>
    </div>
  );
};
export default AdminOrderPage;
