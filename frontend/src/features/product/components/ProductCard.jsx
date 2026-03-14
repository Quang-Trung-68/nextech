import { Link } from 'react-router-dom';
import { Star, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { formatCurrency } from '../../../utils/formatCurrency';

export function ProductCard({ product }) {
  const { id, name, price, rating, stock, images } = product;

  // Ảnh đầu tiên (nếu có)
  const firstImage = images?.[0]?.url;

  return (
    <Card className="overflow-hidden group flex flex-col h-full hover:shadow-lg transition-all duration-300 relative border-slate-200 dark:border-slate-800">
      <Link to={`/products/${id}`} className="flex-1 flex flex-col">
        {/* Container hiển thị ảnh */}
        <div className="relative aspect-square w-fullbg-slate-50 dark:bg-slate-900 border-b overflow-hidden group-hover:bg-slate-100 flex items-center justify-center">
          {firstImage ? (
            <img
              src={firstImage}
              alt={name}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground w-full h-full">
              <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
              <span className="text-xs">Không có ảnh</span>
            </div>
          )}

          {/* Badges tĩnh (nếp góc trái, phải) */}
          {stock <= 10 && stock > 0 && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-600 text-white border-0 z-10"
            >
              Sắp hết
            </Badge>
          )}

          {stock === 0 && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
              <Badge variant="destructive" className="px-3 py-1 text-sm font-semibold uppercase tracking-wider backdrop-blur-md">
                Hết hàng
              </Badge>
            </div>
          )}
        </div>

        {/* Nội dung card (tiêu đề, giá trị đè text) */}
        <CardContent className="p-4 flex flex-col flex-1 gap-2">
          {/* Rating */}
          <div className="flex items-center gap-1 mt-auto">
             <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
             <span className="text-sm font-medium">{rating > 0 ? rating.toFixed(1) : "Chưa có"}</span>
          </div>

          <h3 className="font-medium text-foreground text-sm line-clamp-2 leading-tight flex-1" title={name}>
            {name}
          </h3>

          <div className="mt-1 flex items-end justify-between w-full">
            <span className="font-bold text-base text-primary tracking-tight">
              {formatCurrency(price)}
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
