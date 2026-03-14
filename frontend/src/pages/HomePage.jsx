import { Filter } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { useProducts } from '../features/product/hooks/useProduct';
import { useProductFilters } from '../features/product/hooks/useProductFilters';
import { FilterSidebar } from '../features/product/components/FilterSidebar';
import { ProductGrid } from '../features/product/components/ProductGrid';

const HomePage = () => {
  const { category, sort, search } = useProductFilters();

  // Gọi API lấy dữ liệu theo trạng thái URL
  const { 
    data, 
    isLoading, 
    isFetchingNextPage, 
    hasNextPage, 
    fetchNextPage,
  } = useProducts({ category, sort, search });

  return (
    <div className="container py-8 max-w-7xl mx-auto px-4 md:px-6">
      {/* Header (Title + Mobile Filter Trigger) */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sản phẩm nổi bật</h1>
        
        {/* Nút lọc Mobile (Sidebar Drawer ẩn, dùng Sheet) */}
        <Sheet>
          <SheetTrigger 
            className="lg:hidden flex border-dashed border-2 px-3 py-1 text-sm h-8 items-center justify-center rounded-lg hover:bg-muted"
          >
            <Filter className="mr-2 h-4 w-4" />
            Bộ lọc
            {/* Hiển thị badge nếu có filter đang active */}
            {(category || search || sort !== 'newest') && (
               <span className="ml-2 w-2 h-2 rounded-full bg-primary" />
            )}
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[350px] p-6 ease-in-out duration-300">
             <FilterSidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Layout Chính Lưới 2 Cột */}
      <div className="flex flex-col lg:flex-row gap-10 relative">
        {/* Cột 1: Desktop Layout Sidebar (Cố định cuộn dính - sticky top) */}
        <div className="hidden lg:block w-72 shrink-0">
          <FilterSidebar />
        </div>

        {/* Cột 2: Product List Data */}
        <div className="flex-1 min-w-0 pb-20">
          <ProductGrid 
            data={data}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
