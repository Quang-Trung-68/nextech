import { useMutation } from '@tanstack/react-query';
import axiosInstance from '../../../lib/axios';

export const useCreateOrder = () => {
  return useMutation({
    mutationFn: async (orderData) => {
      const { data } = await axiosInstance.post('/orders', orderData);
      return data; // Backend trả về { success, data: { order, clientSecret(nếu stripe) } }
    },
  });
};
