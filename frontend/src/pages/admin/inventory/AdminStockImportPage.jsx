import { useMemo, useState } from 'react';
import usePageTitle from '@/hooks/usePageTitle';
import { useSuppliers, useStockImports, useCreateStockImport, useStockImport } from '@/features/admin/hooks/useInventory';
import { useAdminProducts, useProductVariants } from '@/features/admin/hooks/useAdmin';
import { DataTable } from '@/features/admin/components/DataTable';
import { CustomPagination } from '@/features/admin/components/CustomPagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VndCurrencyInput } from '@/components/ui/vnd-currency-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/lib/toast';
import { ClipboardList, PackagePlus } from 'lucide-react';
import { formatAdminVariantLabel } from '@/utils/adminVariantLabel';

export default function AdminStockImportPage() {
  usePageTitle('Nhập kho | Quản trị');
  const [tab, setTab] = useState('new');
  const [page, setPage] = useState(1);
  const listParams = useMemo(() => ({ page, limit: 15 }), [page]);

  const { data: suppliersData } = useSuppliers({ limit: 200 });
  const { data: importsData, isLoading: loadingImports } = useStockImports(listParams);
  const { data: productsData } = useAdminProducts({ page: 1, limit: 200, sort: 'oldest' });

  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [serialsText, setSerialsText] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');

  const { data: variants } = useProductVariants(productId);

  const suppliers = suppliersData?.suppliers ?? [];
  const stockImports = importsData?.stockImports ?? [];
  const pagination = importsData?.pagination;
  const products = productsData?.products ?? [];

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );

  const supplierLabel = useMemo(
    () => (supplierId ? suppliers.find((s) => s.id === supplierId)?.name : null),
    [supplierId, suppliers]
  );
  const productLabel = useMemo(
    () => (productId ? products.find((p) => p.id === productId)?.name : null),
    [productId, products]
  );
  const variantLabel = useMemo(() => {
    if (!variantId || !variants?.length) return null;
    const v = variants.find((x) => x.id === variantId);
    return v ? formatAdminVariantLabel(v) : null;
  }, [variantId, variants]);

  const { mutate: createImport, isPending: isCreating } = useCreateStockImport();

  const [detailId, setDetailId] = useState(null);
  const { data: detail, isLoading: loadingDetail } = useStockImport(detailId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!supplierId || !productId) {
      toast.error('Chọn nhà cung cấp và sản phẩm');
      return;
    }
    const serials = serialsText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (serials.length === 0) {
      toast.error('Nhập ít nhất một serial (mỗi dòng một mã)');
      return;
    }
    const needsVariant = selectedProduct?.hasVariants;
    if (needsVariant && !variantId) {
      toast.error('Chọn biến thể sản phẩm');
      return;
    }
    const body = {
      supplierId,
      productId,
      serials,
      variantId: needsVariant ? variantId : null,
      unitCost: unitCost === '' ? null : Number(unitCost),
      notes: notes.trim() || null,
    };
    createImport(body, {
      onSuccess: () => {
        toast.success('Đã tạo phiếu nhập kho');
        setSerialsText('');
        setUnitCost('');
        setNotes('');
        setTab('history');
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Lỗi nhập kho'),
    });
  };

  const columns = [
    {
      accessorKey: 'importDate',
      header: 'Ngày',
      cell: ({ row }) => new Date(row.original.importDate).toLocaleString('vi-VN'),
    },
    {
      accessorKey: 'supplier',
      header: 'NCC',
      cell: ({ row }) => row.original.supplier?.name ?? '—',
    },
    {
      accessorKey: 'product',
      header: 'Sản phẩm',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.product?.name}</div>
          {row.original.variant?.sku && (
            <div className="text-xs text-muted-foreground">{row.original.variant.sku}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'totalUnits',
      header: 'SL',
      cell: ({ row }) => row.original.totalUnits,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button type="button" variant="outline" size="sm" onClick={() => setDetailId(row.original.id)}>
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Nhập kho</h1>
      </div>

      <div className="flex gap-2 border-b pb-2">
        <Button variant={tab === 'new' ? 'default' : 'ghost'} onClick={() => setTab('new')} className="gap-2">
          <PackagePlus className="w-4 h-4" />
          Nhập kho mới
        </Button>
        <Button variant={tab === 'history' ? 'default' : 'ghost'} onClick={() => setTab('history')}>
          Lịch sử nhập kho
        </Button>
      </div>

      {tab === 'new' && (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-full space-y-4 bg-card border rounded-xl p-6 md:p-8"
        >
          <div className="space-y-2">
            <Label>Nhà cung cấp</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="w-full min-w-0 max-w-full">
                <SelectValue placeholder="Chọn nhà cung cấp">{supplierLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sản phẩm</Label>
            <Select
              value={productId}
              onValueChange={(v) => {
                setProductId(v);
                setVariantId('');
              }}
            >
              <SelectTrigger className="w-full min-w-0 max-w-full">
                <SelectValue placeholder="Chọn sản phẩm">{productLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedProduct?.hasVariants && (
            <div className="space-y-2">
              <Label>Biến thể (mã SKU &amp; thuộc tính)</Label>
              <Select value={variantId} onValueChange={setVariantId}>
                <SelectTrigger className="w-full min-w-0 max-w-full h-auto min-h-9 py-2 [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:whitespace-normal">
                  <SelectValue placeholder="Chọn biến thể">{variantLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent className="max-w-[min(100vw-2rem,42rem)]">
                  {(variants || []).map((v) => {
                    const label = formatAdminVariantLabel(v);
                    return (
                      <SelectItem key={v.id} value={v.id} className="items-start py-2">
                        <span className="whitespace-normal text-left leading-snug">{label}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Danh sách serial / IMEI (mỗi dòng một mã)</Label>
            <Textarea
              rows={8}
              className="font-mono text-sm"
              value={serialsText}
              onChange={(e) => setSerialsText(e.target.value)}
              placeholder="IMEI-001&#10;IMEI-002"
            />
          </div>
          <div className="space-y-2">
            <Label>Đơn giá nhập (tuỳ chọn)</Label>
            <VndCurrencyInput
              value={unitCost === '' ? '' : Number(unitCost)}
              onChange={(n) => setUnitCost(n === '' ? '' : n)}
            />
          </div>
          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? 'Đang xử lý...' : 'Tạo phiếu nhập'}
          </Button>
        </form>
      )}

      {tab === 'history' && (
        <>
          {loadingImports ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <DataTable columns={columns} data={stockImports} />
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

      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết phiếu nhập</DialogTitle>
          </DialogHeader>
          {loadingDetail || !detail ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="space-y-4 text-sm">
              <p>
                <span className="text-muted-foreground">NCC:</span> {detail.supplier?.name}
              </p>
              <p>
                <span className="text-muted-foreground">Sản phẩm:</span> {detail.product?.name}
              </p>
              {detail.variant && (
                <p>
                  <span className="text-muted-foreground">SKU:</span> {detail.variant.sku}
                </p>
              )}
              <p>
                <span className="text-muted-foreground">Tổng:</span> {detail.totalUnits} serial
              </p>
              <div>
                <p className="font-medium mb-2">Serial</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 font-mono text-xs max-h-60 overflow-y-auto border rounded-md p-2">
                  {(detail.serialUnits || []).map((u) => (
                    <span key={u.id}>{u.serial}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
