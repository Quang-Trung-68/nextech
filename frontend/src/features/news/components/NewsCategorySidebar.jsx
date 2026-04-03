import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @param {{
 *   categories: { id: number | string; name: string; slug: string; _count?: { posts?: number } }[]
 *   categorySlug: string
 *   onSelectCategory: (slug: string) => void
 *   isLoading?: boolean
 * }} props
 */
export function NewsCategorySidebar({
  categories = [],
  categorySlug = '',
  onSelectCategory,
  isLoading = false,
}) {
  return (
    <aside className="lg:w-[25%] shrink-0">
      <div className="rounded-lg border border-border bg-card p-4 lg:sticky lg:top-24">
        <p className="text-sm font-semibold text-muted-foreground mb-3">Danh mục</p>
        {isLoading ? (
          <Loader2 className="animate-spin text-muted-foreground" size={20} />
        ) : (
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('')}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex justify-between items-center',
                  !categorySlug
                    ? 'bg-apple-blue/10 text-apple-blue font-medium'
                    : 'hover:bg-muted text-foreground',
                )}
              >
                <span>Tất cả</span>
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelectCategory(c.slug)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex justify-between items-center gap-2',
                    categorySlug === c.slug
                      ? 'bg-apple-blue/10 text-apple-blue font-medium'
                      : 'hover:bg-muted text-foreground',
                  )}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {c._count?.posts ?? 0}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
