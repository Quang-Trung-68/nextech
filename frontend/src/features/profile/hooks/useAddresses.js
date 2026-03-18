import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

export const useAddresses = () => {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/users/me/addresses');
      return data.addresses;
    },
  });
};
