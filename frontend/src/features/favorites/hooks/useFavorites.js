import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesQueryOptions, toggleFavoriteApi } from '@/features/favorites/api';
import useAuthStore from '@/stores/useAuthStore';

export function useMyFavorites() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery(favoritesQueryOptions(isAuthenticated));
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const mutation = useMutation({
    mutationFn: toggleFavoriteApi,
    onSuccess: () => {
      queryClient.invalidateQueries(favoritesQueryOptions(isAuthenticated));
    },
    onError: (error) => {
      console.error('Toggle favorite failed:', error);
    },
  });

  return { mutate: mutation.mutate, isPending: mutation.isPending };
}
