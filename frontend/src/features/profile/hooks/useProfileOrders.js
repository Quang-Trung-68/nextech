import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../lib/axios';

/**
 * Fetch paginated orders for the logged-in user.
 * @param {{ page: number, status: string }} params
 */
export const useProfileOrders = ({ page = 1, status = '', search = '' } = {}) => {
  return useQuery({
    queryKey: ['profileOrders', page, status, search],
    queryFn: async () => {
      const params = { page, limit: 10 };
      if (status) params.status = status;
      if (search) params.search = search;
      const { data } = await axiosInstance.get('/orders', { params });
      return data;
    },
    keepPreviousData: true,
  });
};
