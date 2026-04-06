import { queryOptions } from '@tanstack/react-query';
import { axiosPublic } from '@/lib/axios';

/** GET /banners/active */
export const activeBannersQueryOptions = () =>
  queryOptions({
    queryKey: ['banners', 'active'],
    queryFn: async () => {
      const { data } = await axiosPublic.get('/banners/active');
      return data.data?.banners ?? [];
    },
    staleTime: 60_000,
  });

/** GET /products/brands?carousel=1 — carousel trang chủ (thứ tự + link/logo từ seed) */
export const brandsCarouselQueryOptions = () =>
  queryOptions({
    queryKey: ['products', 'brands', 'carousel'],
    queryFn: async () => {
      const { data } = await axiosPublic.get('/products/brands', { params: { carousel: 1 } });
      return data.brands ?? [];
    },
    staleTime: 5 * 60_000,
  });

/** GET /products/brands/top */
export const topBrandsQueryOptions = (limit = 4) =>
  queryOptions({
    queryKey: ['products', 'brands', 'top', limit],
    queryFn: async () => {
      const { data } = await axiosPublic.get('/products/brands/top', { params: { limit } });
      return data.brands ?? [];
    },
    staleTime: 60_000,
  });

/** Homepage product grid per category tab */
export const homeCategoryProductsQueryOptions = (categoryKey, limit = 12) =>
  queryOptions({
    queryKey: ['home', 'categoryProducts', categoryKey, limit],
    queryFn: async () => {
      const { data } = await axiosPublic.get('/products', {
        params: {
          category: categoryKey,
          limit,
          sort: 'newest',
          page: 1,
        },
      });
      return data.products ?? [];
    },
    staleTime: 60_000,
  });

/** Newest products for one brand row */
export const homeBrandProductsQueryOptions = (brandSlug, limit = 6) =>
  queryOptions({
    queryKey: ['home', 'newestByBrand', brandSlug, limit],
    queryFn: async () => {
      const { data } = await axiosPublic.get('/products', {
        params: {
          brandSlug,
          limit,
          sort: 'newest',
          page: 1,
        },
      });
      return data.products ?? [];
    },
    enabled: Boolean(brandSlug),
    staleTime: 60_000,
  });

/** Published posts for home carousel */
export const homePostsQueryOptions = () =>
  queryOptions({
    queryKey: ['news', 'list', { home: true, limit: 8 }],
    queryFn: async () => {
      const { data } = await axiosPublic.get('/posts', { params: { page: 1, limit: 8 } });
      const payload = data.data;
      return payload?.data ?? [];
    },
    staleTime: 60_000,
  });
