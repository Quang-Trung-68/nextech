import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import { useToggleFavorite } from '@/features/favorites/hooks/useFavorites';

const SIZE_MAP = {
  sm: 18,
  md: 22,
};

/**
 * FavoriteButton
 * @param {{ product: { id: string|number, isFavorited?: boolean }, size?: 'sm' | 'md' }} props
 */
export default function FavoriteButton({ product, size = 'md' }) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { mutate, isPending } = useToggleFavorite();

  const iconSize = SIZE_MAP[size] ?? SIZE_MAP.md;
  const isFavorited = product?.isFavorited === true;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    mutate(product.id);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={isFavorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
      className={`flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-white/60 transition-all duration-200
        hover:scale-110 active:scale-95
        ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{ width: iconSize + 12, height: iconSize + 12 }}
    >
      <Heart
        size={iconSize}
        className={`transition-colors duration-200 ${
          isFavorited
            ? 'fill-red-500 text-red-500'
            : 'text-gray-400 hover:text-red-400'
        }`}
      />
    </button>
  );
}
