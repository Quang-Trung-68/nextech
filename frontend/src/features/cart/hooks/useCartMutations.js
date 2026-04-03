import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, quantity, variantId }) => {
      const { data } = await axiosInstance.post('/cart/items', {
        productId,
        quantity,
        ...(variantId ? { variantId } : {}),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

function sameCartLine(item, productId, variantId) {
  const v1 = item.variantId ?? null;
  const v2 = variantId ?? null;
  return item.productId === productId && v1 === v2;
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, quantity, variantId }) => {
      const { data } = await axiosInstance.put(`/cart/items/${productId}`, {
        quantity,
        ...(variantId ? { variantId } : {}),
      });
      return data;
    },
    onMutate: async ({ productId, quantity, variantId }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);
      
      queryClient.setQueryData(['cart'], (old) => {
        if (!old || !old.items) return old;
        return {
          ...old,
          items: old.items.map(item =>
            sameCartLine(item, productId, variantId)
              ? {
                  ...item,
                  quantity,
                  lineTotal: item.finalPrice * quantity,
                  subtotal: item.finalPrice * quantity,
                }
              : item
          ),
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
    mutationFn: async (arg) => {
      const productId = typeof arg === 'object' && arg !== null ? arg.productId : arg;
      const variantId =
        typeof arg === 'object' && arg !== null ? arg.variantId : undefined;
      const { data } = await axiosInstance.delete(`/cart/items/${productId}`, {
        params: variantId ? { variantId } : {},
      });
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
