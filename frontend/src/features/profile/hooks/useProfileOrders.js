import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../lib/axios';

/**
 * Fetch paginated orders for the logged-in user.
 * @param {{ page: number, status: string }} params
 */
export const useProfileOrders = ({ page = 1, status = '' } = {}) => {
  return useQuery({
    queryKey: ['profileOrders', page, status],
    queryFn: async () => {
      const params = { page, limit: 5 };
      if (status) params.status = status;
      const { data } = await axiosInstance.get('/orders', { params });
      return data; // { orders, total, page, totalPages }
    },
    keepPreviousData: true,
  });
};
