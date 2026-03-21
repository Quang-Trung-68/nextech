import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SlidersHorizontal } from 'lucide-react';

const FilterDrawer = ({
  renderSidebarContent
}) => {
  return (
    <div className="md:hidden w-full">
      <Sheet>
        <SheetTrigger className="inline-flex items-center justify-center w-full h-10 rounded-lg border border-[#d2d2d7] bg-white hover:bg-apple-gray transition-colors focus:outline-none focus:ring-2 focus:ring-apple-blue gap-2 font-medium text-sm text-apple-dark">
          <SlidersHorizontal className="w-4 h-4" />
          Bộ lọc
        </SheetTrigger>
        <SheetContent side="bottom" className="w-full h-[85vh] rounded-t-2xl overflow-y-auto p-6 fixed bottom-0 left-0 right-0">
          <SheetHeader className="mb-6 p-0 text-left">
            <SheetTitle className="font-bold text-apple-dark">Lọc Sản Phẩm</SheetTitle>
          </SheetHeader>
          {renderSidebarContent()}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FilterDrawer;
