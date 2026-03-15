import usePageTitle from '../hooks/usePageTitle';

const CheckoutPage = () => {
  usePageTitle('Thanh toán');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <p className="text-muted-foreground">Checkout flow and payment integration placeholder</p>
    </div>
  );
};
export default CheckoutPage;
