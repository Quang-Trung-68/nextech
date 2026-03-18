import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, quantity }) => {
      const { data } = await axiosInstance.post('/cart/items', { productId, quantity });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, quantity }) => {
      const { data } = await axiosInstance.put(`/cart/items/${productId}`, { quantity });
      return data;
    },
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);
      
      queryClient.setQueryData(['cart'], (old) => {
        if (!old || !old.items) return old;
        return {
          ...old,
          items: old.items.map(item => 
            item.productId === productId ? { ...item, quantity, subtotal: item.price * quantity } : item
          )
        };
      });
      return { previousCart };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['cart'], context?.previousCart);
      toast.error(err?.response?.data?.message || 'Không thể cập nhật số lượng');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId) => {
      const { data } = await axiosInstance.delete(`/cart/items/${productId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Không thể xóa sản phẩm');
    }
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await axiosInstance.delete('/cart');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Đã xóa toàn bộ giỏ hàng');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Không thể xóa giỏ hàng');
    }
  });
}
