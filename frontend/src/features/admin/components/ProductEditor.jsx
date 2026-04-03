import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ImageUploadGrid } from "./ImageUploadGrid";
import { AttributeManager } from "./AttributeManager";
import { VariantGrid, cartesianProduct } from "./VariantGrid";
import { AlertCircle, Tag, Sparkles, Calendar, ChevronDown, Clock, Hash, Trash2 } from "lucide-react";
import { getFinalPrice, getDiscountPercent, formatVND } from "@/utils/price";
import { toast } from "@/lib/toast";

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
  // Task 6 fields + Flash Sale
  salePrice: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().positive("Giá sale phải lớn hơn 0").nullable().optional()
  ),
  saleExpiresAt: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : String(v)),
    z.string().nullable().optional()
  ),
  saleStock: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int("Suất sale là số nguyên").min(1, "Số suất >= 1").nullable().optional()
  ),
  isNewArrival: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  manufactureYear: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(2000).max(2100).nullable().optional()
  ),
  hasVariants: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.salePrice != null && data.price != null && data.salePrice >= data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Giá sale phải nhỏ hơn giá gốc",
      path: ["salePrice"]
    });
  }
  if (data.saleExpiresAt != null && data.salePrice == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cần điền giá sale trước khi đặt thời hạn",
      path: ["saleExpiresAt"]
    });
  }
  if (data.saleStock != null && data.salePrice == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cần điền giá sale trước khi đặt số lượng",
      path: ["saleStock"]
    });
  }
  if (data.saleExpiresAt != null) {
    if (new Date(data.saleExpiresAt) <= new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Thời hạn sale phải ở tương lai",
        path: ["saleExpiresAt"]
      });
    }
  }
});

const isoToDatetimeLocal = (isoString) => {
  return isoString ? new Date(isoString).toISOString().slice(0, 16) : '';
};

