import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import usePageTitle from '@/hooks/usePageTitle';
import {
  useSerials,
  useLookupSerial,
  useLowStockReport,
} from '@/features/admin/hooks/useInventory';
import { useAdminProducts } from '@/features/admin/hooks/useAdmin';
import { DataTable } from '@/features/admin/components/DataTable';
import { CustomPagination } from '@/features/admin/components/CustomPagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  Barcode,
  Search,
  AlertTriangle,
  Package,
  User,
  Truck,
  CreditCard,
  ShoppingBag,
  Calendar,
  ExternalLink,
  Warehouse,
} from 'lucide-react';

const STATUS_LABEL = {
  IN_STOCK: 'Trong kho',
  RESERVED: 'Giữ chỗ',
  SOLD: 'Đã bán',
  RETURNED: 'Hoàn trả',
};

const ORDER_STATUS_VI = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PACKING: 'Đóng gói',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
  RETURNED: 'Hoàn trả',
};

const PAYMENT_STATUS_VI = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
};

function paymentMethodLabel(m) {
  const map = { COD: 'Thanh toán khi nhận (COD)', STRIPE: 'Thẻ (Stripe)', SEPAY: 'Chuyển khoản (SePay)' };
  return map[m] ?? m ?? '—';
}

function parseShippingAddr(raw) {
  if (!raw) return null;
  try {
    return typeof raw === 'object' ? raw : JSON.parse(raw);
  } catch {
    return null;
  }
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('vi-VN');
  } catch {
    return '—';
  }
}

function fmtMoney(v) {
  if (v == null || v === '') return '—';
  return formatCurrency(Number(v));
}

