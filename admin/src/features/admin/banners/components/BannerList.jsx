import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

function formatRange(start, end) {
  const fmt = (iso) => {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return '—';
    }
  };
  if (!start && !end) return 'Luôn hiển thị';
  return `${fmt(start)} → ${fmt(end)}`;
}

export function BannerList({ banners, isLoading, onEdit, onDelete, onToggleActive, togglePendingId }) {
  const [deleteId, setDeleteId] = useState(null);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Đang tải…</p>;
  }

  if (!banners?.length) {
    return <p className="text-sm text-muted-foreground">Chưa có banner nào.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b text-left">
              <th className="p-3 font-medium">Ảnh</th>
              <th className="p-3 font-medium">Tiêu đề</th>
              <th className="p-3 font-medium">Trạng thái</th>
              <th className="p-3 font-medium">Hiệu lực</th>
              <th className="p-3 font-medium">Thứ tự</th>
              <th className="p-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((b) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="p-2">
                  <div className="h-12 w-20 overflow-hidden rounded-md border bg-muted">
                    <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                </td>
                <td className="max-w-[200px] p-3">
                  <div className="font-medium leading-tight">{b.title}</div>
                  {b.subtitle ? <div className="text-xs text-muted-foreground line-clamp-1">{b.subtitle}</div> : null}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={b.isActive}
                      disabled={togglePendingId === b.id}
                      onCheckedChange={() => onToggleActive(b.id)}
                    />
                    <Badge variant={b.isActive ? 'default' : 'secondary'} className={cn(!b.isActive && 'opacity-80')}>
                      {b.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </td>
                <td className="whitespace-nowrap p-3 text-xs text-muted-foreground">
                  {formatRange(b.startDate, b.endDate)}
                </td>
                <td className="p-3 tabular-nums">{b.order}</td>
                <td className="p-3 text-right">
                  <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(b)} title="Sửa">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteId(b.id)} title="Xóa">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa banner?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) onDelete(deleteId);
                setDeleteId(null);
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
