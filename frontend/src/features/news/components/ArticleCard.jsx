import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatNewsDate(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export function ArticleCard({ post, className }) {
  const tags = post.tags?.map((t) => t.tag).filter(Boolean) ?? [];

  return (
    <Link
      to={`/news/${post.slug}`}
      className={cn(
        'group flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-border bg-card hover:border-apple-blue/40 hover:shadow-md transition-all',
        'min-h-[200px] sm:min-h-[220px] h-full',
        className
      )}
    >
      <div className="shrink-0 w-full sm:w-44 aspect-[16/10] sm:h-[137px] sm:aspect-auto rounded-md overflow-hidden bg-muted">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            Không ảnh
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-2 min-h-0">
        <div className="flex flex-wrap items-center gap-2 gap-y-1">
          {post.category && (
            <Badge variant="secondary" className="text-xs font-normal">
              {post.category.name}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{formatNewsDate(post.publishedAt)}</span>
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Eye size={12} />
            {post.viewCount ?? 0}
          </span>
        </div>
        <h2 className="text-lg font-bold text-foreground group-hover:text-apple-blue transition-colors line-clamp-2 min-h-[3.5rem]">
          {post.title}
        </h2>
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.75rem] leading-relaxed">
          {post.excerpt ? post.excerpt : '\u00A0'}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-auto pt-1 min-h-[1.5rem]">
          {tags.slice(0, 6).map((tag) => (
            <span
              key={tag.id}
              className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
