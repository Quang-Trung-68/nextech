import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import axiosInstance from '@/lib/axios';
import { adminNewsListQueryOptions } from '@/features/news/api';
import { DataTable } from '@/features/admin/components/DataTable';
import { CustomPagination } from '@/features/admin/components/CustomPagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import usePageTitle from '@/hooks/usePageTitle';
import { Loader2, Pencil, CalendarClock, Archive, Rocket, Plus } from 'lucide-react';
import { toast } from 'sonner';

const LIMIT = 10;

const STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'PUBLISHED', label: 'Đã đăng' },
  { value: 'SCHEDULED', label: 'Đã lên lịch' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
];

function statusBadge(status) {
  const map = {
    DRAFT: { label: 'Nháp', className: 'bg-muted text-muted-foreground' },
    PUBLISHED: { label: 'Đã đăng', className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
    SCHEDULED: { label: 'Lên lịch', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
    ARCHIVED: { label: 'Lưu trữ', className: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200' },
  };
  const x = map[status] || map.DRAFT;
  return <Badge className={cn('font-normal', x.className)}>{x.label}</Badge>;
}

function formatDt(iso) {
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
}

const columnHelper = createColumnHelper();

export default function AdminNewsPage() {
  usePageTitle('Tin tức | Admin');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const statusFilter = searchParams.get('status') || '';

  const params = useMemo(
    () => ({
      page,
      limit: LIMIT,
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
    [page, statusFilter]
  );

  const { data, isLoading } = useQuery(adminNewsListQueryOptions(params));

  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
  };

  const publishMut = useMutation({
    mutationFn: (id) => axiosInstance.patch(`/admin/posts/${id}/publish`),
    onSuccess: () => {
      toast.success('Đã xuất bản');
      invalidate();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Thất bại'),
  });

  const archiveMut = useMutation({
    mutationFn: (id) => axiosInstance.patch(`/admin/posts/${id}/archive`),
    onSuccess: () => {
      toast.success('Đã chuyển vào lưu trữ');
      invalidate();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Thất bại'),
  });

  const setStatusTab = (value) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (value) p.set('status', value);
      else p.delete('status');
      p.set('page', '1');
      return p;
    }, { replace: true });
  };

  const onPageChange = (next) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('page', String(next));
      return p;
    }, { replace: true });
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'thumb',
        header: 'Ảnh',
        cell: ({ row }) => (
          <div className="w-14 h-10 rounded overflow-hidden bg-muted shrink-0">
            {row.original.coverImage ? (
              <img src={row.original.coverImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">—</div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('title', {
        header: 'Tiêu đề',
        cell: ({ getValue }) => <span className="font-medium line-clamp-2 max-w-[220px]">{getValue()}</span>,
      }),
      columnHelper.accessor((row) => row.category?.name ?? '—', {
        id: 'category',
        header: 'Danh mục',
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        cell: ({ getValue }) => statusBadge(getValue()),
      }),
      columnHelper.display({
        id: 'tags',
        header: 'Tags',
        cell: ({ row }) => {
          const tags = row.original.tags?.map((t) => t.tag?.name).filter(Boolean) ?? [];
          return (
            <span className="text-xs text-muted-foreground line-clamp-2 max-w-[140px]">
              {tags.length ? tags.join(', ') : '—'}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'dates',
        header: 'Thời gian',
        cell: ({ row }) => (
          <div className="text-xs whitespace-nowrap">
            {row.original.status === 'SCHEDULED' && row.original.scheduledAt ? (
              <span>Lịch: {formatDt(row.original.scheduledAt)}</span>
            ) : (
              <span>Đăng: {formatDt(row.original.publishedAt)}</span>
            )}
          </div>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const post = row.original;
          const canPublish = post.status === 'DRAFT' || post.status === 'SCHEDULED';
          return (
            <div className="flex flex-wrap gap-1 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-2.5"
                onClick={() => navigate(`/admin/news/${post.id}/edit`)}
              >
                <Pencil size={14} />
                Sửa
              </Button>
              {canPublish && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-8"
                  disabled={publishMut.isPending}
                  onClick={() => publishMut.mutate(post.id)}
                >
                  <Rocket size={14} className="mr-1" />
                  Xuất bản
                </Button>
              )}
              {post.status !== 'ARCHIVED' && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8"
                  disabled={archiveMut.isPending}
                  onClick={() => archiveMut.mutate(post.id)}
                >
                  <Archive size={14} className="mr-1" />
                  Lưu trữ
                </Button>
              )}
            </div>
          );
        },
      }),
    ],
    [publishMut, archiveMut, navigate]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tin tức</h1>
          <p className="text-muted-foreground text-sm">Quản lý bài viết và lịch đăng</p>
        </div>
        <Button
          type="button"
          className="inline-flex items-center gap-2"
          onClick={() => navigate('/admin/news/create')}
        >
          <Plus size={18} />
          Viết bài mới
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            type="button"
            onClick={() => setStatusTab(tab.value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm transition-colors',
              (statusFilter || '') === tab.value
                ? 'bg-apple-blue text-white'
                : 'bg-muted/60 hover:bg-muted text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-apple-blue" size={32} />
        </div>
      ) : (
        <>
          <DataTable columns={columns} data={items} />
          {totalPages > 1 && (
            <CustomPagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
          )}
        </>
      )}

      <p className="text-sm text-muted-foreground">
        <CalendarClock size={14} className="inline mr-1" />
        Bài <strong>Lên lịch</strong> sẽ tự đăng khi đến giờ (job mỗi phút).
      </p>
    </div>
  );
}
