import React, { useState, useMemo } from 'react';
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
import { cartesianProduct } from '@/features/admin/components/VariantGrid';
import { useQueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/features/admin/hooks/useAdmin';

const AdminProductPage = () => {
  usePageTitle('Manage Products | Admin');
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

  const [activeModal, setActiveModal] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serverError, setServerError] = useState(null);

  const buildVariantsPayload = async (productId, attributeDraft, variantRows, fallbackPrice) => {
    const attrsPayload = {
      attributes: attributeDraft.map((a, i) => ({
        name: a.name.trim(),
        position: i,
        values: a.values
          .map((v) => String(v).trim())
          .filter(Boolean)
          .map((value, j) => ({ value, position: j })),
      })),
    };
    await axiosInstance.put(`/admin/products/${productId}/attributes`, attrsPayload);
    const { data: attrRes } = await axiosInstance.get(`/admin/products/${productId}/attributes`);
    const attrs = attrRes.data ?? attrRes;
    const sortedAttrs = [...attrs].sort((a, b) => a.position - b.position);
    const arrs = sortedAttrs.map((at) =>
      [...at.values].sort((p, q) => p.position - q.position).map((val) => val.value)
    );
    const combos = cartesianProduct(arrs);
    const variants = combos.map((combo, idx) => {
      const attributeValueIds = combo.map((val, i) => {
        const v = sortedAttrs[i].values.find((x) => x.value === val);
        return v?.id;
      });
      if (attributeValueIds.some((id) => !id)) {
        throw new Error('Không map được giá trị thuộc tính');
      }
      const row = variantRows[idx] || {};
      let imageUrl = row.imageUrl;
      if (imageUrl === '' || imageUrl === undefined) imageUrl = null;
      return {
        attributeValueIds,
        price: Number(row.price ?? fallbackPrice),
        stock: Number(row.stock ?? 0),
        imageUrl,
      };
    });
    await axiosInstance.put(`/admin/products/${productId}/variants`, { variants });
  };

  const handleCreateOrUpdate = async (body, meta = {}) => {
    const { attributeDraft = [], variantRows = [] } = meta;
    setServerError(null);
    setIsSavingProduct(true);
    try {
      if (activeModal === 'create') {
        const { data } = await axiosInstance.post('/admin/products', body);
        const productId = data.product?.id;
        if (body.hasVariants && attributeDraft.length && productId) {
          await buildVariantsPayload(productId, attributeDraft, variantRows, body.price);
        }
        toast.success('Product created successfully');
        queryClient.invalidateQueries({ queryKey: adminKeys.all });
        setActiveModal(null);
        return;
      }

      if (activeModal === 'edit' && selectedProduct) {
        const { data } = await axiosInstance.patch(`/admin/products/${selectedProduct.id}`, body);
        if (body.hasVariants && attributeDraft.length) {
          await buildVariantsPayload(
            selectedProduct.id,
            attributeDraft,
            variantRows,
            body.price
          );
        }
        void data;
        toast.success('Product updated successfully');
        queryClient.invalidateQueries({ queryKey: adminKeys.all });
        setActiveModal(null);
      }
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
      header: 'Image',
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
      header: 'Name',
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
            <SelectValue placeholder="Category (all)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Category (all)</SelectItem>
            <SelectItem value="laptop">Laptop</SelectItem>
            <SelectItem value="smartphone">Smartphone</SelectItem>
            <SelectItem value="tablet">Tablet</SelectItem>
            <SelectItem value="accessory">Accessory</SelectItem>
          </SelectContent>
        </Select>
      ),
      cell: ({ getValue }) => <span className="capitalize">{getValue()?.toLowerCase()}</span>,
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => formatCurrency(row.original.price),
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
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
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setSelectedProduct(row.original);
              setActiveModal('edit');
              setServerError(null);
            }}
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
          toast.success('Product deleted successfully');
          setDeleteConfirmOpen(false);
          setSelectedProduct(null);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete product'),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Manage Products</h1>
        <Button
          onClick={() => {
            setActiveModal('create');
            setServerError(null);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="py-4">
        <input
          type="text"
          placeholder="Search products..."
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
        isOpen={!!activeModal}
        onClose={() => {
          setActiveModal(null);
          setSelectedProduct(null);
          setServerError(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={activeModal === 'edit' ? selectedProduct : null}
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
        title="Delete Product"
        description={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminProductPage;
