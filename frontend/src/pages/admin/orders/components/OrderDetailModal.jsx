import React, { useState } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import { useAdminOrderDetail, useCancelOrder } from '@/features/admin/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  Loader2,
  Package,
  User,
  MapPin,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  AlertCircle,
  ShoppingCart,
  Tag,
  X,
  Copy,
  Receipt,
  AlertTriangle,
  FilePlus,
  Rocket
} from 'lucide-react';
import { format } from 'date-fns';
import axiosInstance from '@/lib/axios';
import { VariantOptionBadges } from '@/components/product/VariantOptionBadges';
import { formatCouponRuleDescription } from '@/utils/couponDisplay';

// ─── Status configs ────────────────────────────────────────────────────────────

const ORDER_STATUS = {
  PENDING:    { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   label: 'Chờ xử lý' },
  PROCESSING: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    label: 'Đang xử lý' },
  SHIPPED:    { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  label: 'Đang giao' },
  DELIVERED:  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Đã giao' },
  CANCELLED:  { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     label: 'Đã hủy' },
};

const PAYMENT_STATUS = {
  PENDING:  { bg: 'bg-amber-50',  text: 'text-amber-700',   border: 'border-amber-200',   label: 'Chờ TT' },
  PAID:     { bg: 'bg-emerald-50',text: 'text-emerald-700', border: 'border-emerald-200', label: 'Đã TT' },
  UNPAID:   { bg: 'bg-rose-50',   text: 'text-rose-700',    border: 'border-rose-200',    label: 'Chưa TT' },
  FAILED:   { bg: 'bg-red-50',    text: 'text-red-700',     border: 'border-red-200',     label: 'Thất bại' },
  REFUNDED: { bg: 'bg-gray-100',  text: 'text-gray-700',    border: 'border-gray-200',    label: 'Hoàn tiền' },
};

const Pill = ({ status, map }) => {
  const c = map[status] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', label: status || '—' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseAddress = (raw) => {
  if (!raw) return null;
  try { return typeof raw === 'object' ? raw : JSON.parse(raw); }
  catch { return { address: String(raw) }; }
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const LoadingSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="grid grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
    </div>
    <Skeleton className="h-52 rounded-lg" />
    <Skeleton className="h-28 rounded-lg" />
  </div>
);

// ─── Confirm cancel AlertDialog ───────────────────────────────────────────────

const CancelConfirmDialog = ({ open, onOpenChange, orderNum, onConfirm, isPending }) => (
  <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
      <AlertDialogPrimitive.Popup className="fixed inset-0 z-[60] flex items-center justify-center p-4 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
        <div className="bg-background rounded-2xl shadow-2xl ring-1 ring-black/8 w-full max-w-sm p-6 space-y-5">

          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          {/* Title + description */}
          <div className="text-center space-y-2">
            <AlertDialogPrimitive.Title className="text-lg font-bold text-foreground">
              Xác nhận hủy đơn hàng
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="text-sm text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn hủy đơn hàng{' '}
              <span className="font-mono font-bold text-foreground">
                #ORD-{orderNum}
              </span>
              {' '}không? Hành động này không thể hoàn tác.
            </AlertDialogPrimitive.Description>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <AlertDialogPrimitive.Close
              render={<Button variant="outline" className="flex-1" />}
              disabled={isPending}
            >
              Không, giữ lại
            </AlertDialogPrimitive.Close>

            <Button
              variant="destructive"
              className="flex-1 gap-2"
              onClick={onConfirm}
              disabled={isPending}
            >
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Đang hủy…</>
              ) : (
                'Có, hủy đơn'
              )}
            </Button>
          </div>
        </div>
      </AlertDialogPrimitive.Popup>
    </AlertDialogPrimitive.Portal>
  </AlertDialogPrimitive.Root>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────

