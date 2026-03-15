import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../lib/axios';

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
      // Backend trả { success: true, products: [...], totalCount, page, totalPages }
      const { page, totalPages } = lastPage || {};
      if (page && totalPages && page < totalPages) {
        return page + 1;
      }
      return undefined; // Hết trang
    },
  });
}

// Lấy chi tiết 1 sản phẩm
export function useProduct(id) {
  return useQuery({
    queryKey: ['products', 'detail', id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/products/${id}`);
      return data;
    },
    enabled: !!id, // Chỉ gọi API khi id tồn tại
  });
}
