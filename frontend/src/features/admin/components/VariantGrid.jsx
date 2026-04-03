import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function cartesianProduct(arrays) {
  return arrays.reduce((acc, curr) => {
    if (!acc.length) return curr.map((x) => [x]);
    return acc.flatMap((a) => curr.map((c) => [...a, c]));
  }, []);
}

/**
 * attributes: [{ name, values: string[] }]
 * rows: [{ price, stock, imageUrl }] — length = số tổ hợp; do parent đồng bộ
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
      <Label className="text-base font-semibold">Biến thể ({combos.length} dòng)</Label>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tổ hợp</TableHead>
              <TableHead className="w-28">Giá (₫)</TableHead>
              <TableHead className="w-24">Tồn kho</TableHead>
              <TableHead>Ảnh (URL tùy chọn)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {labels.map((label, i) => (
              <TableRow key={`${label}-${i}`}>
                <TableCell className="font-medium text-sm max-w-[220px]">{label}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={rows[i]?.price ?? ''}
                    onChange={(e) => updateRow(i, 'price', Number(e.target.value))}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    value={rows[i]?.stock ?? ''}
                    onChange={(e) => updateRow(i, 'stock', parseInt(e.target.value, 10) || 0)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="https://..."
                    value={rows[i]?.imageUrl ?? ''}
                    onChange={(e) => updateRow(i, 'imageUrl', e.target.value)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
