import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { newsCategoriesQueryOptions, newsTagsQueryOptions, adminNewsDetailQueryOptions } from '@/features/news/api';
import { NewsEditor } from '@/features/news/components/NewsEditor';
import { TagInput } from '@/features/news/components/TagInput';
import { newsArticleFormSchema } from '@/features/news/schemas/newsSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import usePageTitle from '@/hooks/usePageTitle';
import { Loader2, ArrowLeft, Save, Rocket, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

function slugPreview(title) {
  if (!title || title.length < 2) return '';
  const base = String(title)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return base ? `${base}-xxxx` : '';
}

export default function AdminNewsFormPage() {
  const { id: paramId } = useParams();
  const isCreate = paramId == null;
  const postId = isCreate ? null : Number(paramId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');

  const { data: categories = [] } = useQuery(newsCategoriesQueryOptions());
  const { data: allTags = [] } = useQuery(newsTagsQueryOptions());
  const { data: existing, isLoading: loadingPost } = useQuery({
    ...adminNewsDetailQueryOptions(postId),
    enabled: !isCreate && Number.isFinite(postId),
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(newsArticleFormSchema),
    defaultValues: {
      title: '',
      categoryId: '',
      content: '<p></p>',
      excerpt: '',
      tagSelection: { selectedIds: [], newNames: [] },
      coverImageUrl: '',
      scheduledAt: '',
    },
  });

  const titleWatch = watch('title');

  useEffect(() => {
    if (!existing || isCreate) return;
    reset({
      title: existing.title,
      categoryId: existing.categoryId ?? '',
      content: existing.content || '<p></p>',
      excerpt: existing.excerpt || '',
      tagSelection: {
        selectedIds: existing.tags?.map((t) => t.tag?.id).filter(Boolean) ?? [],
        newNames: [],
      },
      coverImageUrl: existing.coverImage || '',
      scheduledAt: '',
    });
    setCoverPreview(existing.coverImage || '');
  }, [existing, isCreate, reset]);

  usePageTitle(isCreate ? 'Viết bài mới | Admin' : 'Sửa bài | Admin');

  const uploadCover = async (file) => {
    const fd = new FormData();
    fd.append('coverImage', file);
    const { data } = await axiosInstance.post('/admin/posts/upload-cover', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data?.url;
  };

  const createMut = useMutation({
    mutationFn: (payload) => axiosInstance.post('/admin/posts', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi tạo bài'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => axiosInstance.patch(`/admin/posts/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'news', 'detail', postId] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi cập nhật'),
  });

  const publishMut = useMutation({
    mutationFn: (id) => axiosInstance.patch(`/admin/posts/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
      toast.success('Đã xuất bản');
      navigate('/admin/news');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Không thể xuất bản'),
  });

  const scheduleMut = useMutation({
    mutationFn: ({ id, scheduledAt }) =>
      axiosInstance.patch(`/admin/posts/${id}/schedule`, { scheduledAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
      toast.success('Đã lên lịch');
      setScheduleOpen(false);
      navigate('/admin/news');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Không thể lên lịch'),
  });

  const buildPayload = async (values, status, scheduledIso = null) => {
    let coverUrl = values.coverImageUrl || '';
    if (coverFile) {
      coverUrl = await uploadCover(coverFile);
    }
    const sel = values.tagSelection || { selectedIds: [], newNames: [] };
    const payload = {
      title: values.title,
      content: values.content,
      excerpt: values.excerpt || undefined,
      categoryId: values.categoryId,
      tagIds: sel.selectedIds || [],
      newTagNames: sel.newNames || [],
      coverImageUrl: coverUrl || undefined,
      status,
      ...(status === 'SCHEDULED' && scheduledIso ? { scheduledAt: scheduledIso } : {}),
    };
    return payload;
  };

  const buildUpdatePayload = async (values) => {
    const sel = values.tagSelection || { selectedIds: [], newNames: [] };
    const base = {
      title: values.title,
      content: values.content,
      excerpt: values.excerpt || undefined,
      categoryId: values.categoryId,
      tagIds: sel.selectedIds || [],
      newTagNames: sel.newNames || [],
      coverImageUrl: values.coverImageUrl || undefined,
    };
    if (coverFile) {
      base.coverImageUrl = await uploadCover(coverFile);
    }
    return base;
  };

  const onSaveDraft = handleSubmit(async (values) => {
    if (isCreate) {
      const payload = await buildPayload(values, 'DRAFT');
      const res = await createMut.mutateAsync(payload);
      const newId = res.data?.data?.post?.id;
      toast.success('Đã tạo bài nháp');
      if (newId) navigate(`/admin/news/${newId}/edit`);
      else navigate('/admin/news');
    } else {
      const payload = await buildUpdatePayload(values);
      await updateMut.mutateAsync({ id: postId, payload });
      toast.success('Đã lưu');
    }
  });

  const onPublish = handleSubmit(async (values) => {
    if (isCreate) {
      const payload = await buildPayload(values, 'PUBLISHED');
      await createMut.mutateAsync(payload);
      toast.success('Đã xuất bản');
      navigate('/admin/news');
    } else {
      const payload = await buildUpdatePayload(values);
      await updateMut.mutateAsync({ id: postId, payload });
      await publishMut.mutateAsync(postId);
    }
  });

  const submitSchedule = handleSubmit(async (values) => {
    if (!scheduleAt) {
      toast.error('Chọn ngày giờ');
      return;
    }
    const iso = new Date(scheduleAt).toISOString();
    if (isCreate) {
      const payload = await buildPayload(values, 'SCHEDULED', iso);
      await createMut.mutateAsync(payload);
      toast.success('Đã lên lịch');
      setScheduleOpen(false);
      navigate('/admin/news');
    } else {
      const payload = await buildUpdatePayload(values);
      await updateMut.mutateAsync({ id: postId, payload });
      await scheduleMut.mutateAsync({ id: postId, scheduledAt: iso });
    }
  });

  if (!isCreate && loadingPost) {
    return (
      <div className="p-6 flex justify-center py-24">
        <Loader2 className="animate-spin text-apple-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/news">
            <ArrowLeft size={18} className="mr-1" />
            Danh sách
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{isCreate ? 'Viết bài mới' : 'Sửa bài'}</h1>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Tiêu đề *</Label>
          <Input id="title" {...register('title')} className="mt-1" />
          {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            URL gợi ý: <span className="font-mono">{slugPreview(titleWatch) || '…'}</span>
          </p>
        </div>

        <div>
          <Label>Danh mục *</Label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => {
              const selectedName =
                field.value != null && field.value !== ''
                  ? categories.find((c) => Number(c.id) === Number(field.value))?.name
                  : null;
              return (
                <Select
                  key={categories.map((c) => c.id).join(',')}
                  value={field.value != null && field.value !== '' ? String(field.value) : ''}
                  onValueChange={(v) => field.onChange(v === '' ? undefined : Number(v))}
                >
                  <SelectTrigger className="mt-1 w-full min-w-0">
                    <SelectValue placeholder="Chọn danh mục">
                      {selectedName ?? undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          />
          {errors.categoryId && (
            <p className="text-xs text-destructive mt-1">{errors.categoryId.message}</p>
          )}
        </div>

        <div>
          <Label>Tags</Label>
          <Controller
            name="tagSelection"
            control={control}
            render={({ field }) => (
              <div className="mt-2">
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  allTags={allTags}
                  placeholder="Gõ để tìm hoặc tạo tag mới…"
                />
              </div>
            )}
          />
          {errors.tagSelection && (
            <p className="text-xs text-destructive mt-1">
              {errors.tagSelection.message || errors.tagSelection?.newNames?.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="excerpt">Mô tả ngắn</Label>
          <Textarea
            id="excerpt"
            {...register('excerpt')}
            className="mt-1 min-h-[80px]"
            maxLength={300}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {(watch('excerpt') || '').length}/300
          </p>
        </div>

        <div>
          <Label>Ảnh bìa</Label>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-1"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setCoverFile(f || null);
              if (f) setCoverPreview(URL.createObjectURL(f));
            }}
          />
          {(coverPreview || watch('coverImageUrl')) && (
            <img
              src={coverPreview || watch('coverImageUrl')}
              alt=""
              className="mt-2 max-h-48 rounded-md border object-cover"
            />
          )}
        </div>

        <div>
          <Label>Nội dung *</Label>
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <NewsEditor
                value={field.value}
                onChange={field.onChange}
                className="mt-2"
              />
            )}
          />
          {errors.content && (
            <p className="text-xs text-destructive mt-1">{errors.content.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onSaveDraft}
          disabled={isSubmitting || createMut.isPending || updateMut.isPending}
        >
          {isSubmitting || updateMut.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
          Lưu nháp
        </Button>
        <Button
          type="button"
          onClick={onPublish}
          disabled={isSubmitting || createMut.isPending || updateMut.isPending || publishMut.isPending}
        >
          {publishMut.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : <Rocket size={16} className="mr-2" />}
          Xuất bản ngay
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setScheduleOpen(true)}
          disabled={isSubmitting || createMut.isPending || updateMut.isPending}
        >
          <CalendarClock size={16} className="mr-2" />
          Lên lịch
        </Button>
      </div>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lên lịch đăng bài</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="sched">Thời gian</Label>
            <Input
              id="sched"
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setScheduleOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => {
                void submitSchedule();
              }}
              disabled={scheduleMut.isPending || createMut.isPending}
            >
              {scheduleMut.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Xác nhận lịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
