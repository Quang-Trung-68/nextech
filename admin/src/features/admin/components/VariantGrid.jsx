import { Fragment, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { VndCurrencyInput } from '@/components/ui/vnd-currency-input';
import { Label } from '@/components/ui/label';

export function cartesianProduct(arrays) {
  return arrays.reduce((acc, curr) => {
    if (!acc.length) return curr.map((x) => [x]);
    return acc.flatMap((a) => curr.map((c) => [...a, c]));
  }, []);
}

/**
 * attributes: [{ name, values: string[] }]
 * rows: [{ price, stock, imageUrl, salePrice?, saleExpiresAt?, saleStock? }]
 */
export function VariantGrid({ attributes, rows, onChangeRows }) {
  const combos = useMemo(() => {
    const arrs = attributes.map((a) => a.values.filter(Boolean));
    if (arrs.length === 0 || arrs.some((a) => a.length === 0)) return [];
    return cartesianProduct(arrs);
  }, [attributes]);

  const labels = useMemo(
    () => combos.map((combo) => combo.join(' / ')),
    [combos]
  );

  const updateRow = (i, field, value) => {
    const next = [...rows];
    next[i] = { ...next[i], [field]: value };
    onChangeRows(next);
  };

  if (combos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Điền đủ thuộc tính và giá trị để sinh biến thể.
      </p>
    );
  }

  if (rows.length !== combos.length) {
    return (
      <p className="text-sm text-amber-600 py-2">
        Đang đồng bộ biến thể… (vui lòng chờ hoặc kiểm tra thuộc tính)
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="space-y-1">
        <Label className="text-base font-semibold">Biến thể ({combos.length} dòng)</Label>
        <p className="text-xs text-muted-foreground">
          Flash sale chung (áp theo tỉ lệ cho mọi biến thể): cấu hình ở mục Flash Sale của sản phẩm. Bảng dưới dùng cho
          giảm giá riêng từng biến thể (ưu tiên hơn flash sale chung).
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">Tổ hợp</TableHead>
              <TableHead className="min-w-[150px]">Giá gốc (₫)</TableHead>
              <TableHead className="min-w-[100px]">Tồn kho</TableHead>
              <TableHead className="min-w-[180px]">Ảnh (URL tùy chọn)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {labels.map((label, i) => (
              <Fragment key={`${label}-${i}`}>
                <TableRow>
                  <TableCell className="font-medium text-sm max-w-[220px] align-top">{label}</TableCell>
                  <TableCell className="align-top min-w-[150px]">
                    <VndCurrencyInput
                      value={rows[i]?.price ?? ''}
                      onChange={(n) =>
                        updateRow(i, 'price', n === '' ? 0 : Number(n))
                      }
                    />
                  </TableCell>
                  <TableCell className="align-top min-w-[100px]">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={rows[i]?.stock ?? ''}
                      onChange={(e) => updateRow(i, 'stock', parseInt(e.target.value, 10) || 0)}
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    <Input
                      placeholder="https://..."
                      value={rows[i]?.imageUrl ?? ''}
                      onChange={(e) => updateRow(i, 'imageUrl', e.target.value)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow className="bg-muted/25 border-0">
                  <TableCell className="text-xs text-muted-foreground py-2 align-top">
                    Giá sale riêng
                  </TableCell>
                  <TableCell className="py-2 align-top">
                    <VndCurrencyInput
                      placeholder="Tùy chọn"
                      value={rows[i]?.salePrice ?? ''}
                      onChange={(n) =>
                        updateRow(i, 'salePrice', n === '' ? '' : Number(n))
                      }
                    />
                  </TableCell>
                  <TableCell className="py-2 align-top" colSpan={2}>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 min-w-[160px]">
                        <span className="text-[10px] uppercase text-muted-foreground block mb-0.5">Hết hạn sale</span>
                        <Input
                          type="datetime-local"
                          value={rows[i]?.saleExpiresAt ?? ''}
                          onChange={(e) => updateRow(i, 'saleExpiresAt', e.target.value)}
                        />
                      </div>
                      <div className="w-full sm:w-28">
                        <span className="text-[10px] uppercase text-muted-foreground block mb-0.5">Suất sale</span>
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="∞"
                          value={rows[i]?.saleStock ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateRow(i, 'saleStock', v === '' ? '' : parseInt(v, 10) || 0);
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
