import { useState } from "react";
import usePageTitle from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAdminBrands } from "./hooks/useAdminBrands";
import { useAdminBrandMutations } from "./hooks/useAdminBrandMutations";
import { BrandList } from "./components/BrandList";
import { BrandForm } from "./components/BrandForm";

export default function BrandsAdminPage() {
  usePageTitle("Thương hiệu | Admin");
  const { data: brands = [], isLoading } = useAdminBrands();
  const { createBrand, updateBrand, deleteBrand } = useAdminBrandMutations();

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
    if (isEdit) {
      await updateBrand.mutateAsync({ id, formData });
      toast.success("Đã cập nhật thương hiệu");
    } else {
      await createBrand.mutateAsync(formData);
      toast.success("Đã tạo thương hiệu");
    }
  };

  const handleDelete = (b) => {
    const n = b._count?.products ?? 0;
    const msg =
      n > 0
        ? `Xoá "${b.name}"? ${n} sản phẩm sẽ mất liên kết thương hiệu (không xoá sản phẩm).`
        : `Xoá thương hiệu "${b.name}"?`;
    if (!window.confirm(msg)) return;
    deleteBrand.mutate(b.id, {
      onSuccess: () => toast.success("Đã xoá thương hiệu"),
      onError: (e) =>
        toast.error(e.response?.data?.message || "Không xoá được"),
    });
  };

  const submitting = createBrand.isPending || updateBrand.isPending;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thương hiệu</h1>
          <p className="text-sm text-muted-foreground">
            Các thương hiệu hiển thị tại trang chủ.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm thương hiệu
        </Button>
      </div>

      <BrandList
        brands={brands}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={handleDelete}
        deletePendingId={deleteBrand.isPending ? deleteBrand.variables : null}
      />

      <BrandForm
        open={formOpen}
        onOpenChange={setFormOpen}
        brand={editing}
        onSubmit={handleFormSubmit}
        isSubmitting={submitting}
      />
    </div>
  );
}
