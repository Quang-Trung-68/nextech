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
import { Switch } from '@/components/ui/switch';
import { BannerImageUpload } from './BannerImageUpload';
import { Loader2 } from 'lucide-react';

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Màu dạng #RRGGBB');

const bannerFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Bắt buộc').max(100),
    subtitle: z.string().trim().max(200).optional().or(z.literal('')),
    imageUrl: z.string().url('URL ảnh không hợp lệ').min(1, 'Cần ảnh banner'),
    linkUrl: z
      .string()
      .min(1, 'Bắt buộc')
      .refine((s) => s.startsWith('/') || /^https?:\/\//i.test(s), {
        message: 'Đường dẫn nội bộ hoặc URL đầy đủ',
      }),
    bgColor: hex,
    textColor: hex,
    order: z.coerce.number().int().min(0).max(9999),
    isActive: z.boolean(),
    startDate: z.string().optional().or(z.literal('')),
    endDate: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate) {
      const a = new Date(data.startDate);
      const b = new Date(data.endDate);
      if (b <= a) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ngày kết thúc phải sau ngày bắt đầu', path: ['endDate'] });
      }
    }
  });

function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildFormData(values) {
  const fd = new FormData();
  fd.append('title', values.title);
  fd.append('subtitle', values.subtitle || '');
  fd.append('imageUrl', values.imageUrl);
  fd.append('linkUrl', values.linkUrl);
  fd.append('bgColor', values.bgColor);
  fd.append('textColor', values.textColor);
  fd.append('order', String(values.order));
  fd.append('isActive', values.isActive ? 'true' : 'false');
  if (values.startDate) fd.append('startDate', new Date(values.startDate).toISOString());
  if (values.endDate) fd.append('endDate', new Date(values.endDate).toISOString());
  return fd;
}

export function BannerForm({ open, onOpenChange, banner, onSubmit, isSubmitting }) {
  const [serverError, setServerError] = useState('');
  const isEdit = Boolean(banner?.id);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      imageUrl: '',
      linkUrl: '',
      bgColor: '#f5f5f7',
      textColor: '#1d1d1f',
      order: 0,
      isActive: true,
      startDate: '',
      endDate: '',
    },
  });

  const bg = watch('bgColor');
  const fg = watch('textColor');
  const titleW = watch('title');
  const subW = watch('subtitle');

  useEffect(() => {
    if (!open) return;
    setServerError('');
    if (banner) {
      reset({
        title: banner.title ?? '',
        subtitle: banner.subtitle ?? '',
        imageUrl: banner.imageUrl ?? '',
        linkUrl: banner.linkUrl ?? '',
        bgColor: banner.bgColor || '#f5f5f7',
        textColor: banner.textColor || '#1d1d1f',
        order: banner.order ?? 0,
        isActive: banner.isActive !== false,
        startDate: toDatetimeLocal(banner.startDate),
        endDate: toDatetimeLocal(banner.endDate),
      });
    } else {
      reset({
        title: '',
        subtitle: '',
        imageUrl: '',
        linkUrl: '',
        bgColor: '#f5f5f7',
        textColor: '#1d1d1f',
        order: 0,
        isActive: true,
        startDate: '',
        endDate: '',
      });
    }
  }, [open, banner, reset]);

  const onValid = async (values) => {
    setServerError('');
    try {
      const fd = buildFormData(values);
      await onSubmit({ formData: fd, isEdit, id: banner?.id });
      onOpenChange(false);
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        (Array.isArray(e.response?.data?.errors) && e.response.data.errors.map((x) => x.message).join(' ')) ||
        e.message ||
        'Có lỗi xảy ra';
      setServerError(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[min(100vw-1rem,56rem)] max-w-none flex-col gap-0 overflow-y-auto p-6 sm:max-w-[56rem] md:max-w-4xl lg:max-w-5xl">
        <DialogHeader className="pb-2 text-left">
          <DialogTitle className="text-xl md:text-2xl">{isEdit ? 'Sửa banner' : 'Thêm banner'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onValid)} className="space-y-5">
          {serverError ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="banner-title">Tiêu đề</Label>
            <Input id="banner-title" className="h-11 text-base" {...register('title')} />
            {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner-subtitle">Mô tả phụ</Label>
            <Input id="banner-subtitle" className="h-11 text-base" {...register('subtitle')} />
            {errors.subtitle ? <p className="text-sm text-destructive">{errors.subtitle.message}</p> : null}
          </div>

          <Controller
            name="imageUrl"
            control={control}
            render={({ field }) => (
              <BannerImageUpload
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
                error={errors.imageUrl?.message}
              />
            )}
          />

          <div className="space-y-2">
            <Label htmlFor="banner-link">Đường dẫn khi click</Label>
            <Input id="banner-link" className="h-11 font-mono text-sm" placeholder="/phone hoặc https://..." {...register('linkUrl')} />
            {errors.linkUrl ? <p className="text-sm text-destructive">{errors.linkUrl.message}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Màu nền</Label>
              <Controller
                name="bgColor"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="h-10 w-14 cursor-pointer rounded border p-1"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                    <Input className="font-mono text-sm" value={field.value} onChange={(e) => field.onChange(e.target.value)} />
                  </div>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Màu chữ</Label>
              <Controller
                name="textColor"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="h-10 w-14 cursor-pointer rounded border p-1"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                    <Input className="font-mono text-sm" value={field.value} onChange={(e) => field.onChange(e.target.value)} />
                  </div>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner-order">Thứ tự hiển thị</Label>
            <Input id="banner-order" type="number" min={0} {...register('order')} />
            {errors.order ? <p className="text-sm text-destructive">{errors.order.message}</p> : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="banner-start">Ngày bắt đầu (tuỳ chọn)</Label>
              <Input id="banner-start" type="datetime-local" {...register('startDate')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner-end">Ngày kết thúc (tuỳ chọn)</Label>
              <Input id="banner-end" type="datetime-local" {...register('endDate')} />
            </div>
          </div>
          {errors.endDate ? <p className="text-sm text-destructive">{errors.endDate.message}</p> : null}

          <div className="flex items-center gap-2">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} id="banner-active" />
              )}
            />
            <Label htmlFor="banner-active">Đang hoạt động</Label>
          </div>

          <div
            className="rounded-xl border p-5 md:p-6"
            style={{ backgroundColor: bg || '#f5f5f7', color: fg || '#1d1d1f' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Xem trước</p>
            <p className="mt-2 text-xl font-bold leading-tight md:text-2xl">{titleW || 'Tiêu đề'}</p>
            {subW ? <p className="mt-2 text-base opacity-90 md:text-lg">{subW}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span className={isSubmitting ? 'ml-2' : ''}>{isEdit ? 'Cập nhật' : 'Tạo mới'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
