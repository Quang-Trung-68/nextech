import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { PRODUCT_TYPES } from '@/constants/category';

/**
 * @param {string|null} productType - phone | laptop | tablet | accessories
 */
export function useBrands(productType) {
  const enabled = productType && PRODUCT_TYPES.includes(productType);
  return useQuery({
    queryKey: ['brands', productType],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/products/brands', {
        params: { type: productType },
      });
      return data.brands ?? [];
    },
    enabled,
  });
}
