import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Trash2 } from 'lucide-react';

function LogoThumb({ url }) {
  if (!url) {
    return (
      <div className="flex h-10 w-16 items-center justify-center rounded border bg-muted text-[10px] text-muted-foreground">
        —
      </div>
    );
  }
  return (
    <div className="flex h-10 w-16 items-center justify-center rounded border bg-white p-1">
      <img src={url} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
    </div>
  );
}

export function BrandList({ brands, isLoading, onEdit, onDelete, deletePendingId }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!brands.length) {
    return <p className="text-sm text-muted-foreground">Chưa có thương hiệu nào.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[88px]">Logo</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead className="hidden md:table-cell">Slug</TableHead>
            <TableHead className="hidden lg:table-cell w-24">Carousel</TableHead>
            <TableHead className="hidden sm:table-cell w-20 text-center">SP</TableHead>
            <TableHead className="w-[120px] text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brands.map((b) => (
            <TableRow key={b.id}>
              <TableCell>
                <LogoThumb url={b.logo} />
              </TableCell>
              <TableCell className="font-medium">{b.name}</TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{b.slug}</TableCell>
              <TableCell className="hidden lg:table-cell text-sm">
                {b.carouselOrder != null ? b.carouselOrder : '—'}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-center text-sm">
                {b._count?.products ?? 0}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(b)} aria-label="Sửa">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    disabled={deletePendingId === b.id}
                    onClick={() => onDelete(b)}
                    aria-label="Xoá"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
