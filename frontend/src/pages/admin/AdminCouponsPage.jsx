import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminCreateCoupon, adminListCoupons, adminDeleteCoupon, adminToggleCoupon } from '@/api/coupon.api';
import { DataTable } from '@/features/admin/components/DataTable';
import usePageTitle from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2, ToggleLeft, ToggleRight, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Zod Schema (mirror backend) ─────────────────────────────────────────────

const createCouponSchema = z.object({
  code: z.string().min(1, 'Bắt buộc').max(50).trim(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT'], { required_error: 'Bắt buộc' }),
  value: z.coerce.number({ invalid_type_error: 'Phải là số' }).positive('Phải > 0'),
  minOrderAmount: z.coerce.number({ invalid_type_error: 'Phải là số' }).nonnegative('Không được âm'),
  maxUsage: z.coerce.number({ invalid_type_error: 'Phải là số' }).int().min(1, 'Tối thiểu 1'),
  expiresAt: z.string().min(1, 'Bắt buộc'),
  maxDiscountAmount: z.coerce
    .number({ invalid_type_error: 'Phải là số' })
    .positive('Phải > 0')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' || v === undefined ? undefined : v)),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatValue = (type, value) => {
  if (type === 'PERCENTAGE') return `${value}%`;
  return `${Number(value).toLocaleString('vi-VN')}đ`;
};

const formatDate = (dateStr) => {
  try {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};

const isDatePast = (dateStr) => new Date(dateStr) < new Date();

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1">{message}</p>;
}

function ToggleButton({ coupon, onToggle, isLoading }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('gap-1.5 text-xs', coupon.isActive ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground')}
      onClick={() => onToggle(coupon.id)}
      disabled={isLoading}
      title={coupon.isActive ? 'Tắt mã' : 'Bật mã'}
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : coupon.isActive ? (
        <ToggleRight size={16} />
      ) : (
        <ToggleLeft size={16} />
      )}
      {coupon.isActive ? 'Đang bật' : 'Đã tắt'}
    </Button>
  );
}

function DeleteButton({ coupon, onDelete, isLoading }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" title="Xóa mã">
          <Trash2 size={15} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa mã giảm giá?</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn sắp xóa mã{' '}
            <span className="font-mono font-bold text-foreground">{coupon.code}</span>. Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onDelete(coupon.id)}
            className="bg-destructive hover:bg-destructive/90"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdminCouponsPage = () => {
  usePageTitle('Mã giảm giá | Admin');
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState(null);

  // ─── Query: danh sách ───────────────────────────────────────────────────────
  const { data, isLoading: isLoadingList } = useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: adminListCoupons,
    select: (res) => res.coupons ?? [],
  });

  const coupons = data ?? [];

  // ─── Mutation: tạo mã ───────────────────────────────────────────────────────
  const { mutate: createCoupon, isPending: isCreating } = useMutation({
    mutationFn: adminCreateCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      reset();
      setFormError(null);
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Tạo mã thất bại.');
    },
  });

  // ─── Mutation: toggle ───────────────────────────────────────────────────────
  const [togglingId, setTogglingId] = useState(null);
  const { mutate: toggleCoupon } = useMutation({
    mutationFn: adminToggleCoupon,
    onMutate: (id) => setTogglingId(id),
    onSettled: () => {
      setTogglingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });

  // ─── Mutation: xóa ─────────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState(null);
  const { mutate: deleteCoupon } = useMutation({
    mutationFn: adminDeleteCoupon,
    onMutate: (id) => setDeletingId(id),
    onSettled: () => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });

  // ─── Form ───────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createCouponSchema),
    defaultValues: {
      code: '',
      type: 'PERCENTAGE',
      value: '',
      minOrderAmount: '',
      maxUsage: '',
      expiresAt: '',
      maxDiscountAmount: '',
    },
  });

  const watchType = watch('type');

  const onSubmit = (formData) => {
    setFormError(null);
    // Chuẩn bị payload — convert expiresAt thành ISO string
    const payload = {
      ...formData,
      code: formData.code.toUpperCase(),
      expiresAt: new Date(formData.expiresAt).toISOString(),
    };
    if (!payload.maxDiscountAmount) delete payload.maxDiscountAmount;
    createCoupon(payload);
  };

  // ─── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-sm tracking-wider">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Loại',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs font-medium">
          {row.original.type === 'PERCENTAGE' ? '% Phần trăm' : 'Số tiền cố định'}
        </Badge>
      ),
    },
    {
      accessorKey: 'value',
      header: 'Giá trị',
      cell: ({ row }) => (
        <span className="font-semibold text-primary">
          {formatValue(row.original.type, row.original.value)}
        </span>
      ),
    },
    {
      accessorKey: 'minOrderAmount',
      header: 'Đơn tối thiểu',
      cell: ({ row }) => (
        <span className="text-sm">{Number(row.original.minOrderAmount).toLocaleString('vi-VN')}đ</span>
      ),
    },
    {
      id: 'usage',
      header: 'Đã dùng / Tổng',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          <span className={cn('font-bold', row.original.usedCount >= row.original.maxUsage ? 'text-destructive' : 'text-foreground')}>
            {row.original.usedCount}
          </span>
          <span className="text-muted-foreground">/{row.original.maxUsage}</span>
        </span>
      ),
    },
    {
      accessorKey: 'expiresAt',
      header: 'Hết hạn',
      cell: ({ row }) => {
        const expired = isDatePast(row.original.expiresAt);
        return (
          <span className={cn('text-sm font-medium', expired ? 'text-destructive' : 'text-foreground')}>
            {formatDate(row.original.expiresAt)}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <ToggleButton
          coupon={row.original}
          onToggle={toggleCoupon}
          isLoading={togglingId === row.original.id}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Hành động',
      cell: ({ row }) => (
        <DeleteButton
          coupon={row.original}
          onDelete={deleteCoupon}
          isLoading={deletingId === row.original.id}
        />
      ),
    },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Tag className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Mã giảm giá</h1>
      </div>

      {/* ─── Form tạo mã ──────────────────────────────────────────────────── */}
      <div className="bg-card border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-5">Tạo mã mới</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Code */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coupon-code">Mã giảm giá *</Label>
            <Input
              id="coupon-code"
              placeholder="VD: SUMMER20"
              {...register('code')}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                register('code').onChange(e);
              }}
              className="font-mono tracking-widest uppercase"
            />
            <FieldError message={errors.code?.message} />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coupon-type">Loại giảm giá *</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="coupon-type">
                    <SelectValue placeholder="Chọn loại">
                      {field.value === 'PERCENTAGE' ? '% Phần trăm' : field.value === 'FIXED_AMOUNT' ? 'Số tiền cố định (đ)' : ''}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">% Phần trăm</SelectItem>
                    <SelectItem value="FIXED_AMOUNT">Số tiền cố định (đ)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.type?.message} />
          </div>

          {/* Value */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coupon-value">
              Giá trị * {watchType === 'PERCENTAGE' ? '(%)' : '(đồng)'}
            </Label>
            <Input id="coupon-value" type="number" min="0.01" step="0.01" placeholder={watchType === 'PERCENTAGE' ? 'VD: 10' : 'VD: 50000'} {...register('value')} />
            <FieldError message={errors.value?.message} />
          </div>

          {/* maxDiscountAmount — chỉ hiện khi PERCENTAGE */}
          {watchType === 'PERCENTAGE' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="coupon-max-discount">Giảm tối đa (đ) — tuỳ chọn</Label>
              <Input id="coupon-max-discount" type="number" min="1" placeholder="VD: 100000" {...register('maxDiscountAmount')} />
              <FieldError message={errors.maxDiscountAmount?.message} />
            </div>
          )}

          {/* minOrderAmount */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coupon-min-order">Đơn tối thiểu (đ) *</Label>
            <Input id="coupon-min-order" type="number" min="0" placeholder="VD: 200000" {...register('minOrderAmount')} />
            <FieldError message={errors.minOrderAmount?.message} />
          </div>

          {/* maxUsage */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coupon-max-usage">Số lượt dùng tối đa *</Label>
            <Input id="coupon-max-usage" type="number" min="1" placeholder="VD: 100" {...register('maxUsage')} />
            <FieldError message={errors.maxUsage?.message} />
          </div>

          {/* expiresAt */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coupon-expires">Ngày hết hạn *</Label>
            <Input
              id="coupon-expires"
              type="datetime-local"
              min={new Date().toISOString().slice(0, 16)}
              {...register('expiresAt')}
            />
            <FieldError message={errors.expiresAt?.message} />
          </div>

          {/* Server error */}
          {formError && (
            <div className="sm:col-span-2 xl:col-span-3">
              <p className="text-sm text-destructive">{formError}</p>
            </div>
          )}

          {/* Submit */}
          <div className="sm:col-span-2 xl:col-span-3 flex justify-end pt-2">
            <Button type="submit" disabled={isCreating} className="min-w-[140px]">
              {isCreating ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Tạo mã giảm giá
            </Button>
          </div>
        </form>
      </div>

      {/* ─── Bảng danh sách ──────────────────────────────────────────────── */}
      <div className="bg-card border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Danh sách mã{' '}
          <span className="text-muted-foreground font-normal text-base">({coupons.length})</span>
        </h2>
        {isLoadingList ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" /> Đang tải...
          </div>
        ) : (
          <DataTable columns={columns} data={coupons} />
        )}
      </div>
    </div>
  );
};

export default AdminCouponsPage;
