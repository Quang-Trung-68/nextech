import { Skeleton } from '../../../components/ui/skeleton';

export function CartSkeleton() {
  return (
    <div className="container py-8 max-w-6xl mx-auto px-4 md:px-6">
      <div className="mb-8">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-5 w-32" />
      </div>
      
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 bg-white rounded-xl border border-border">
              <Skeleton className="w-24 h-24 shrink-0 rounded-lg" />
              <div className="flex flex-col flex-1 justify-between">
                <div>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-5 w-1/4" />
                </div>
                <div className="flex justify-between items-end mt-4">
                  <Skeleton className="h-9 w-32 rounded-lg" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="lg:col-span-4 sticky top-24">
          <div className="bg-white p-6 rounded-xl border border-border space-y-6">
            <Skeleton className="h-8 w-1/2" />
            <div className="space-y-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="space-y-3 pt-4">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