const OrderDetailModal = ({ orderId, open, onClose }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const { data: order, isLoading, isError, refetch } = useAdminOrderDetail(orderId);
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();

  const handleConfirmCancel = () => {
    if (!orderId) return;
    cancelOrder(orderId, {
      onSuccess: () => {
        setShowConfirm(false);
        toast.success('Đã hủy đơn hàng thành công');
        onClose();
      },
      onError: (err) => {
        setShowConfirm(false);
        toast.error(err.response?.data?.message || 'Không thể hủy đơn hàng');
      },
    });
  };

  const handleCreateInvoice = async () => {
    try {
      await axiosInstance.post(`/admin/orders/${orderId}/invoice`, {});
      toast.success('Đã tạo hóa đơn nháp thành công');
      refetch();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Có lỗi khi tạo hóa đơn');
    }
  };

  const handleIssueInvoice = async (invoiceId) => {
    try {
      await axiosInstance.patch(`/admin/invoices/${invoiceId}/issue`);
      toast.success('Phát hành hóa đơn thành công');
      refetch();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Có lỗi khi phát hành');
    }
  };

  const addr      = order ? parseAddress(order.shippingAddress) : null;
  const subtotal  = order?.orderItems?.reduce((s, i) => s + Number(i.price) * i.quantity, 0) ?? 0;
  const canCancel = order?.status === 'PENDING' || order?.status === 'PROCESSING';
  const orderNum  = orderId ? orderId.slice(-8).toUpperCase() : '---';

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogPrimitive.Portal>

          {/* Backdrop */}
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />

          {/* Panel */}
          <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative bg-background rounded-2xl shadow-2xl ring-1 ring-black/8 flex flex-col w-full max-w-[780px] max-h-[90vh] overflow-hidden">

              {/* ── Header ─────────────────────────────────────────────── */}
              <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Chi tiết đơn hàng</p>
                    <p className="text-base font-bold font-mono tracking-wide text-foreground flex items-center gap-2">
                      #ORD-{orderNum}
                      <button
                        type="button"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Copy ID"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (orderId) {
                            navigator.clipboard.writeText(orderId.toUpperCase());
                            toast.success(`Đã copy mã: ${orderId.toUpperCase()}`);
                          }
                        }}
                      >
                        <Copy size={16} />
                      </button>
                    </p>
                  </div>
                </div>
                <DialogPrimitive.Close
                  aria-label="Đóng"
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </DialogPrimitive.Close>
              </div>

              {/* ── Scrollable body ────────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto">

                {isLoading && <LoadingSkeleton />}

                {isError && (
                  <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                      <AlertCircle className="h-7 w-7 text-red-500" />
                    </div>
                    <div>
                      <p className="font-semibold">Không thể tải đơn hàng</p>
                      <p className="text-muted-foreground text-sm">Có lỗi xảy ra, vui lòng thử lại.</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => refetch()}>Thử lại</Button>
                  </div>
                )}

                {!isLoading && !isError && order && (
                  <div className="p-6 space-y-6">

                    {/* ── 1. Meta ────────────────────────────────────── */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                        <span className="h-px flex-1 bg-border" /> Thông tin đơn hàng <span className="h-px flex-1 bg-border" />
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-xl border bg-muted/30 p-3.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
                            <Calendar className="h-3 w-3" /> Ngày đặt
                          </p>
                          <p className="text-sm font-bold">
                            {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.createdAt ? format(new Date(order.createdAt), 'HH:mm') : ''}
                          </p>
                        </div>
                        <div className="rounded-xl border bg-muted/30 p-3.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
                            <CreditCard className="h-3 w-3" /> Thanh toán
                          </p>
                          <p className="text-sm font-bold">{order.paymentMethod || '—'}</p>
                        </div>
                        <div className="rounded-xl border bg-muted/30 p-3.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                            Trạng thái đơn
                          </p>
                          <Pill status={order.status} map={ORDER_STATUS} />
                        </div>
                        <div className="rounded-xl border bg-muted/30 p-3.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                            Thanh toán
                          </p>
                          <Pill status={order.paymentStatus || 'PENDING'} map={PAYMENT_STATUS} />
                        </div>
                      </div>
                    </div>

                    {/* ── 1.5. Invoice ────────────────────────────────────── */}
                    {order.invoice && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                          <span className="h-px flex-1 bg-border" /> Hóa đơn VAT <span className="h-px flex-1 bg-border" />
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border bg-muted/20 p-4 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                              <Receipt className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">
                                {order.invoice.invoiceNumber}
                                <span className={`ml-2 inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700`}>
                                  {order.invoice.status === 'ISSUED' ? 'Đã phát hành' : 'Bản nháp'}
                                </span>
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                {order.invoice.emailSentAt ? (
                                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                    <Mail className="h-3 w-3" /> Đã đính kèm PDF qua email
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                                    <Mail className="h-3 w-3" /> Chưa gửi PDF qua email
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                            {order.invoice.status === 'DRAFT' && (
                              <Button 
                                variant="default" 
                                size="sm"
                                className="w-full sm:w-auto gap-2"
                                onClick={() => handleIssueInvoice(order.invoice.id)}
                              >
                                <Rocket className="h-4 w-4" />
                                Phát hành
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full sm:w-auto gap-2"
                              onClick={() => window.open(`${import.meta.env.VITE_API_URL}/admin/invoices/${order.invoice.id}/pdf`, '_blank')}
                            >
                              <Receipt className="h-4 w-4" />
                              Tải PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── 1.6 Chưa có Invoice ───────────────────────── */}
                    {!order.invoice && (
                      <div>
                         <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                          <span className="h-px flex-1 bg-border" /> Hóa đơn VAT <span className="h-px flex-1 bg-border" />
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-between rounded-xl border border-dashed p-4 gap-4">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                               <Receipt className="h-5 w-5 text-gray-400" />
                             </div>
                             <div>
                                <p className="font-semibold text-sm text-muted-foreground">Chưa có hóa đơn</p>
                                {order.vatInvoiceRequested && (
                                  <p className="text-xs text-amber-600 font-medium">Khách hàng có yêu cầu xuất VAT</p>
                                )}
                             </div>
                           </div>
                           <Button size="sm" variant="outline" className="gap-2" onClick={handleCreateInvoice}>
                             <FilePlus className="h-4 w-4" />
                             Tạo Hóa Đơn Thủ Công
                           </Button>
                        </div>
                      </div>
                    )}

                    {/* ── 2. Customer & Address ──────────────────────── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-xl border p-4 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                          <User className="h-3 w-3" /> Khách hàng
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                            {order.user?.name?.charAt(0)?.toUpperCase() || 'G'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{order.user?.name || 'Guest'}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{order.user?.email || '—'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border p-4 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" /> Địa chỉ giao hàng
                        </p>
                        {addr ? (
                          <div className="space-y-1.5 text-sm">
                            {addr.fullName && <p className="font-semibold">{addr.fullName}</p>}
                            {addr.phone && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Phone className="h-3 w-3 shrink-0" /><span>{addr.phone}</span>
                              </div>
                            )}
                            <div className="flex items-start gap-1.5 text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                              <span className="leading-snug">
                                {[addr.address, addr.ward, addr.district, addr.city].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Không có địa chỉ</p>
                        )}
                      </div>
                    </div>

                    {/* ── 3. Items ───────────────────────────────────── */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                        <ShoppingCart className="h-3 w-3" />
                        Sản phẩm ({order.orderItems?.length ?? 0})
                      </p>
                      <div className="rounded-xl border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                              <th className="text-left px-4 py-2.5 font-medium">Sản phẩm</th>
                              <th className="text-center px-3 py-2.5 font-medium w-14">SL</th>
                              <th className="text-right px-4 py-2.5 font-medium w-28">Đơn giá</th>
                              <th className="text-right px-4 py-2.5 font-medium w-32">Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {order.orderItems?.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="text-center py-10 text-muted-foreground">
                                  Không có sản phẩm
                                </td>
                              </tr>
                            ) : (
                              order.orderItems?.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      {item.product?.images?.[0]?.url ? (
                                        <img
                                          src={item.product.images[0].url}
                                          alt={item.product?.name}
                                          className="w-12 h-12 object-cover rounded-lg border shrink-0"
                                        />
                                      ) : (
                                        <div className="w-12 h-12 rounded-lg bg-muted border flex items-center justify-center shrink-0">
                                          <Package className="h-5 w-5 text-muted-foreground/50" />
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <p className="font-medium line-clamp-2 leading-snug">
                                          {item.product?.name || 'Sản phẩm đã xóa'}
                                        </p>
                                        {item.variantOptions?.length ? (
                                          <VariantOptionBadges options={item.variantOptions} className="mt-1" />
                                        ) : item.variantSummary ? (
                                          <p className="text-xs text-muted-foreground mt-1">Loại: {item.variantSummary}</p>
                                        ) : null}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-center font-medium">{item.quantity}</td>
                                  <td className="px-4 py-3 text-right">
                                    {(item.discountPercent ?? 0) > 0 && item.originalPrice != null ? (
                                      <div className="flex flex-col items-end gap-0.5">
                                        <span className="font-medium text-red-600">{formatCurrency(item.price)}</span>
                                        <span className="text-xs line-through text-muted-foreground">{formatCurrency(item.originalPrice)}</span>
                                      </div>
                                    ) : (
                                      <span className="font-medium text-primary">{formatCurrency(item.price)}</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(Number(item.price) * item.quantity)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* ── 4. Summary ─────────────────────────────────── */}
                    <div className="flex justify-end">
                      <div className="w-full max-w-xs rounded-xl border bg-muted/20 p-4 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                          Tổng kết
                        </p>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tiền hàng</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Phí vận chuyển</span>
                          <span>{formatCurrency(order.shippingFee || 0)}</span>
                        </div>
                        {order.discountAmount > 0 && (
                          <div className="flex justify-between gap-3 text-sm text-emerald-600">
                            <div className="min-w-0">
                              <span className="flex flex-wrap items-center gap-1.5">
                                <Tag className="h-3 w-3 shrink-0" />
                                Giảm giá
                                {order.coupon?.code && (
                                  <code className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 rounded text-[10px] font-bold">
                                    {order.coupon.code}
                                  </code>
                                )}
                              </span>
                              {order.coupon && (
                                <p className="text-xs text-emerald-800/90 font-normal mt-1 leading-snug">
                                  {formatCouponRuleDescription(order.coupon)}
                                </p>
                              )}
                            </div>
                            <span className="font-semibold shrink-0">−{formatCurrency(order.discountAmount)}</span>
                          </div>
                        )}
                        <div className="border-t pt-2.5 mt-1 flex justify-between items-center">
                          <span className="font-semibold text-sm">Tổng cộng</span>
                          <span className="font-bold text-base text-primary">{formatCurrency(order.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* ── Footer ─────────────────────────────────────────────── */}
              <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t bg-muted/20">
                <DialogPrimitive.Close
                  render={<Button variant="outline" />}
                >
                  Quay lại
                </DialogPrimitive.Close>

                {order && canCancel && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowConfirm(true)}
                    disabled={isCancelling}
                    className="gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Hủy đơn hàng
                  </Button>
                )}
              </div>

            </div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* ── Confirm AlertDialog (z-index cao hơn Dialog) ── */}
      <CancelConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        orderNum={orderNum}
        onConfirm={handleConfirmCancel}
        isPending={isCancelling}
      />
    </>
  );
};

export default OrderDetailModal;
