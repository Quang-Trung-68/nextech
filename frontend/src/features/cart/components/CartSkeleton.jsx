import { Skeleton } from '@/components/ui/skeleton';

export function CartSkeleton() {
  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 min-h-svh flex flex-col">
      <div className="mb-6 lg:mb-8">
        <Skeleton className="h-8 md:h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-32" />
      </div>
      
      <div className="flex-1 grid lg:grid-cols-12 gap-6 lg:gap-8 items-start relative pb-32 lg:pb-0">
        <div className="lg:col-span-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl lg:rounded-2xl border border-border">
              <Skeleton className="w-16 h-16 sm:w-24 sm:h-24 shrink-0 rounded-lg" />
              <div className="flex flex-col flex-1 justify-between gap-2">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 w-full max-w-[200px]">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <Skeleton className="w-8 h-8 rounded-full sm:w-10 sm:h-10" />
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <Skeleton className="h-10 w-28 sm:h-11 sm:w-32 rounded-lg" />
                  <div className="space-y-1 text-right">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <div className="w-full bg-white lg:p-6 lg:rounded-2xl lg:border lg:border-[#d2d2d7] flex flex-col">
            <div className="hidden lg:block space-y-6">
              <Skeleton className="h-7 w-1/2" />
              <div className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
            
            {/* Mobile simplified view */}
            <div className="lg:hidden p-4 border rounded-xl space-y-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>

            <div className="fixed bottom-[env(safe-area-inset-bottom)] left-0 right-0 p-4 border-t bg-white lg:static lg:p-0 lg:border-0 lg:mt-6 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-0">
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