/** Kết quả tra cứu serial — đủ thông tin kho / bán / đơn (kể cả đơn huỷ) */
function SerialLookupResult({ data }) {
  const order = data?.orderItem?.order;
  const oi = data?.orderItem;
  const ship = order ? parseShippingAddr(order.shippingAddress) : null;
  const customerName = ship?.fullName || order?.user?.name || '—';
  const customerPhone = ship?.phone || order?.user?.phone || '—';
  const customerEmail = order?.user?.email || '—';

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <Card className="min-w-0">
        <CardHeader className="border-b pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Barcode className="h-4 w-4 shrink-0" />
            Serial & trạng thái
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <div>
            <p className="text-[11px] uppercase text-muted-foreground">Mã serial / IMEI</p>
            <p className="font-mono text-base font-semibold tracking-tight">{data.serial}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase text-muted-foreground">Trạng thái kho</span>
            <Badge variant="outline">{STATUS_LABEL[data.status] || data.status}</Badge>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Tạo</dt>
              <dd>{fmtDate(data.createdAt)}</dd>
            </div>
            {data.reservedAt && (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Giữ chỗ</dt>
                <dd>{fmtDate(data.reservedAt)}</dd>
              </div>
            )}
            {data.soldAt && (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Bán</dt>
                <dd>{fmtDate(data.soldAt)}</dd>
              </div>
            )}
            {data.returnedAt && (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Hoàn trả</dt>
                <dd>{fmtDate(data.returnedAt)}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="border-b pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 shrink-0" />
            Sản phẩm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-4 text-sm">
          <div>
            <p className="text-[11px] uppercase text-muted-foreground">Tên</p>
            <p className="font-medium">{data.product?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-muted-foreground">SKU</p>
            <p className="font-mono text-sm">{data.variant?.sku ?? '—'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="border-b pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Warehouse className="h-4 w-4 shrink-0" />
            Nhập kho
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-4 text-sm">
          <div>
            <p className="text-[11px] uppercase text-muted-foreground">Nhà cung cấp</p>
            <p className="font-medium">{data.stockImport?.supplier?.name ?? '—'}</p>
          </div>
          {data.stockImport?.supplier?.phone && (
            <div>
              <p className="text-[11px] uppercase text-muted-foreground">SĐT NCC</p>
              <p>{data.stockImport.supplier.phone}</p>
            </div>
          )}
          <div>
            <p className="text-[11px] uppercase text-muted-foreground">Ngày nhập</p>
            <p>{fmtDate(data.stockImport?.importDate)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-muted-foreground">Đơn giá nhập</p>
            <p>{data.stockImport?.unitCost != null ? fmtMoney(data.stockImport.unitCost) : '—'}</p>
          </div>
          {data.stockImport?.notes && (
            <div>
              <p className="text-[11px] uppercase text-muted-foreground">Ghi chú phiếu</p>
              <p className="whitespace-pre-wrap break-words text-muted-foreground">{data.stockImport.notes}</p>
            </div>
          )}
          <div>
            <p className="text-[11px] uppercase text-muted-foreground">Người nhập</p>
            <p>{data.stockImport?.importedByUser?.name ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{data.stockImport?.importedByUser?.email ?? ''}</p>
          </div>
        </CardContent>
      </Card>

      {order && oi && (
        <>
          <Card className="min-w-0 lg:col-span-2 xl:col-span-2">
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="h-4 w-4 shrink-0" />
                Đơn hàng & khách mua
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 pt-4 sm:grid-cols-2">
              <div className="space-y-3 text-sm">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Khách hàng</p>
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">{customerName}</p>
                    <p className="text-muted-foreground">{customerEmail}</p>
                    <p className="text-muted-foreground">{customerPhone}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Đơn hàng</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-semibold">#{order.id.slice(-8).toUpperCase()}</span>
                  <Badge variant="secondary">
                    {ORDER_STATUS_VI[order.status] || order.status}
                  </Badge>
                  <Button variant="outline" size="sm" className="h-8" asChild>
                    <Link to={`/admin/orders?orderId=${order.id}`}>Mở chi tiết đơn</Link>
                  </Button>
                </div>
                <dl className="space-y-1.5">
                  <div className="flex justify-between gap-2">
                    <dt className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" /> Đặt lúc
                    </dt>
                    <dd>{fmtDate(order.createdAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Cập nhật</dt>
                    <dd>{fmtDate(order.updatedAt)}</dd>
                  </div>
                  {oi.assignedAt && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Gán serial</dt>
                      <dd>{fmtDate(oi.assignedAt)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 shrink-0" />
                Thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Phương thức</span>
                <span className="text-right font-medium">{paymentMethodLabel(order.paymentMethod)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">TT thanh toán</span>
                <Badge variant="outline" className="font-normal">
                  {PAYMENT_STATUS_VI[order.paymentStatus] || order.paymentStatus}
                </Badge>
              </div>
              <div className="flex justify-between gap-2 border-t pt-2">
                <span className="text-muted-foreground">Tổng đơn</span>
                <span className="font-semibold">{fmtMoney(order.totalAmount)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Giảm giá</span>
                  <span className="text-emerald-700">− {fmtMoney(order.discountAmount)}</span>
                </div>
              )}
              {order.coupon?.code && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Mã giảm</span>
                  <span className="font-mono text-xs">{order.coupon.code}</span>
                </div>
              )}
              <div className="border-t pt-2">
                <p className="mb-1 text-[11px] uppercase text-muted-foreground">Dòng hàng (serial này)</p>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Giá x SL</span>
                  <span>
                    {fmtMoney(oi.price)} × {oi.quantity}
                  </span>
                </div>
                <div className="mt-1 flex justify-between gap-2 font-semibold">
                  <span>Thành tiền dòng</span>
                  <span>{fmtMoney(Number(oi.price) * Number(oi.quantity))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4 shrink-0" />
                Giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4 text-sm">
              {ship && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed">
                  {ship.fullName && <p className="font-medium">{ship.fullName}</p>}
                  {ship.phone && <p className="text-muted-foreground">{ship.phone}</p>}
                  {ship.addressLine && <p>{ship.addressLine}</p>}
                  {(ship.ward || ship.city) && (
                    <p className="text-muted-foreground">
                      {[ship.ward, ship.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              )}
              {!ship && <p className="text-muted-foreground">Không có địa chỉ giao (JSON).</p>}
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Đơn vị VC</span>
                <span className="text-right">{order.carrierName || '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Mã vận đơn</span>
                <span className="font-mono text-right">{order.trackingCode || '—'}</span>
              </div>
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Theo dõi vận chuyển <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!order && (
        <Card className="border-dashed bg-muted/20 lg:col-span-2 xl:col-span-3">
          <CardContent className="py-6 text-sm text-muted-foreground">
            Serial chưa gắn đơn bán (hoặc chưa có thông tin đơn). Thông tin nhập kho và sản phẩm vẫn hiển thị cột
            bên trên.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AdminSerialsPage() {
  usePageTitle('Serial & IMEI | Quản trị');
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState(() => (searchParams.get('tab') === 'low' ? 'low' : 'list'));

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'low') queueMicrotask(() => setView('low'));
  }, [searchParams]);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [productId, setProductId] = useState('');
  const [search, setSearch] = useState('');
  const [lookupQ, setLookupQ] = useState('');
  const [lookupActive, setLookupActive] = useState('');

  const listParams = useMemo(
    () => ({
      page,
      limit: 30,
      status: status || undefined,
      productId: productId || undefined,
      search: search.trim() || undefined,
    }),
    [page, status, productId, search]
  );

  const { data: productsData } = useAdminProducts({ page: 1, limit: 300, sort: 'oldest' });
  const products = productsData?.products ?? [];

  const { data: serialsData, isLoading: loadingSerials } = useSerials(listParams);
  const { data: lowStockData, isLoading: loadingLow } = useLowStockReport();
  const { data: lookupData, isFetching: loadingLookup, isError: lookupErr } = useLookupSerial(lookupActive);
  const serials = serialsData?.serials ?? [];
  const pagination = serialsData?.pagination;
  const alerts = lowStockData?.alerts ?? [];

  const runLookup = () => {
    const q = lookupQ.trim();
    if (q.length < 3) {
      toast.error('Nhập ít nhất 3 ký tự');
      return;
    }
    setLookupActive(q);
  };

  const columns = [
    {
      accessorKey: 'serial',
      header: 'Serial / IMEI',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.serial}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <Badge variant="outline">{STATUS_LABEL[row.original.status] || row.original.status}</Badge>
      ),
    },
    {
      accessorKey: 'product',
      header: 'Sản phẩm',
      cell: ({ row }) => row.original.product?.name ?? '—',
    },
    {
      accessorKey: 'variant',
      header: 'SKU',
      cell: ({ row }) => row.original.variant?.sku ?? '—',
    },
    {
      accessorKey: 'supplier',
      header: 'NCC (phiếu nhập)',
      cell: ({ row }) => row.original.stockImport?.supplier?.name ?? '—',
    },
  ];

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Barcode className="h-8 w-8 shrink-0 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Serial & IMEI</h1>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        <Button
          variant={view === 'list' ? 'default' : 'ghost'}
          onClick={() => {
            setView('list');
            setSearchParams({});
          }}
        >
          Danh sách
        </Button>
        <Button
          variant={view === 'lookup' ? 'default' : 'ghost'}
          onClick={() => {
            setView('lookup');
            setSearchParams({});
          }}
        >
          Tra cứu
        </Button>
        <Button
          variant={view === 'low' ? 'default' : 'ghost'}
          onClick={() => {
            setView('low');
            setSearchParams({ tab: 'low' });
          }}
          className="gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Sắp hết hàng
        </Button>
      </div>

      {view === 'list' && (
        <>
          <div className="flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-0 flex-1 space-y-1 sm:max-w-xs">
              <Label>Tìm serial</Label>
              <Input
                placeholder="Chứa..."
                className="w-full min-w-0"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label>Trạng thái</Label>
              <Select
                value={status || 'all'}
                onValueChange={(v) => {
                  setStatus(v === 'all' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full min-w-0 sm:w-[220px]">
                  <SelectValue placeholder="Tất cả trạng thái">
                    {(v) => (v === 'all' || v == null || v === '' ? 'Tất cả' : STATUS_LABEL[v] ?? v)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="IN_STOCK">Trong kho</SelectItem>
                  <SelectItem value="RESERVED">Giữ chỗ</SelectItem>
                  <SelectItem value="SOLD">Đã bán</SelectItem>
                  <SelectItem value="RETURNED">Hoàn trả</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1 space-y-1 sm:max-w-md">
              <Label>Sản phẩm</Label>
              <Select
                value={productId || 'all'}
                onValueChange={(v) => {
                  setProductId(v === 'all' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-auto min-h-9 w-full min-w-0 py-2 [&_[data-slot=select-value]]:line-clamp-2 [&_[data-slot=select-value]]:whitespace-normal">
                  <SelectValue placeholder="Tất cả sản phẩm">
                    {(v) => {
                      if (v === 'all' || v == null || v === '') return 'Tất cả';
                      const p = products.find((x) => String(x.id) === String(v));
                      return p?.name ?? String(v);
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Tất cả</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingSerials ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="w-full min-w-0 overflow-x-auto rounded-md border bg-card">
              <DataTable columns={columns} data={serials} />
            </div>
          )}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-end">
              <CustomPagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {view === 'lookup' && (
        <div className="w-full min-w-0 space-y-6">
          <div className="flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:items-stretch">
            <Input
              placeholder="Nhập serial đầy đủ..."
              className="min-h-11 min-w-0 flex-1 text-base sm:text-sm"
              value={lookupQ}
              onChange={(e) => setLookupQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runLookup()}
            />
            <Button type="button" onClick={runLookup} className="h-11 shrink-0 gap-2 sm:h-auto">
              <Search className="h-4 w-4" />
              Tra cứu
            </Button>
          </div>
          {loadingLookup && <Skeleton className="h-48 w-full" />}
          {!loadingLookup && lookupErr && lookupActive && (
            <p className="text-sm text-destructive">Không tìm thấy serial.</p>
          )}
          {!loadingLookup && lookupData && !lookupErr && <SerialLookupResult data={lookupData} />}
        </div>
      )}

      {view === 'low' && (
        <div className="w-full min-w-0 space-y-4">
          {loadingLow ? (
            <Skeleton className="h-40 w-full" />
          ) : alerts.length === 0 ? (
            <p className="text-muted-foreground">Không có cảnh báo tồn kho thấp.</p>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium">Sản phẩm / SKU</th>
                    <th className="p-3 text-right font-medium">Số serial trong kho</th>
                    <th className="p-3 text-right font-medium">Ngưỡng cảnh báo</th>
                    <th className="p-3 text-right font-medium">Tồn tổng (hệ thống)</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a, i) => (
                    <tr key={`${a.productId}-${a.variantId || 'p'}-${i}`} className="border-t">
                      <td className="p-3">
                        <div className="font-medium">{a.productName}</div>
                        {a.sku && <div className="text-xs text-muted-foreground">{a.sku}</div>}
                      </td>
                      <td className="p-3 text-right font-semibold tabular-nums text-amber-700">
                        {a.inStockSerialCount}
                      </td>
                      <td className="p-3 text-right tabular-nums">{a.threshold}</td>
                      <td className="p-3 text-right tabular-nums">{a.aggregateStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
