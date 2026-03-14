import { useEffect, useState } from 'react';
import { useProductFilters } from '../hooks/useProductFilters';
import { useDebounce } from '../../../hooks/useDebounce';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';

export function FilterSidebar() {
  const { category, sort, search, setCategory, setSort, setSearch, resetFilters } =
    useProductFilters();

  // Local state cho search input thay vì set thẳng URL để debounce mượt
  const [searchTerm, setSearchTerm] = useState(search);
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Sync back to URL khi user dừng gõ 500ms
  useEffect(() => {
    // Chỉ cập nhật nếu url params search khác với biến local đang được debounce
    if (debouncedSearch !== search) {
      setSearch(debouncedSearch);
    }
  }, [debouncedSearch, search, setSearch]);

  // Handle outside change (e.g user back/forward trong router, reset filters bằng router state)
  useEffect(() => {
    setSearchTerm(search);
  }, [search]);

  // Categories cứng
  const CATEGORIES = [
    { value: 'ALL', label: 'Tất cả danh mục' },
    { value: 'ELECTRONICS', label: 'Điện tử' },
    { value: 'FASHION', label: 'Thời trang' },
    { value: 'HOME_APPLIANCES', label: 'Đồ gia dụng' },
    { value: 'BOOKS', label: 'Sách & Văn phòng phẩm' },
    { value: 'BEAUTY', label: 'Sức khoẻ & Làm đẹp' },
    { value: 'SPORTS', label: 'Thể thao & Dã ngoại' },
    { value: 'TOYS', label: 'Đồ chơi & Mẹ bé' },
    { value: 'AUTOMOTIVE', label: 'Ô tô & Xe máy' },
  ];

  const SORTS = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'price_asc', label: 'Giá thấp đến cao' },
    { value: 'price_desc', label: 'Giá cao đến thấp' },
    { value: 'rating_desc', label: 'Đánh giá cao nhất' },
  ];

  return (
    <div className="space-y-6 lg:sticky lg:top-20">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Bộ lọc tìm kiếm</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Tên sản phẩm</Label>
            <Input
              id="search"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Danh mục</Label>
            <Select
              value={category || 'ALL'}
              onValueChange={(val) => setCategory(val === 'ALL' ? '' : val)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort">Sắp xếp theo</Label>
            <Select value={sort || 'newest'} onValueChange={(val) => setSort(val)}>
              <SelectTrigger id="sort">
                <SelectValue placeholder="Chọn cách sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full text-muted-foreground"
              onClick={resetFilters}
            >
              Xoá bộ lọc
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