export function ProductEditor({
  isActive,
  onCancel,
  onSubmit, // (body, meta?) => void | Promise — meta: { attributeDraft, variantRows }
  initialData = null,
  isLoading = false,
  serverError = null,
}) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isFlashSaleOpen, setIsFlashSaleOpen] = useState(false);
  const [attributeDraft, setAttributeDraft] = useState([]);
  const [variantRows, setVariantRows] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    shouldUseNativeValidation: false,
    defaultValues: {
      name: "",
      description: "",
      price: "",
      stock: "",
      brand: "",
      category: "",
      images: [],
      salePrice: "",
      saleExpiresAt: "",
      saleStock: "",
      isNewArrival: true,
      isBestseller: false,
      manufactureYear: "",
      hasVariants: false,
    },
  });

  // Live preview for salePrice
  const watchedPrice = watch("price");
  const watchedHasVariants = watch("hasVariants");
  const watchedSalePrice = watch("salePrice");

  useEffect(() => {
    if (watchedHasVariants) {
      setValue("stock", 0);
    }
  }, [watchedHasVariants, setValue]);
  const previewDiscountPercent = watchedPrice && watchedSalePrice
    ? getDiscountPercent(Number(watchedPrice), Number(watchedSalePrice))
    : 0;
  const salePriceIsValid = watchedPrice && watchedSalePrice
    ? Number(watchedSalePrice) > 0 && Number(watchedSalePrice) < Number(watchedPrice)
    : true;

  useEffect(() => {
    if (isActive) {
      if (initialData) {
        reset({
          name: initialData.name || "",
          description: initialData.description || "",
          price: initialData.price || "",
          stock: initialData.stock ?? "",
          brand: initialData.brand || "",
          category: initialData.category || "",
          images: initialData.images || [],
          salePrice: initialData.salePrice != null ? initialData.salePrice : "",
          saleExpiresAt: isoToDatetimeLocal(initialData.saleExpiresAt),
          saleStock: initialData.saleStock != null ? initialData.saleStock : "",
          isNewArrival: initialData.isNewArrival ?? true,
          isBestseller: initialData.isBestseller ?? false,
          manufactureYear: initialData.manufactureYear != null ? initialData.manufactureYear : "",
          hasVariants: !!initialData.hasVariants,
        });
        if (initialData.salePrice != null) {
          setIsFlashSaleOpen(true);
        }
        setAttributeDraft([]);
        setVariantRows([]);
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
          saleExpiresAt: "",
          saleStock: "",
          isNewArrival: true,
          isBestseller: false,
          manufactureYear: "",
          hasVariants: false,
        });
        setIsFlashSaleOpen(false);
        setAttributeDraft([]);
        setVariantRows([]);
      }
    }
    if (!isActive) {
      setIsUploadingImage(false);
    }
  }, [initialData, isActive, reset]);

  // Load chi tiết thuộc tính / biến thể khi sửa sản phẩm có biến thể
  useEffect(() => {
    if (!isActive || !initialData?.id || !initialData.hasVariants) return;
    let cancelled = false;
    (async () => {
      try {
        const [a, v] = await Promise.all([
          axiosInstance.get(`/admin/products/${initialData.id}/attributes`),
          axiosInstance.get(`/admin/products/${initialData.id}/variants`),
        ]);
        const attrs = a.data?.data ?? a.data;
        const variants = v.data?.data ?? v.data;
        if (cancelled || !attrs?.length) return;
        const draft = attrs
          .sort((x, y) => x.position - y.position)
          .map((at) => ({
            name: at.name,
            values: [...at.values].sort((p, q) => p.position - q.position).map((val) => val.value),
          }));
        setAttributeDraft(draft);
        const arrs = attrs
          .sort((x, y) => x.position - y.position)
          .map((at) => [...at.values].sort((p, q) => p.position - q.position).map((val) => val.value));
        const combos = cartesianProduct(arrs);
        const sortedAttrs = attrs.sort((x, y) => x.position - y.position);
        const rows = combos.map((combo) => {
          const ids = combo.map((val, idx) =>
            sortedAttrs[idx].values.find((x) => x.value === val)?.id
          );
          const match = variants.find((variant) => {
            const vids =
              variant.values?.map((vv) => vv.attributeValueId || vv.attributeValue?.id) || [];
            if (vids.length !== ids.length) return false;
            return ids.every((id) => vids.includes(id));
          });
          return {
            price: match ? Number(match.price) : Number(initialData.price) || 0,
            stock: match ? match.stock : 10,
            imageUrl: match?.imageUrl || "",
            salePrice: match?.salePrice != null ? Number(match.salePrice) : "",
            saleExpiresAt: match?.saleExpiresAt ? isoToDatetimeLocal(match.saleExpiresAt) : "",
            saleStock: match?.saleStock != null ? match.saleStock : "",
          };
        });
        setVariantRows(rows);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isActive, initialData?.id, initialData?.hasVariants]);

  // Đồng bộ số dòng biến thể khi đổi thuộc tính (tạo mới và sửa — giữ dòng cũ khi còn khớp tổ hợp)
  useEffect(() => {
    if (!watchedHasVariants) return;
    const arrs = attributeDraft.map((a) => a.values.filter(Boolean));
    if (arrs.length === 0 || arrs.some((x) => x.length === 0)) {
      setVariantRows([]);
      return;
    }
    const combos = cartesianProduct(arrs);
    const bp = Number(watchedPrice) || 0;
    setVariantRows((prev) => {
      if (prev.length === combos.length) return prev;
      return combos.map(
        (_, i) =>
          prev[i] || {
            price: bp,
            stock: 10,
            imageUrl: "",
            salePrice: "",
            saleExpiresAt: "",
            saleStock: "",
          }
      );
    });
  }, [attributeDraft, watchedHasVariants, watchedPrice]);

  const onFormSubmit = async (data) => {
    if (data.hasVariants) {
      const okAttr =
        attributeDraft.length > 0 &&
        attributeDraft.every(
          (a) => a.name.trim() && a.values.some((v) => String(v).trim())
        );
      if (!okAttr) {
        toast.error("Vui lòng nhập đủ tên thuộc tính và ít nhất một giá trị mỗi thuộc tính");
        return;
      }
      const arrs = attributeDraft.map((a) => a.values.map((v) => String(v).trim()).filter(Boolean));
      if (arrs.some((x) => x.length === 0)) {
        toast.error("Mỗi thuộc tính cần ít nhất một giá trị");
        return;
      }
      const nCombos = cartesianProduct(arrs).length;
      if (!variantRows.length || variantRows.length !== nCombos) {
        toast.error("Chưa đủ dòng biến thể — kiểm tra thuộc tính và giá/tồn kho");
        return;
      }
      for (let i = 0; i < variantRows.length; i += 1) {
        const row = variantRows[i];
        const base = Number(row.price);
        const sp = row.salePrice !== "" && row.salePrice != null ? Number(row.salePrice) : null;
        if (sp != null && sp > 0) {
          if (!(sp < base)) {
            toast.error(`Biến thể dòng ${i + 1}: giá sale phải nhỏ hơn giá gốc`);
            return;
          }
          if (row.saleExpiresAt && new Date(row.saleExpiresAt) <= new Date()) {
            toast.error(`Biến thể dòng ${i + 1}: thời hạn sale phải ở tương lai`);
            return;
          }
        }
      }
    }
    const cleaned = {
      ...data,
      salePrice: data.salePrice ? data.salePrice : null,
      saleExpiresAt: data.saleExpiresAt ? new Date(data.saleExpiresAt).toISOString() : null,
      saleStock: data.saleStock ? data.saleStock : null,
      manufactureYear: data.manufactureYear ? data.manufactureYear : null,
    };
    if (cleaned.hasVariants) {
      cleaned.stock = 0;
    }
    const meta = {
      attributeDraft,
      variantRows,
    };
    await onSubmit(cleaned, meta);
  };

  const handleClearFlashSale = () => {
    setValue('salePrice', "", { shouldValidate: true });
    setValue('saleExpiresAt', "", { shouldValidate: true });
    setValue('saleStock', "", { shouldValidate: true });
  };

  return (
    <>
      {serverError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form noValidate onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
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
                inputMode="decimal"
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
                inputMode="numeric"
                disabled={watchedHasVariants}
                {...register("stock")}
                className={errors.stock ? "border-red-500" : ""}
              />
              {watchedHasVariants && (
                <p className="text-xs text-muted-foreground">Tồn kho theo từng biến thể bên dưới</p>
              )}
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

          <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/40">
            <Controller
              name="hasVariants"
              control={control}
              render={({ field }) => (
                <Switch id="hasVariants" checked={!!field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label htmlFor="hasVariants" className="cursor-pointer">
              Sản phẩm có nhiều biến thể (màu, dung lượng, …)
            </Label>
          </div>

          {watchedHasVariants && (
            <div className="space-y-4">
              <AttributeManager attributes={attributeDraft} onChange={setAttributeDraft} />
              <VariantGrid
                attributes={attributeDraft}
                rows={variantRows}
                onChangeRows={setVariantRows}
              />
            </div>
          )}

          {/* Task 6: Custom fields */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="space-y-2">
              <Label htmlFor="manufactureYear" className="flex items-center gap-1.5 text-slate-700">
                <Calendar className="w-3.5 h-3.5" />
                Năm ra mắt
              </Label>
              <Input
                id="manufactureYear"
                type="number"
                inputMode="numeric"
                placeholder="VD: 2024"
                {...register("manufactureYear")}
                className={errors.manufactureYear ? "border-red-500" : ""}
              />
              {errors.manufactureYear && <p className="text-red-500 text-xs">{errors.manufactureYear.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-slate-700">
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

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-slate-700">
                <Tag className="w-3.5 h-3.5" />
                Bán chạy
              </Label>
              <div className="flex items-center gap-3 pt-2">
                <Controller
                  name="isBestseller"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="isBestseller"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <span className="text-sm text-muted-foreground">
                  {watch("isBestseller") ? "Hiển thị badge Bán chạy" : "Không hiển thị badge"}
                </span>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Flash Sale Section */}
          <Collapsible open={isFlashSaleOpen} onOpenChange={setIsFlashSaleOpen} className="space-y-4">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="p-0 hover:bg-transparent hover:text-amber-600 outline-none">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-amber-600">
                    <Tag className="w-5 h-5" />
                    Flash Sale
                    <ChevronDown className={`w-5 h-5 transition-transform ${isFlashSaleOpen ? "rotate-180" : ""}`} />
                  </h3>
                </Button>
              </CollapsibleTrigger>
              {initialData && watchedSalePrice && (
                <Button type="button" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2" onClick={handleClearFlashSale}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Xóa Flash Sale
                </Button>
              )}
            </div>
            
            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="salePrice" className="flex items-center gap-1.5 text-amber-800">
                    Giá sale (₫)
                  </Label>
                  <Input
                    id="salePrice"
                    type="number"
                    inputMode="decimal"
                    placeholder="Để trống nếu không giảm giá"
                    {...register("salePrice")}
                    className={`${!salePriceIsValid && watchedSalePrice ? "border-red-500" : ""}`}
                  />
                  <p className="text-xs text-muted-foreground">Phải nhỏ hơn giá gốc</p>
                  {watchedSalePrice && watchedPrice && (
                    <div className="text-xs mt-1">
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

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="saleExpiresAt" className="flex items-center gap-1.5 text-amber-800">
                    <Clock className="w-3.5 h-3.5" />
                    Thời hạn sale
                  </Label>
                  <Input
                    id="saleExpiresAt"
                    type="datetime-local"
                    disabled={!watchedSalePrice}
                    title={!watchedSalePrice ? "Điền giá sale trước" : ""}
                    placeholder="Để trống = không giới hạn thời gian"
                    {...register("saleExpiresAt")}
                    className={`disabled:opacity-50 disabled:bg-gray-100 ${errors.saleExpiresAt ? "border-red-500" : ""}`}
                  />
                  {errors.saleExpiresAt && <p className="text-red-500 text-xs">{errors.saleExpiresAt.message}</p>}
                </div>

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="saleStock" className="flex items-center gap-1.5 text-amber-800">
                    <Hash className="w-3.5 h-3.5" />
                    Số suất giảm giá tối đa
                  </Label>
                  <Input
                    id="saleStock"
                    type="number"
                    inputMode="numeric"
                    disabled={!watchedSalePrice}
                    title={!watchedSalePrice ? "Điền giá sale trước" : ""}
                    placeholder="Để trống = không giới hạn"
                    {...register("saleStock")}
                    className={`disabled:opacity-50 disabled:bg-gray-100 ${errors.saleStock ? "border-red-500" : ""}`}
                  />
                  {errors.saleStock && <p className="text-red-500 text-xs">{errors.saleStock.message}</p>}
                </div>

                {initialData && (
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label className="flex items-center gap-1.5 text-amber-800">
                      Đã bán với giá sale
                    </Label>
                    <div className="h-10 flex items-center px-3 py-2 border border-gray-200 rounded-md bg-white/50 text-sm italic text-gray-600 pointer-events-none">
                      {initialData.saleSoldCount > 0 ? `${initialData.saleSoldCount} suất` : "—"}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

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
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading || isUploadingImage}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isUploadingImage}>
              {isLoading ? "Saving..." : isUploadingImage ? "Uploading..." : "Save Product"}
            </Button>
          </div>
        </form>
    </>
  );
}
