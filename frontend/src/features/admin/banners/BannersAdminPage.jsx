import { useState } from 'react';
import usePageTitle from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useBanners } from './hooks/useBanners';
import { useBannerMutations } from './hooks/useBannerMutations';
import { BannerList } from './components/BannerList';
import { BannerForm } from './components/BannerForm';

export default function BannersAdminPage() {
  usePageTitle('Banner | Admin');
  const { data: banners = [], isLoading } = useBanners();
  const { createBanner, updateBanner, deleteBanner, toggleActive } = useBannerMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setFormOpen(true);
  };

  const handleFormSubmit = async ({ formData, isEdit, id }) => {
    if (isEdit) await updateBanner.mutateAsync({ id, formData });
    else await createBanner.mutateAsync(formData);
  };

  const submitting = createBanner.isPending || updateBanner.isPending;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Banner</h1>
          <p className="text-sm text-muted-foreground">Banner hiển thị trên trang chủ (hero slider).</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm banner
        </Button>
      </div>

      <BannerList
        banners={banners}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(id) => deleteBanner.mutate(id)}
        onToggleActive={(id) => toggleActive.mutate(id)}
        togglePendingId={toggleActive.isPending ? toggleActive.variables : null}
      />

      <BannerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        banner={editing}
        onSubmit={handleFormSubmit}
        isSubmitting={submitting}
      />
    </div>
  );
}
