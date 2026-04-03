import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import axiosInstance from '@/lib/axios';
import { newsCategoriesQueryOptions } from '@/features/news/api';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import usePageTitle from '@/hooks/usePageTitle';
import { ArrowLeft, Loader2, Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const columnHelper = createColumnHelper();

export default function AdminNewsCategoriesPage() {
  usePageTitle('Danh mục tin | Admin');
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading } = useQuery(newsCategoriesQueryOptions());

  const [renameOpen, setRenameOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['news', 'categories'] });
  };

  const createMut = useMutation({
    mutationFn: (name) => axiosInstance.post('/categories', { name }),
    onSuccess: () => {
      invalidate();
      toast.success('Đã thêm danh mục');
      setCreateOpen(false);
      setCreateName('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Không thể tạo'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, name }) => axiosInstance.patch(`/categories/${id}`, { name }),
    onSuccess: () => {
      invalidate();
      toast.success('Đã cập nhật');
      setRenameOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Không thể đổi tên'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => axiosInstance.delete(`/categories/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success('Đã xóa');
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || 'Không thể xóa (còn bài viết?)'),
  });

  const columns = [
    columnHelper.accessor('name', {
      header: 'Tên',
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
    }),
    columnHelper.accessor('slug', {
      header: 'Slug',
      cell: ({ getValue }) => <code className="text-xs bg-muted px-1 rounded">{getValue()}</code>,
    }),
    columnHelper.accessor((row) => row._count?.posts ?? 0, {
      id: 'count',
      header: 'Số bài',
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => {
              setEditing(row.original);
              setRenameValue(row.original.name);
              setRenameOpen(true);
            }}
          >
            <Pencil size={14} className="mr-1" />
            Đổi tên
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-destructive" disabled={row.original._count?.posts > 0}>
                <Trash2 size={14} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa danh mục?</AlertDialogTitle>
                <AlertDialogDescription>
                  Chỉ xóa được khi không còn bài viết nào thuộc danh mục.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMut.mutate(row.original.id)}>Xóa</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    }),
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/news">
              <ArrowLeft size={18} className="mr-1" />
              Tin tức
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Danh mục tin</h1>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={18} className="mr-2" />
          Thêm danh mục
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-apple-blue" size={32} />
        </div>
      ) : (
        <DataTable columns={columns} data={categories} />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm danh mục</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="newcat">Tên</Label>
            <Input
              id="newcat"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Ví dụ: Đánh giá"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (createName.trim().length < 2) {
                  toast.error('Tên quá ngắn');
                  return;
                }
                createMut.mutate(createName.trim());
              }}
              disabled={createMut.isPending}
            >
              {createMut.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi tên danh mục</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename">Tên mới</Label>
            <Input
              id="rename"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (!editing || renameValue.trim().length < 2) return;
                updateMut.mutate({ id: editing.id, name: renameValue.trim() });
              }}
              disabled={updateMut.isPending}
            >
              {updateMut.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
