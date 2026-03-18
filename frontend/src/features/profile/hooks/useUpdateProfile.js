import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import useAuthStore from '@/stores/useAuthStore';

export const useUpdateProfile = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const { data: res } = await axiosInstance.patch('/users/me', data);
      return res;
    },
    onSuccess: (res) => {
      setUser(res.user);
      queryClient.invalidateQueries(['profile']);
    },
  });
};
