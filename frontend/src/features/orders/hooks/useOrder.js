import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../../lib/axios';

export const useOrder = (id) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/orders/${id}`);
      return data.order; // Server trả về { success: true, order: {...} }
    },
    enabled: !!id,
    retry: 1, // Để nó fail ngay thay vì cố tải mãi
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosInstance.delete(`/orders/${id}/cancel`);
      return data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries(['orders']); // Nếu có trang List.
    },
  });
};
