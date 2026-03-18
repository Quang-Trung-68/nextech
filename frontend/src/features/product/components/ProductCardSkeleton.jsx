import { Card, CardContent } from '@/components/ui/card';

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden flex flex-col h-full animate-pulse">
      {/* Khung ảnh vuông xám */}
      <div className="relative aspect-square bg-slate-200 dark:bg-slate-800 w-full" />
      
      {/* Khung nội dung (sao, tiêu đề, giá) */}
      <CardContent className="p-4 flex flex-col flex-1 gap-2">
        <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded mb-1" />
        <div className="space-y-2 flex-1 mt-1">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
        </div>
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mt-2" />
      </CardContent>
    </Card>
  );
}
