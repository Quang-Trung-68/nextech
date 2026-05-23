import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VndCurrencyInput } from "@/components/ui/vnd-currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ImageUploadGrid } from "./ImageUploadGrid";
import { AttributeManager } from "./AttributeManager";
import { VariantGrid, cartesianProduct } from "./VariantGrid";
import { AlertCircle, Tag, Sparkles, Calendar, ChevronDown, Clock, Hash, Trash2, Plus, X } from "lucide-react";
import { getFinalPrice, getDiscountPercent, formatVND } from "@/utils/price";
import { toast } from "@/lib/toast";

const productSchema = z.object({
  name: z.string().min(2, "Tên sản phẩm phải có ít nhất 2 ký tự"),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự").optional().or(z.literal('')),
  price: z.coerce.number({ invalid_type_error: "Giá phải là số" }).positive("Giá lớn hơn 0"),
  stock: z.coerce.number().int("Stock là số nguyên").min(0, "Stock >= 0"),
  brandId: z.string().min(1, "Vui lòng chọn thương hiệu"),
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

  // ── Specs Manager state ───────────────────────────────────────────────────────
  const [specsList, setSpecsList] = useState([]); // [{key: "", value: ""}]
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  const { data: brands = [] } = useQuery({
    queryKey: ["product-brands", "admin-all"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/products/brands");
      return data.brands ?? [];
    },
    enabled: isActive,
    staleTime: 60_000,
  });

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
      brandId: "",
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
          brandId: initialData.brand?.id || "",
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
        // ── Load specsJson vào specsList khi edit ─────────────────────────────
        if (initialData.specsJson && typeof initialData.specsJson === 'object') {
          setSpecsList(
            Object.entries(initialData.specsJson).map(([key, value]) => ({ key, value: String(value) }))
          );
        } else {
          setSpecsList([]);
        }
        setAttributeDraft([]);
        setVariantRows([]);
      } else {
        reset({
          name: "",
          description: "",
          price: "",
          stock: "",
          brandId: "",
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
        setSpecsList([]);
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

  // ── Specs Manager helpers ─────────────────────────────────────────────────────
  const addSpecRow = () => setSpecsList((prev) => [...prev, { key: "", value: "" }]);

  const updateSpecRow = (index, field, val) => {
    setSpecsList((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: val } : row)));
  };

  const removeSpecRow = (index) => {
    setSpecsList((prev) => prev.filter((_, i) => i !== index));
  };

  // ── AI Description generator ──────────────────────────────────────────────────
  const handleGenerateDescription = async () => {
    const name = watch("name");
    if (!name || name.trim().length < 2) {
      toast.error("Vui lòng nhập tên sản phẩm trước khi tạo mô tả bằng AI");
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const specs = specsList.reduce((acc, { key, value }) => {
        if (key.trim()) acc[key.trim()] = value;
        return acc;
      }, {});
      const { data } = await axiosInstance.post("/admin/products/generate-description", {
        name: name.trim(),
        specs,
      });
      if (data.success) {
        setValue("description", data.description);
        toast.success("Đã tạo mô tả bằng AI thành công!");
      }
    } catch {
      toast.error("Không thể tạo mô tả bằng AI, vui lòng thử lại");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

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

    // ── Gắn specsJson từ specsList trước khi submit ───────────────────────────
    const specsJson = specsList.reduce((acc, { key, value }) => {
      if (key.trim()) acc[key.trim()] = value;
      return acc;
    }, {});
    cleaned.specsJson = Object.keys(specsJson).length > 0 ? specsJson : null;

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
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <VndCurrencyInput
                    id="price"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className={errors.price ? "border-red-500" : ""}
                  />
                )}
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
              <Label htmlFor="brandId">Thương hiệu *</Label>
              <Controller
                name="brandId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="brandId"
                      className={errors.brandId ? "border-red-500" : ""}
                      aria-invalid={!!errors.brandId}
                    >
                      <SelectValue placeholder="Chọn hãng" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.brandId && <p className="text-red-500 text-xs">{errors.brandId.message}</p>}
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
                  <Controller
                    name="salePrice"
                    control={control}
                    render={({ field }) => (
                      <VndCurrencyInput
                        id="salePrice"
                        placeholder="Để trống nếu không giảm giá"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        className={`${!salePriceIsValid && watchedSalePrice ? "border-red-500" : ""}`}
                      />
                    )}
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

          {/* ── Thông số kỹ thuật (Specs Manager) ─────────────────────────────── */}
          <div className="space-y-3 p-4 bg-blue-50/40 border border-blue-100 rounded-xl">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-blue-800 font-semibold text-sm">
                <Hash className="w-4 h-4" />
                Thông số kỹ thuật
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSpecRow}
                className="h-7 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Thêm thông số
              </Button>
            </div>

            {specsList.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-2">
                Chưa có thông số kỹ thuật — thêm để AI tạo mô tả chính xác hơn
              </p>
            ) : (
              <div className="space-y-2">
                {specsList.map((row, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      placeholder="Tên thông số (VD: RAM)"
                      value={row.key}
                      onChange={(e) => updateSpecRow(idx, "key", e.target.value)}
                      className="flex-1 h-8 text-sm"
                    />
                    <Input
                      placeholder="Giá trị (VD: 8GB)"
                      value={row.value}
                      onChange={(e) => updateSpecRow(idx, "value", e.target.value)}
                      className="flex-1 h-8 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSpecRow(idx)}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Description + AI Button ──────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Mô tả sản phẩm</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={isGeneratingDesc}
                className="h-7 px-3 text-xs border-purple-300 text-purple-700 hover:bg-purple-50 gap-1.5"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingDesc ? "animate-spin" : ""}`} />
                {isGeneratingDesc ? "Đang tạo…" : "Viết mô tả bằng AI"}
              </Button>
            </div>
            <Textarea
              id="description"
              rows={6}
              {...register("description")}
              className={errors.description ? "border-red-500" : ""}
              placeholder="Nhập mô tả sản phẩm, hoặc nhấn 'Viết mô tả bằng AI' để tạo tự động…"
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
              Huỷ
            </Button>
            <Button type="submit" disabled={isLoading || isUploadingImage}>
              {isLoading ? 'Đang lưu…' : isUploadingImage ? 'Đang tải ảnh…' : 'Lưu sản phẩm'}
            </Button>
          </div>
        </form>
    </>
  );
}
