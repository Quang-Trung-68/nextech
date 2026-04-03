import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

const LIMIT = 20;

// Fetch danh sách sp theo params (filter/sort/search/page)
export function useProducts(params) {
  return useInfiniteQuery({
    queryKey: ['products', params],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axiosInstance.get('/products', {
        params: {
          ...params,
          page: pageParam,
          limit: LIMIT,
        },
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage || {};
      if (page && totalPages && page < totalPages) {
        return page + 1;
      }
      return undefined;
    },
  });
}

// Lấy chi tiết 1 sản phẩm theo id (CUID) — admin / legacy
export function useProduct(id) {
  return useQuery({
    queryKey: ['products', 'detail', id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/products/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// Chi tiết theo slug (storefront)
export function useProductBySlug(slug) {
  return useQuery({
    queryKey: ['products', 'by-slug', slug],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/products/by-slug/${encodeURIComponent(slug)}`);
      return data;
    },
    enabled: !!slug,
  });
}
