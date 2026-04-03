import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductEditor } from "./ProductEditor";

export function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
  serverError = null,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[920px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm sản phẩm</DialogTitle>
        </DialogHeader>
        <ProductEditor
          isActive={isOpen}
          initialData={initialData}
          onSubmit={onSubmit}
          onCancel={onClose}
          isLoading={isLoading}
          serverError={serverError}
        />
      </DialogContent>
    </Dialog>
  );
}
