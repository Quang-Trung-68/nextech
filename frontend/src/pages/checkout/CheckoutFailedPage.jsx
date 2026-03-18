import { Link } from 'react-router-dom';
import usePageTitle from '@/hooks/usePageTitle';

const CheckoutFailedPage = () => {
  usePageTitle('Đặt hàng thất bại');
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Payment Failed</h1>
      <p className="text-lg text-muted-foreground mb-8">Something went wrong with your transaction. Please try again.</p>
      <Link to="/cart" className="bg-secondary text-secondary-foreground px-6 py-2 rounded">Back to Cart</Link>
    </div>
  );
};
export default CheckoutFailedPage;
