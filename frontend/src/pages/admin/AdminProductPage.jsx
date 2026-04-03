import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import usePageTitle from '@/hooks/usePageTitle';
import { useDebounce } from '@/hooks/useDebounce';
import { useAdminProducts, useDeleteProduct } from '@/features/admin/hooks/useAdmin';
import { DataTable } from '@/features/admin/components/DataTable';
import { ProductModal } from '@/features/admin/components/ProductModal';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/utils/formatCurrency';
import { CustomPagination } from '@/features/admin/components/CustomPagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axiosInstance from '@/lib/axios';
import { useQueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/features/admin/hooks/useAdmin';
import { buildVariantsPayload } from '@/features/admin/utils/buildVariantsPayload';

const AdminProductPage = () => {
  usePageTitle('Sản phẩm | Quản trị');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filterState, setFilterState] = useState({ page: 1, limit: 10, category: '' });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);
  const params = useMemo(
    () => ({ ...filterState, search: debouncedSearch }),
    [debouncedSearch, filterState]
  );

  React.useEffect(() => {
    setFilterState((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch]);

  const { data, isLoading } = useAdminProducts(params);
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleCreateProduct = async (body, meta = {}) => {
    const { attributeDraft = [], variantRows = [] } = meta;
    setServerError(null);
    setIsSavingProduct(true);
    try {
      const { data } = await axiosInstance.post('/admin/products', body);
      const productId = data.product?.id;
      if (body.hasVariants && attributeDraft.length && productId) {
        await buildVariantsPayload(productId, attributeDraft, variantRows, body.price);
      }
      toast.success('Đã tạo sản phẩm');
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      setCreateModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Thao tác thất bại';
      toast.error(msg);
      setServerError(msg);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const columns = [
    {
      accessorKey: 'images',
      header: 'Ảnh',
      cell: ({ row }) => (
        <img
          src={row.original.images?.[0]?.url || 'https://via.placeholder.com/50'}
          alt={row.original.name}
          className="w-12 h-12 object-cover rounded-md"
        />
      ),
    },
    {
      accessorKey: 'name',
      header: 'Tên',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'category',
      header: () => (
        <Select
          value={params.category || 'all'}
          onValueChange={(value) =>
            setFilterState((prev) => ({ ...prev, category: value !== 'all' ? value : '', page: 1 }))
          }
        >
          <SelectTrigger className="w-[140px] text-sm capitalize bg-transparent border-none shadow-none font-medium p-0 -ml-1 focus:ring-0 focus-visible:ring-0">
            <SelectValue placeholder="Danh mục (tất cả)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Danh mục (tất cả)</SelectItem>
            <SelectItem value="laptop">Laptop</SelectItem>
            <SelectItem value="smartphone">Smartphone</SelectItem>
            <SelectItem value="tablet">Tablet</SelectItem>
            <SelectItem value="accessory">Accessory</SelectItem>
          </SelectContent>
        </Select>
      ),
      cell: ({ getValue }) => {
        const slug = getValue()?.toLowerCase();
        const vi = { laptop: 'Laptop', smartphone: 'Điện thoại', tablet: 'Máy tính bảng', accessory: 'Phụ kiện' };
        return <span>{vi[slug] ?? slug}</span>;
      },
    },
    {
      accessorKey: 'price',
      header: 'Giá',
      cell: ({ row }) => formatCurrency(row.original.price),
    },
    {
      accessorKey: 'stock',
      header: 'Tồn kho',
      cell: ({ row }) => {
        const v = row.original;
        if (v.hasVariants) {
          return <span className="text-muted-foreground text-sm">Theo biến thể</span>;
        }
        return (
          <span className={v.stock === 0 ? 'text-destructive font-medium' : ''}>{v.stock}</span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/admin/products/${row.original.id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => {
              setSelectedProduct(row.original);
              setDeleteConfirmOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleDelete = () => {
    if (selectedProduct) {
      deleteProduct(selectedProduct.id, {
        onSuccess: () => {
          toast.success('Đã xóa sản phẩm');
          setDeleteConfirmOpen(false);
          setSelectedProduct(null);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Không xóa được sản phẩm'),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý sản phẩm</h1>
        <Button
          onClick={() => {
            setCreateModalOpen(true);
            setServerError(null);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Thêm sản phẩm
        </Button>
      </div>

      <div className="py-4">
        <input
          type="text"
          placeholder="Tìm sản phẩm..."
          className="border rounded-md px-3 py-2 w-full max-w-sm"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <DataTable columns={columns} data={data?.products || []} />
      )}

      {data?.pagination?.totalPages > 1 && (
        <div className="mt-4 flex justify-end">
          <CustomPagination
            currentPage={params.page}
            totalPages={data.pagination.totalPages}
            onPageChange={(page) => setFilterState((prev) => ({ ...prev, page }))}
          />
        </div>
      )}

      <ProductModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setServerError(null);
        }}
        onSubmit={handleCreateProduct}
        initialData={null}
        isLoading={isSavingProduct}
        serverError={serverError}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDelete}
        title="Xóa sản phẩm"
        description={`Bạn có chắc muốn xóa "${selectedProduct?.name}"? Thao tác không thể hoàn tác.`}
        confirmText="Xóa"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminProductPage;
