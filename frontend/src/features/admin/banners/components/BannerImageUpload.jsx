import { useRef, useState } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Upload } from 'lucide-react';

export function BannerImageUpload({ value, onChange, disabled, error }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await axiosInstance.post('/admin/banners/upload-image', fd);
      const url = data.data?.imageUrl;
      if (!url) throw new Error('Không nhận được URL ảnh');
      onChange(url);
    } catch (err) {
      setLocalError(err.response?.data?.message || err.message || 'Tải ảnh thất bại');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const err = error || localError;

  return (
    <div className="space-y-2">
      <Label>Ảnh banner</Label>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start">
        <div
          className="relative aspect-[21/9] w-full max-w-2xl overflow-hidden rounded-lg border bg-muted sm:min-h-[200px]"
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Chưa có ảnh</div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={disabled || uploading}
            onChange={handleFile}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="ml-2">{uploading ? 'Đang tải…' : 'Chọn ảnh'}</span>
          </Button>
          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP — tối đa 5MB (Cloudinary)</p>
        </div>
      </div>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
    </div>
  );
}
