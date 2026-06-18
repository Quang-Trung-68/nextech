import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

export function useAdminBrandMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] });
    queryClient.invalidateQueries({ queryKey: ['products', 'brands'] });
    queryClient.invalidateQueries({ queryKey: ['product-brands'] });
  };

  const createBrand = useMutation({
    mutationFn: async (formData) => {
      const { data } = await axiosInstance.post('/admin/brands', formData);
      return data.data?.brand;
    },
    onSuccess: invalidate,
  });

  const updateBrand = useMutation({
    mutationFn: async ({ id, formData }) => {
      const { data } = await axiosInstance.put(`/admin/brands/${id}`, formData);
      return data.data?.brand;
    },
    onSuccess: invalidate,
  });

  const deleteBrand = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/admin/brands/${id}`);
    },
    onSuccess: invalidate,
  });

  return { createBrand, updateBrand, deleteBrand };
}
