import { Link } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';

const CheckoutSuccessPage = () => {
  usePageTitle('Đặt hàng thành công');
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-green-600 mb-4">Payment Successful!</h1>
      <p className="text-lg text-muted-foreground mb-8">Thank you for your purchase.</p>
      <Link to="/profile/orders" className="bg-primary text-primary-foreground px-6 py-2 rounded">View Orders</Link>
    </div>
  );
};
export default CheckoutSuccessPage;
