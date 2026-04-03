import { queryOptions } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { axiosPublic } from '@/lib/axios';

/** GET /api/posts — public list */
export const newsListQueryOptions = (params) =>
  queryOptions({
    queryKey: ['news', 'list', params],
    queryFn: async () => {
      const { data } = await axiosPublic.get('/posts', { params });
      return data.data;
    },
    staleTime: 1000 * 60,
  });

/** GET /api/posts/:slug */
export const newsDetailQueryOptions = (slug) =>
  queryOptions({
    queryKey: ['news', 'detail', slug],
    queryFn: async () => {
      const { data } = await axiosPublic.get(`/posts/${encodeURIComponent(slug)}`);
      return data.data.post;
    },
    enabled: !!slug,
    staleTime: 1000 * 60,
  });

/** GET /api/categories */
export const newsCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: ['news', 'categories'],
    queryFn: async () => {
      const { data } = await axiosPublic.get('/categories');
      return data.data.categories ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

/** GET /api/tags */
export const newsTagsQueryOptions = () =>
  queryOptions({
    queryKey: ['news', 'tags'],
    queryFn: async () => {
      const { data } = await axiosPublic.get('/tags');
      return data.data.tags ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

/** GET /api/posts/related/:slug */
export const relatedPostsQueryOptions = (slug) =>
  queryOptions({
    queryKey: ['news', 'related', slug],
    queryFn: async () => {
      const { data } = await axiosPublic.get(`/posts/related/${encodeURIComponent(slug)}`);
      return data.data.posts ?? [];
    },
    enabled: !!slug,
    staleTime: 1000 * 60,
  });

/** Admin: GET /api/admin/posts */
export const adminNewsListQueryOptions = (params) =>
  queryOptions({
    queryKey: ['admin', 'news', params],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/admin/posts', { params });
      return data.data;
    },
    staleTime: 1000 * 30,
  });

/** Admin: GET /api/admin/posts/:id */
export const adminNewsDetailQueryOptions = (id) =>
  queryOptions({
    queryKey: ['admin', 'news', 'detail', id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/admin/posts/${id}`);
      return data.data.post;
    },
    enabled: !!id,
  });

/** Admin: GET /api/admin/tags/search?q= — optional client prefetch / future server-side tag search */
export const tagSearchQueryOptions = (q) =>
  queryOptions({
    queryKey: ['admin', 'tags', 'search', q],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/admin/tags/search', {
        params: { q, limit: 20 },
      });
      return data.data?.tags ?? [];
    },
    enabled: typeof q === 'string' && q.trim().length >= 1,
    staleTime: 30_000,
  });
