import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductEditor } from '@/features/admin/components/ProductEditor';
import { buildVariantsPayload } from '@/features/admin/utils/buildVariantsPayload';
import { adminKeys, useAdminProduct } from '@/features/admin/hooks/useAdmin';
import usePageTitle from '@/hooks/usePageTitle';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { toast } from '@/lib/toast';

const AdminProductEditPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: product, isLoading, isError, error } = useAdminProduct(productId);
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  usePageTitle(product?.name ? `Chỉnh sửa: ${product.name} | Admin` : 'Chỉnh sửa sản phẩm | Admin');

  const handleUpdate = async (body, meta = {}) => {
    const { attributeDraft = [], variantRows = [] } = meta;
    setServerError(null);
    setIsSaving(true);
    try {
      await axiosInstance.patch(`/admin/products/${productId}`, body);
      if (body.hasVariants && attributeDraft.length) {
        await buildVariantsPayload(productId, attributeDraft, variantRows, body.price);
      }
      toast.success('Product updated successfully');
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.product(productId) });
      navigate('/admin/products');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Thao tác thất bại';
      toast.error(msg);
      setServerError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button type="button" variant="ghost" className="gap-2 -ml-2" onClick={() => navigate('/admin/products')}>
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Button>
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="space-y-6">
        <Button type="button" variant="ghost" className="gap-2 -ml-2" onClick={() => navigate('/admin/products')}>
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Button>
        <p className="text-destructive">
          {error?.response?.data?.message || error?.message || 'Không tải được sản phẩm.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[920px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button type="button" variant="ghost" className="gap-2 -ml-2 w-fit" onClick={() => navigate('/admin/products')}>
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Chỉnh sửa sản phẩm</h1>
          <p className="text-muted-foreground text-sm">{product.name}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <ProductEditor
          isActive
          initialData={product}
          onSubmit={handleUpdate}
          onCancel={() => navigate('/admin/products')}
          isLoading={isSaving}
          serverError={serverError}
        />
      </div>
    </div>
  );
};

export default AdminProductEditPage;
