import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import useAuthStore from '@/stores/useAuthStore';

export const useUploadAvatar = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await axiosInstance.post('/users/me/avatar', formData);
      return data;
    },
    onSuccess: (data) => {
      if (user) {
        setUser({ ...user, avatar: data.avatarUrl });
      }
    },
  });
};
