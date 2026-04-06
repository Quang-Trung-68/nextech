import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

export function useBannerMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
    queryClient.invalidateQueries({ queryKey: ['banners', 'active'] });
  };

  const createBanner = useMutation({
    mutationFn: async (formData) => {
      const { data } = await axiosInstance.post('/admin/banners', formData);
      return data.data?.banner;
    },
    onSuccess: invalidate,
  });

  const updateBanner = useMutation({
    mutationFn: async ({ id, formData }) => {
      const { data } = await axiosInstance.put(`/admin/banners/${id}`, formData);
      return data.data?.banner;
    },
    onSuccess: invalidate,
  });

  const deleteBanner = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/admin/banners/${id}`);
    },
    onSuccess: invalidate,
  });

  const toggleActive = useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosInstance.patch(`/admin/banners/${id}/toggle`);
      return data.data?.banner;
    },
    onSuccess: invalidate,
  });

  return { createBanner, updateBanner, deleteBanner, toggleActive };
}
