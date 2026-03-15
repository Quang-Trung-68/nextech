import usePageTitle from '../hooks/usePageTitle';

const OrderListPage = () => {
  usePageTitle('Đơn hàng của tôi');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      <p className="text-muted-foreground">List of past orders placeholder</p>
    </div>
  );
};
export default OrderListPage;
