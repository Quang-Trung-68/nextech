import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import useAuthStore from '@/stores/useAuthStore';

export function useCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const query = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/cart');
      return data.data || { items: [], totalItems: 0, totalAmount: 0, cartTotal: 0 };
    },
    enabled: isAuthenticated,
  });

  const cart = query.data;
  const cartItems = cart?.items || [];
  
  const totalItems = cart?.totalItems || 0;
  // Prefer cartTotal (API computed from finalPrice), fall back to totalAmount
  const totalPrice = cart?.cartTotal ?? cart?.totalAmount ?? 0;

  return {
    ...query,
    cart,
    cartItems,
    totalItems,
    totalPrice,
  };
}
