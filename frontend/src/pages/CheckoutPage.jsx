import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import useAuthStore from '../stores/useAuthStore';
import { useCart } from '../features/cart/hooks/useCart';
import { useCreateOrder } from '../features/checkout/hooks/useCreateOrder';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '../lib/stripe';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema } from '../features/checkout/schemas/checkoutSchema';
import { ShippingForm } from '../features/checkout/components/ShippingForm';
import { PaymentMethodSelector } from '../features/checkout/components/PaymentMethodSelector';
import { StripeCardInput } from '../features/checkout/components/StripeCardInput';
import { CheckoutSummary } from '../features/checkout/components/CheckoutSummary';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { AlertCircle, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';

const CheckoutPageForm = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { cartItems, totalItems, totalPrice } = useCart();
  const { mutateAsync: createOrder } = useCreateOrder();

  // Redirect block if cart empty
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cartItems, navigate]);

  // Stripe hooks
  const stripe = useStripe();
  const elements = useElements();

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [stripeError, setStripeError] = useState(null);

  const [pendingOrder, setPendingOrder] = useState(null);

  // Form config
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: {
        fullName: user?.name || '',
        phone: user?.phone || '',
        addressLine: '',
        ward: '',
        city: '',
      },
      paymentMethod: 'COD',
    },
  });

  const selectedMethod = watch('paymentMethod');

  // Reset pending order if payment method changes
  useEffect(() => {
    setPendingOrder(null);
  }, [selectedMethod]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError(null);
    setStripeError(null);

    try {
      const orderData = {
        paymentMethod: data.paymentMethod,
        shippingAddress: {
          fullName: data.shippingAddress.fullName,
          phone: data.shippingAddress.phone,
          addressLine: data.shippingAddress.addressLine,
          ward: data.shippingAddress.ward,
          city: data.shippingAddress.city
        }
      };

      if (data.paymentMethod === 'STRIPE') {
        if (!stripe || !elements) {
          throw new Error('Hệ thống thanh toán đang tải, vui lòng thử lại.');
        }
        const cardElement = elements.getElement(CardElement);

        let clientSecret = pendingOrder?.clientSecret;
        let orderId = pendingOrder?.orderId;

        if (!clientSecret || !orderId) {
          // 1. Tạo đơn chờ xử lý
          const response = await createOrder(orderData);
          if (!response.success || !response.clientSecret) {
            throw new Error(response.message || 'Lỗi thiết lập thanh toán.');
          }
          clientSecret = response.clientSecret;
          orderId = response.order.id;
          setPendingOrder({ clientSecret, orderId });
        }

        // 2. Stripe Confirm
        const { error: stripeConfirmErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: data.shippingAddress.fullName,
              phone: data.shippingAddress.phone,
            },
          },
        });

        if (stripeConfirmErr) {
          setStripeError(stripeConfirmErr.message);
          setIsLoading(false);
          return;
        }

        if (paymentIntent && paymentIntent.status === 'succeeded') {
           navigate(`/profile/orders/${orderId}?success=true`, { replace: true });
        }
      } else {
        // COD
        const response = await createOrder(orderData);
        if (!response.success) {
           throw new Error(response.message || 'Đặt hàng thất bại.');
        }
        navigate(`/profile/orders/${response.order.id}?success=true`, { replace: true });
      }
    } catch (error) {
       console.error(error);
       setServerError(error.response?.data?.message || error.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
       setIsLoading(false);
    }
  };

  if (!cartItems || cartItems.length === 0) return null;

  return (
    <div className="container max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="flex items-center space-x-2 text-apple-secondary mb-8 text-sm font-medium">
        <span className="text-apple-dark">1. Giỏ hàng</span>
        <span className="text-[#d2d2d7]">—</span>
        <span className="text-apple-blue font-bold">2. Thanh toán</span>
        <span className="text-[#d2d2d7]">—</span>
        <span>3. Hoàn tất</span>
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold text-apple-dark tracking-tight mb-8">
        Thanh toán an toàn <Lock className="inline w-6 h-6 text-apple-secondary mb-1 opacity-50" />
      </h1>

      {serverError && (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-[7fr_5fr] gap-8 lg:gap-12 items-start">
        <div className="flex flex-col gap-6">
          <ShippingForm register={register} errors={errors} />
          <PaymentMethodSelector register={register} selectedMethod={selectedMethod} />

          {selectedMethod === 'STRIPE' && (
             <StripeCardInput error={stripeError} />
          )}

          <Button 
              type="submit" 
              size="lg" 
              className="w-full h-14 rounded-xl font-bold active:scale-[0.98] transition-all text-base shadow-sm bg-apple-blue hover:bg-apple-blue/90"
              disabled={isLoading}
          >
              {isLoading ? 'Đang xử lý...' : 'Đặt hàng'}
          </Button>
        </div>

        <div className="hidden lg:flex flex-col">
          <CheckoutSummary cartItems={cartItems} totalItems={totalItems} totalPrice={totalPrice} />
        </div>
      </form>
    </div>
  );
};

const CheckoutPage = () => {
  usePageTitle('Thanh toán an toàn');
  return (
    <Elements stripe={stripePromise}>
      <CheckoutPageForm />
    </Elements>
  );
};

export default CheckoutPage;
