import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageBackButton from '@/components/common/PageBackButton';
import usePageTitle from '@/hooks/usePageTitle';
import useAuthStore from '@/stores/useAuthStore';
import { useCart } from '@/features/cart/hooks/useCart';
import { useCreateOrder } from '@/features/checkout/hooks/useCreateOrder';
import { useQueryClient } from '@tanstack/react-query';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema } from '@/features/checkout/schemas/checkoutSchema';
import { ShippingForm } from '@/features/checkout/components/ShippingForm';
import { AddressPicker } from '@/features/checkout/components/AddressPicker';
import { PaymentMethodSelector } from '@/features/checkout/components/PaymentMethodSelector';
import { StripeCardInput } from '@/features/checkout/components/StripeCardInput';
import { CheckoutSummary } from '@/features/checkout/components/CheckoutSummary';
import { CouponInput } from '@/features/checkout/components/CouponInput';
import { VatInvoiceForm } from '@/features/checkout/components/VatInvoiceForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/utils/price';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const CheckoutPageForm = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { cartItems, totalItems, totalPrice } = useCart();
  const { mutateAsync: createOrder } = useCreateOrder();
  const queryClient = useQueryClient();
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect block if cart empty
  useEffect(() => {
    if (!isSuccess && (!cartItems || cartItems.length === 0)) {
      navigate('/cart', { replace: true });
    }
  }, [cartItems, navigate, isSuccess]);

  // Stripe hooks
  const stripe = useStripe();
  const elements = useElements();

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [stripeError, setStripeError] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);

  // ─── Coupon state (local only, không persist sang Zustand/localStorage) ───
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountAmount, couponId }

  // Form config
  const { register, handleSubmit, watch, setValue, getValues, control, formState: { errors } } = useForm({
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
      vatInvoiceRequested: false,
      vatBuyerType: undefined,
      vatBuyerName: undefined,
      vatBuyerAddress: undefined,
      vatBuyerEmail: undefined,
      vatBuyerCompany: undefined,
      vatBuyerTaxCode: undefined,
      vatBuyerCompanyAddress: undefined,
    },
  });

  // Fill shipping form when an address is selected from picker
  const handleAddressSelect = useCallback((addr) => {
    setValue('shippingAddress.fullName', addr.fullName);
    setValue('shippingAddress.phone', addr.phone);
    setValue('shippingAddress.addressLine', addr.addressLine);
    setValue('shippingAddress.ward', addr.ward);
    setValue('shippingAddress.city', addr.city);
  }, [setValue]);

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
        },
        // Gửi couponCode nếu user đã apply — server sẽ re-validate
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        vatInvoiceRequested: data.vatInvoiceRequested,
        vatBuyerType: data.vatBuyerType,
        vatBuyerName: data.vatBuyerName,
        vatBuyerAddress: data.vatBuyerAddress,
        vatBuyerEmail: data.vatBuyerEmail,
        vatBuyerCompany: data.vatBuyerCompany,
        vatBuyerTaxCode: data.vatBuyerTaxCode,
        vatBuyerCompanyAddress: data.vatBuyerCompanyAddress,
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
           setIsSuccess(true);
           queryClient.setQueryData(['cart'], { items: [], totalItems: 0, totalAmount: 0, cartTotal: 0 });
           // Invalidate in background to let the webhook sync, delay could be safely done if needed, but not strictly required
           queryClient.invalidateQueries({ queryKey: ['cart'] });
           navigate(`/profile/orders/${orderId}?success=true`, { replace: true });
        }
      } else if (data.paymentMethod === 'SEPAY') {
        const response = await createOrder(orderData);
        if (!response.success || !response.checkoutUrl || !response.sepayFields) {
           throw new Error(response.message || 'Lỗi thiết lập thanh toán SePay.');
        }
        
        // Tạo form ẩn để POST sang thiết lập thanh toán SePay
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = response.checkoutUrl;
        
        Object.entries(response.sepayFields).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
      } else {
        // COD
        const response = await createOrder(orderData);
        if (!response.success) {
           throw new Error(response.message || 'Đặt hàng thất bại.');
        }
        setIsSuccess(true);
        queryClient.setQueryData(['cart'], { items: [], totalItems: 0, totalAmount: 0, cartTotal: 0 });
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        navigate(`/profile/orders/${response.order.id}?success=true`, { replace: true });
      }
    } catch (error) {
       console.error(error);
       setServerError(error.response?.data?.message || error.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
       setIsLoading(false);
    }
  };

  if (!isSuccess && (!cartItems || cartItems.length === 0)) return null;

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 min-h-svh flex flex-col">
      <PageBackButton className="mb-4 lg:hidden" />
      <div className="flex items-center space-x-2 text-apple-secondary mb-6 text-xs md:text-sm font-medium">
        <span className="text-apple-dark shrink-0">1. Giỏ hàng</span>
        <span className="text-[#d2d2d7] shrink-0">—</span>
        <span className="text-apple-blue font-bold shrink-0">2. Thanh toán</span>
        <span className="text-[#d2d2d7] shrink-0">—</span>
        <span className="shrink-0">3. Hoàn tất</span>
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

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-start">
        <div className="flex flex-col gap-6 lg:col-span-2">
          
          {/* Mobile Order Summary Accordion */}
          <div className="lg:hidden w-full">
            <Accordion type="single" collapsible className="w-full bg-apple-gray border border-[#d2d2d7] rounded-xl px-4 py-1">
              <AccordionItem value="summary" className="border-none">
                <AccordionTrigger className="hover:no-underline py-3 px-1">
                  <div className="flex justify-between w-full pr-4 text-apple-dark font-semibold text-sm">
                    <span>Hiển thị đơn hàng ({totalItems})</span>
                    <span className="text-apple-blue">{formatVND(totalPrice)}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-2 border-t border-[#d2d2d7] mt-2 px-1">
                  <div className="mt-4">
                    <CheckoutSummary
                      cartItems={cartItems}
                      totalItems={totalItems}
                      totalPrice={totalPrice}
                      appliedCoupon={appliedCoupon}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Address Picker — select saved or add new */}
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-border">
            <h2 className="text-xl font-bold tracking-tight text-foreground mb-4">Địa chỉ giao hàng</h2>
            <AddressPicker onSelect={handleAddressSelect} currentUser={user} />
          </div>

          <ShippingForm register={register} errors={errors} control={control} />
          <PaymentMethodSelector register={register} selectedMethod={selectedMethod} />

          <VatInvoiceForm register={register} watch={watch} errors={errors} setValue={setValue} getValues={getValues} />

          {/* ─── Coupon Section ─────────────────────────────────────────── */}
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-border">
            <h2 className="text-base font-bold tracking-tight text-foreground mb-3">Mã giảm giá</h2>
            <CouponInput
              orderAmount={totalPrice}
              appliedCoupon={appliedCoupon}
              onApply={(coupon) => {
                setAppliedCoupon(coupon);
                // Reset pending Stripe order nếu đơn đã được tạo trước khi apply coupon
                setPendingOrder(null);
              }}
              onRemove={() => {
                setAppliedCoupon(null);
                setPendingOrder(null);
              }}
            />
          </div>

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

        <div className="hidden lg:flex flex-col sticky top-24 lg:col-span-1">
          <CheckoutSummary
            cartItems={cartItems}
            totalItems={totalItems}
            totalPrice={totalPrice}
            appliedCoupon={appliedCoupon}
          />
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
