import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BrandLogoUpload } from './BrandLogoUpload';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const brandFormSchema = z.object({
  name: z.string().trim().min(1, 'Bắt buộc').max(120),
  slug: z.string().trim().max(100).optional().or(z.literal('')),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  logo: z
    .string()
    .optional()
    .refine((s) => !s || /^https?:\/\//i.test(s), { message: 'URL logo không hợp lệ' }),
  websiteUrl: z
    .string()
    .optional()
    .refine((s) => !s || /^https?:\/\//i.test(s), { message: 'URL website không hợp lệ' }),
  carouselOrder: z.union([z.string(), z.number()]).optional(),
  carouselCategorySlug: z.string().optional().or(z.literal('')),
});

function buildFormData(values, isEdit) {
  const fd = new FormData();
  fd.append('name', values.name);
  if (values.slug?.trim()) fd.append('slug', values.slug.trim());
  fd.append('description', values.description || '');
  if (isEdit) {
    fd.append('logo', values.logo?.trim() || '');
  } else if (values.logo?.trim()) {
    fd.append('logo', values.logo.trim());
  }
  fd.append('websiteUrl', values.websiteUrl?.trim() || '');
  const co = values.carouselOrder;
  fd.append(
    'carouselOrder',
    co === '' || co === undefined || co === null ? '' : String(co)
  );
  fd.append('carouselCategorySlug', values.carouselCategorySlug || '');
  return fd;
}

export function BrandForm({ open, onOpenChange, brand, onSubmit, isSubmitting }) {
  const [serverError, setServerError] = useState('');
  const isEdit = Boolean(brand?.id);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      logo: '',
      websiteUrl: '',
      carouselOrder: '',
      carouselCategorySlug: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setServerError('');
      if (brand) {
        reset({
          name: brand.name ?? '',
          slug: brand.slug ?? '',
          description: brand.description ?? '',
          logo: brand.logo ?? '',
          websiteUrl: brand.websiteUrl ?? '',
          carouselOrder:
            brand.carouselOrder != null && brand.carouselOrder !== '' ? String(brand.carouselOrder) : '',
          carouselCategorySlug: brand.carouselCategorySlug ?? '',
        });
      } else {
        reset({
          name: '',
          slug: '',
          description: '',
          logo: '',
          websiteUrl: '',
          carouselOrder: '',
          carouselCategorySlug: '',
        });
      }
    });
  }, [open, brand, reset]);

  const submit = handleSubmit(async (values) => {
    setServerError('');
    try {
      const fd = buildFormData(values, isEdit);
      await onSubmit({ formData: fd, isEdit, id: brand?.id });
      onOpenChange(false);
    } catch (e) {
      const msg = e.response?.data?.message;
      const mapped = Array.isArray(e.response?.data?.errors)
        ? e.response.data.errors.map((x) => x.message || x).join(', ')
        : null;
      setServerError(msg || mapped || e.message || 'Có lỗi xảy ra');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa thương hiệu' : 'Thêm thương hiệu'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand-name">Tên *</Label>
            <Input id="brand-name" {...register('name')} placeholder="VD: Samsung" />
            {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-slug">Slug (tuỳ chọn)</Label>
            <Input id="brand-slug" {...register('slug')} placeholder="Để trống để tự tạo từ tên" />
            <p className="text-xs text-muted-foreground">Dùng trong URL lọc sản phẩm (?brand=...)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-desc">Mô tả</Label>
            <Textarea id="brand-desc" {...register('description')} rows={2} placeholder="Ngắn gọn" />
          </div>

          <Controller
            name="logo"
            control={control}
            render={({ field }) => (
              <BrandLogoUpload
                value={field.value}
                onChange={(url) => field.onChange(url)}
                disabled={isSubmitting}
                error={errors.logo?.message}
              />
            )}
          />

          <div className="space-y-2">
            <Label htmlFor="brand-web">Website (tuỳ chọn)</Label>
            <Input
              id="brand-web"
              {...register('websiteUrl')}
              type="url"
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              Nếu có, carousel trang chủ mở tab mới thay vì link nội bộ.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brand-order">Thứ tự carousel</Label>
              <Input
                id="brand-order"
                type="number"
                min={0}
                placeholder="Để trống = không ưu tiên"
                {...register('carouselOrder')}
              />
              <p className="text-xs text-muted-foreground">Số nhỏ đứng trước. Trống = không vào carousel (khi đã seed thứ tự).</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-cat">Danh mục link nội bộ</Label>
              <select
                id="brand-cat"
                {...register('carouselCategorySlug')}
                className={cn(
                  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                )}
              >
                <option value="">— Không chọn —</option>
                <option value="phone">Điện thoại</option>
                <option value="laptop">Laptop</option>
                <option value="tablet">Máy tính bảng</option>
                <option value="accessories">Phụ kiện</option>
              </select>
            </div>
          </div>

          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
