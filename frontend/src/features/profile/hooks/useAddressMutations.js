import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const { data: res } = await axiosInstance.post('/users/me/addresses', data);
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries(['addresses']),
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const { data: res } = await axiosInstance.patch(`/users/me/addresses/${id}`, data);
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries(['addresses']),
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosInstance.delete(`/users/me/addresses/${id}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(['addresses']),
  });
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosInstance.patch(`/users/me/addresses/${id}/default`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(['addresses']),
  });
};
