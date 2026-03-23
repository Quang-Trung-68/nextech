import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData) => {
      const { data } = await axiosInstance.post('/orders', orderData);
      return data; // Backend trả về { success, data: { order, clientSecret(nếu stripe) } }
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toast.error('Sản phẩm đã hết suất giảm giá. Vui lòng kiểm tra lại giỏ hàng.');
      }
    }
  });
};
