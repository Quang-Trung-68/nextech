
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useMyFavorites, FavoriteButton } from '@/features/favorites';

const FavoriteProductCard = ({ product }) => {
  const { id, name, images, finalPrice, price, discountPercent, brand } = product;

  const firstImage =
    images?.[0]?.url ||
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=400';

  const displayPrice = finalPrice ?? price;

  return (
    <div className="group relative bg-white border border-transparent hover:border-[#d2d2d7] hover:shadow-sm rounded-2xl transition-all duration-300 p-4 flex flex-col">
      {/* Image */}
      <Link
        to={`/products/all/${id}`}
        className="relative bg-apple-gray rounded-xl overflow-hidden block w-full aspect-square mb-4"
      >
        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {product.isNewArrival && (
            <span className="bg-green-500 text-white text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md shadow-sm">
              Mới
            </span>
          )}
          {discountPercent > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-sm">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* FavoriteButton overlay — top-right */}
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton product={{ ...product, isFavorited: true }} size="sm" />
        </div>

        <img
          src={firstImage}
          alt={name}
          className="object-cover w-full h-full mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1">
        <Link to={`/products/all/${id}`} className="block">
          <h3 className="font-semibold text-[15px] text-apple-dark tracking-tight mb-1 group-hover:text-apple-blue transition-colors line-clamp-2">
            {name}
          </h3>
          {brand && (
            <p className="text-[13px] text-apple-secondary mb-3 line-clamp-1">{brand}</p>
          )}
        </Link>

        <div className="mt-auto flex items-end gap-2">
          {discountPercent > 0 ? (
            <>
              <span className="text-sm line-through text-gray-400">
                {price?.toLocaleString('vi-VN')}đ
              </span>
              <span className="font-semibold text-red-500 text-base">
                {displayPrice?.toLocaleString('vi-VN')}đ
              </span>
            </>
          ) : (
            <span className="font-semibold text-base text-apple-dark">
              {displayPrice?.toLocaleString('vi-VN')}đ
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="rounded-2xl bg-[#f5f5f7] animate-pulse p-4 flex flex-col gap-3">
    <div className="aspect-square w-full rounded-xl bg-[#e8e8ed]" />
    <div className="h-4 w-3/4 rounded-md bg-[#e8e8ed]" />
    <div className="h-4 w-1/2 rounded-md bg-[#e8e8ed]" />
    <div className="h-5 w-1/3 rounded-md bg-[#e8e8ed]" />
  </div>
);

const FavoritesPage = () => {
  usePageTitle('Sản phẩm yêu thích');

  const { data: favorites = [], isLoading } = useMyFavorites();

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-8 font-sans bg-white min-h-[60vh]">
      {/* Header */}
      <div className="mb-8 mt-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-apple-dark mb-2">
          Sản phẩm yêu thích
        </h1>
        {!isLoading && favorites.length > 0 && (
          <p className="text-apple-secondary text-sm">{favorites.length} sản phẩm</p>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && favorites.length === 0 && (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-20 h-20 rounded-full bg-[#f5f5f7] flex items-center justify-center mb-6">
            <Heart size={40} className="text-[#d2d2d7]" strokeWidth={1.5} />
          </div>
          <p className="text-xl font-semibold text-apple-dark mb-2">
            Bạn chưa có sản phẩm yêu thích
          </p>
          <p className="text-apple-secondary text-sm mb-8 max-w-xs">
            Nhấn vào biểu tượng trái tim trên sản phẩm để lưu vào danh sách yêu thích của bạn.
          </p>
          <Link
            to="/products"
            className="px-6 py-3 rounded-full bg-apple-blue text-white font-semibold text-sm hover:bg-apple-blue/90 transition-colors"
          >
            Khám phá ngay
          </Link>
        </div>
      )}

      {/* Product grid */}
      {!isLoading && favorites.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((product) => (
            <FavoriteProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
