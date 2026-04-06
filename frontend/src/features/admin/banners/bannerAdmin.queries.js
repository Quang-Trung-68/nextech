import { queryOptions } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

export const adminBannersQueryOptions = () =>
  queryOptions({
    queryKey: ['admin', 'banners'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/admin/banners');
      return data.data?.banners ?? [];
    },
    staleTime: 30_000,
  });
