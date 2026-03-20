import { queryOptions } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

// Query Options — co-locate queryKey + queryFn + config
export const favoritesQueryOptions = (isAuthenticated) =>
  queryOptions({
    queryKey: ['favorites'],
    queryFn: () =>
      axiosInstance.get('/favorites').then((res) => res.data.data ?? []),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 phút
  });

// Mutation function
export const toggleFavoriteApi = (productId) =>
  axiosInstance.post(`/favorites/${productId}`).then((res) => res.data);
