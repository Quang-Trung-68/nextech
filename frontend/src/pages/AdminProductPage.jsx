import usePageTitle from '../hooks/usePageTitle';

const AdminProductPage = () => {
  usePageTitle('Quản lý Sản phẩm | Quản trị');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manage Products</h1>
      <p className="text-muted-foreground">Product table and management placeholder</p>
    </div>
  );
};
export default AdminProductPage;
