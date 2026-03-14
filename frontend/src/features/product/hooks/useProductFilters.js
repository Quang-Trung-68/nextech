import { useSearchParams } from 'react-router-dom';

export function useProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Đọc params từ URL làm source of truth (nếu không có thì trả về unefined/rỗng)
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search') || '';

  // Hàm helper để merge các param mới vào param cũ trên URL
  const updateParams = (newParams) => {
    // setSearchParams có thể nhận function để có object params cũ nhất
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value) {
          updated.set(key, value);
        } else {
          updated.delete(key);
        }
      });
      return updated;
    });
  };

  const setCategory = (cat) => updateParams({ category: cat });
  const setSort = (s) => updateParams({ sort: s });
  const setSearch = (s) => updateParams({ search: s });

  const resetFilters = () => setSearchParams(new URLSearchParams());

  return {
    category,
    sort,
    search,
    setCategory,
    setSort,
    setSearch,
    resetFilters,
  };
}
