import { queryOptions } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

export const adminBrandsQueryOptions = () =>
  queryOptions({
    queryKey: ['admin', 'brands'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/admin/brands');
      return data.data?.brands ?? [];
    },
  });
