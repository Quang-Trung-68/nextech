import { useState } from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import { useAdminProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../../features/admin/hooks/useAdmin';
import { DataTable } from '../../features/admin/components/DataTable';
import { ProductModal } from '../../features/admin/components/ProductModal';
import { ConfirmDialog } from '../../features/admin/components/ConfirmDialog';
import { CustomPagination } from '../../features/admin/components/CustomPagination';
import { Button } from '../../components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '../../lib/toast';

const AdminProductPage = () => {
  usePageTitle('Quản lý Sản phẩm | Quản trị');
  
  const [params, setParams] = useState({ page: 1, limit: 10, search: '' });
  
  const { data, isLoading } = useAdminProducts(params);
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  const [activeModal, setActiveModal] = useState(null); // 'create' | 'edit' | null
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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
      header: 'Category',
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => `$${row.original.price}`,
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => (
        <span className={row.original.stock === 0 ? 'text-destructive font-medium' : ''}>
          {row.original.stock}
        </span>
      ),
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

  const handleCreateOrUpdate = (body) => {
    if (activeModal === 'create') {
      createProduct(body, {
        onSuccess: () => {
          toast.success('Product created successfully');
          setActiveModal(null);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to create product'),
      });
    } else if (activeModal === 'edit' && selectedProduct) {
      updateProduct(
        { id: selectedProduct.id, body },
        {
          onSuccess: () => {
            toast.success('Product updated successfully');
            setActiveModal(null);
          },
          onError: (err) => toast.error(err.response?.data?.message || 'Failed to update product'),
        }
      );
    }
  };

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
        <Button onClick={() => setActiveModal('create')}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="py-4">
        <input
          type="text"
          placeholder="Search products..."
          className="border rounded-md px-3 py-2 w-full max-w-sm"
          value={params.search}
          onChange={(e) => setParams({ ...params, search: e.target.value, page: 1 })}
        />
      </div>

      {isLoading ? (
        <div>Loading products...</div>
      ) : (
        <DataTable columns={columns} data={data?.products || []} />
      )}

      {data?.totalPages > 1 && (
        <div className="mt-4 flex justify-end">
          <CustomPagination
            currentPage={params.page}
            totalPages={data.totalPages}
            onPageChange={(page) => setParams({ ...params, page })}
          />
        </div>
      )}

      {/* Modals & Dialogs */}
      <ProductModal
        isOpen={!!activeModal}
        onClose={() => {
          setActiveModal(null);
          setSelectedProduct(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={activeModal === 'edit' ? selectedProduct : null}
        isLoading={isCreating || isUpdating}
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
