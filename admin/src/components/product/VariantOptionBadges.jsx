import { Badge } from '@/components/ui/badge';

/**
 * @param {{ attributeName: string, value: string }[] | undefined} options
 */
export function VariantOptionBadges({ options, className = '' }) {
  if (!options?.length) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="text-[11px] text-muted-foreground shrink-0 font-medium">Loại:</span>
      {options.map((o, i) => (
        <Badge
          key={`${o.attributeName}-${o.value}-${i}`}
          variant="secondary"
          className="text-[10px] sm:text-xs font-normal px-2 py-0 h-auto rounded-full"
        >
          {o.attributeName}: {o.value}
        </Badge>
      ))}
    </div>
  );
}
