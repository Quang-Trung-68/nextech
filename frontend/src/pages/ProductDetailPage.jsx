import { useParams } from 'react-router-dom';

const ProductDetailPage = () => {
  const { id } = useParams();
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Product details for ID: {id}</h1>
      <p className="text-muted-foreground">Product details view placeholder</p>
    </div>
  );
};
export default ProductDetailPage;
