import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ImageUploadGrid } from "./ImageUploadGrid";
import { AlertCircle, Tag, Sparkles, Calendar } from "lucide-react";
import { getFinalPrice, getDiscountPercent, formatVND } from "@/utils/price";

const productSchema = z.object({
  name: z.string().min(2, "Tên sản phẩm phải có ít nhất 2 ký tự"),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự").optional().or(z.literal('')),
  price: z.coerce.number({ invalid_type_error: "Giá phải là số" }).positive("Giá lớn hơn 0"),
  stock: z.coerce.number().int("Stock là số nguyên").min(0, "Stock >= 0"),
  brand: z.string().min(1, "Vui lòng nhập thương hiệu"),
  category: z.string().min(1, "Vui lòng nhập danh mục"),
  images: z.array(z.object({
    url: z.string(),
    publicId: z.string(),
  })).min(1, "Phải có ít nhất 1 ảnh"),
  // Task 6 fields
  salePrice: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().positive().nullable().optional()
  ),
  isNewArrival: z.boolean().optional(),
  manufactureYear: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(2000).max(2100).nullable().optional()
  ),
});

export function ProductModal({
  isOpen,
  onClose,
  onSubmit, // will receive body object on success
  initialData = null,
  isLoading = false,
  serverError = null,
}) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      stock: "",
      brand: "",
      category: "",
      images: [],
      salePrice: "",
      isNewArrival: true,
      manufactureYear: "",
    },
  });

  // Live preview for salePrice
  const watchedPrice = watch("price");
  const watchedSalePrice = watch("salePrice");
  const previewDiscountPercent = watchedPrice && watchedSalePrice
    ? getDiscountPercent(Number(watchedPrice), Number(watchedSalePrice))
    : 0;
  const salePriceIsValid = watchedPrice && watchedSalePrice
    ? Number(watchedSalePrice) > 0 && Number(watchedSalePrice) < Number(watchedPrice)
    : true;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name || "",
          description: initialData.description || "",
          price: initialData.price || "",
          stock: initialData.stock || "",
          brand: initialData.brand || "",
          category: initialData.category || "",
          images: initialData.images || [],
          salePrice: initialData.salePrice != null ? initialData.salePrice : "",
          isNewArrival: initialData.isNewArrival ?? true,
          manufactureYear: initialData.manufactureYear != null ? initialData.manufactureYear : "",
        });
      } else {
        reset({
          name: "",
          description: "",
          price: "",
          stock: "",
          brand: "",
          category: "",
          images: [],
          salePrice: "",
          isNewArrival: true,
          manufactureYear: "",
        });
      }
    }
    if (!isOpen) { 
      setIsUploadingImage(false); 
    }
  }, [initialData, isOpen, reset]);

  const onFormSubmit = (data) => {
    // Clean up empty strings to null/undefined
    const cleaned = {
      ...data,
      salePrice: data.salePrice === "" ? null : data.salePrice,
      manufactureYear: data.manufactureYear === "" ? null : data.manufactureYear,
    };
    onSubmit(cleaned);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Product" : "Add Product"}
          </DialogTitle>
        </DialogHeader>

        {serverError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                {...register("category")}
                className={errors.category ? "border-red-500" : ""}
              />
              {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (VND) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="1000"
                {...register("price")}
                className={errors.price ? "border-red-500" : ""}
              />
              {errors.price && <p className="text-red-500 text-xs">{errors.price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                {...register("stock")}
                className={errors.stock ? "border-red-500" : ""}
              />
              {errors.stock && <p className="text-red-500 text-xs">{errors.stock.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                {...register("brand")}
                className={errors.brand ? "border-red-500" : ""}
              />
              {errors.brand && <p className="text-red-500 text-xs">{errors.brand.message}</p>}
            </div>
          </div>

          {/* Task 6: Sale price, isNewArrival, manufactureYear */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-amber-50/60 border border-amber-100 rounded-xl">
            <div className="space-y-2">
              <Label htmlFor="salePrice" className="flex items-center gap-1.5 text-amber-700">
                <Tag className="w-3.5 h-3.5" />
                Sale Price (VND)
              </Label>
              <Input
                id="salePrice"
                type="number"
                min="0"
                step="1000"
                placeholder="Để trống = không giảm"
                {...register("salePrice")}
                className={`${!salePriceIsValid && watchedSalePrice ? "border-red-500" : ""}`}
              />
              {/* Live preview */}
              {watchedSalePrice && watchedPrice && (
                <div className="text-xs">
                  {salePriceIsValid ? (
                    previewDiscountPercent > 0 ? (
                      <span className="text-green-600 font-semibold">
                        ✓ Giảm {previewDiscountPercent}% → {formatVND(getFinalPrice(Number(watchedPrice), Number(watchedSalePrice)))}
                      </span>
                    ) : null
                  ) : (
                    <span className="text-red-500">✗ Giá sale phải nhỏ hơn giá gốc</span>
                  )}
                </div>
              )}
              {errors.salePrice && <p className="text-red-500 text-xs">{errors.salePrice.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufactureYear" className="flex items-center gap-1.5 text-amber-700">
                <Calendar className="w-3.5 h-3.5" />
                Năm ra mắt
              </Label>
              <Input
                id="manufactureYear"
                type="number"
                min="2000"
                max="2100"
                placeholder="VD: 2024"
                {...register("manufactureYear")}
                className={errors.manufactureYear ? "border-red-500" : ""}
              />
              {errors.manufactureYear && <p className="text-red-500 text-xs">{errors.manufactureYear.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-amber-700">
                <Sparkles className="w-3.5 h-3.5" />
                Sản phẩm mới
              </Label>
              <div className="flex items-center gap-3 pt-2">
                <Controller
                  name="isNewArrival"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="isNewArrival"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <span className="text-sm text-muted-foreground">
                  {watch("isNewArrival") ? "Hiển thị badge Mới" : "Không hiển thị badge"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              {...register("description")}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
          </div>

          {/* Upload ảnh */}
          <div className="space-y-2">
            <Label>Images *</Label>
            <Controller
              name="images"
              control={control}
              render={({ field }) => (
                <ImageUploadGrid 
                  images={field.value} 
                  onChange={field.onChange} 
                  onUploadingChange={setIsUploadingImage}
                />
              )}
            />
            {errors.images && <p className="text-red-500 text-xs">{errors.images.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isUploadingImage}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isUploadingImage}>
              {isLoading ? "Saving..." : isUploadingImage ? "Uploading..." : "Save Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
