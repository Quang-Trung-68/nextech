import { useParams } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';

const OrderDetailPage = () => {
  usePageTitle('Chi tiết đơn hàng');
  const { id } = useParams();
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Order details for ID: {id}</h1>
      <p className="text-muted-foreground">Order detail view placeholder</p>
    </div>
  );
};
export default OrderDetailPage;
