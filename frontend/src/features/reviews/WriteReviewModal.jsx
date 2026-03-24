import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import StarPicker from './StarPicker';
import { AlertCircle, X } from 'lucide-react';

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const schema = z.object({
  rating: z
    .number({ invalid_type_error: 'Vui lòng chọn số sao.' })
    .int()
    .min(1, 'Vui lòng chọn số sao.')
    .max(5, 'Số sao tối đa là 5.'),
  comment: z.string().max(1000, 'Tối đa 1000 ký tự.').optional().default(''),
});

const MAX_COMMENT = 1000;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * WriteReviewModal
 *
 * Props:
 *   open         — boolean
 *   onOpenChange — (open: boolean) => void
 *   item         — { orderItemId, productId, productName, productImage } | null
 *   orderId      — string (dùng để invalidate query reviewable-items)
 */
const WriteReviewModal = ({ open, onOpenChange, item, orderId }) => {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { rating: 0, comment: '' },
  });

  const commentValue = watch('comment') ?? '';

  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: async ({ rating, comment }) => {
      const { data } = await axiosInstance.post('/reviews', {
        orderItemId: item.orderItemId,
        rating,
        comment: comment || undefined,
      });
      return data;
    },
    onSuccess: () => {
      onOpenChange(false);
      reset();
      setServerError('');
      toast.success('Đánh giá của bạn đã được gửi!');
      // Cập nhật lại reviewable-items (hasReviewed)
      queryClient.invalidateQueries({ queryKey: ['reviewable-items', orderId] });
      // Cập nhật lại danh sách reviews trên product detail
      if (item?.productId) {
        queryClient.invalidateQueries({ queryKey: ['product-reviews', item.productId] });
      }
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Có lỗi xảy ra. Vui lòng thử lại.';
      setServerError(msg);
    },
  });

  const onSubmit = (values) => {
    setServerError('');
    submitReview(values);
  };

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) {
      reset();
      setServerError('');
    }
    onOpenChange(nextOpen);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-3xl max-w-md p-0 overflow-hidden gap-0">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogTitle className="text-lg font-bold text-apple-dark tracking-tight">
            Viết đánh giá
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-5 space-y-5">

            {/* Product info */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
              {item.productImage ? (
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gray-200 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-semibold text-apple-dark text-sm line-clamp-2 leading-snug">
                  {item.productName}
                </p>
              </div>
            </div>

            {/* Star picker */}
            <div>
              <p className="text-sm font-semibold text-apple-dark mb-2">
                Mức độ hài lòng <span className="text-red-500">*</span>
              </p>
              <Controller
                name="rating"
                control={control}
                render={({ field }) => (
                  <StarPicker
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
              {errors.rating && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.rating.message}
                </p>
              )}
            </div>

            {/* Comment textarea */}
            <div>
              <p className="text-sm font-semibold text-apple-dark mb-2">
                Nhận xét{' '}
                <span className="text-apple-secondary font-normal">(không bắt buộc)</span>
              </p>
              <Textarea
                {...register('comment')}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                maxLength={MAX_COMMENT}
                rows={4}
                disabled={isPending}
                className="rounded-xl resize-none text-sm border-gray-200 focus:border-blue-400"
              />
              <div className="flex justify-between mt-1">
                {errors.comment ? (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.comment.message}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-apple-secondary">
                  {commentValue.length}/{MAX_COMMENT}
                </span>
              </div>
            </div>

            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 pb-8 border-t border-gray-100 flex flex-row gap-3 justify-end">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="rounded-full px-8 h-10 font-medium border-gray-200 text-sm"
                disabled={isPending}
              >
                Huỷ
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="rounded-full px-8 h-10 font-semibold text-sm bg-apple-blue hover:bg-apple-blue/90 shadow-sm"
              disabled={isPending || watch('rating') === 0}
            >
              {isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WriteReviewModal;
