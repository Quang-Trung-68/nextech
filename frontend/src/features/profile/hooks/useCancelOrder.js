import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../../lib/axios';

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosInstance.patch(`/orders/${id}/cancel`, {
        reason: 'Khách hàng tự huỷ đơn giao dịch.',
      });
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries(['profileOrders']);
      queryClient.invalidateQueries(['order', id]);
    },
  });
};
