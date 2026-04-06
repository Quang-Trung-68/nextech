import { useRef, useState } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X } from 'lucide-react';

export function BrandLogoUpload({ value, onChange, disabled, error }) {
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
      fd.append('logo', file);
      const { data } = await axiosInstance.post('/admin/brands/upload-logo', fd);
      const url = data.data?.logoUrl;
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
      <Label>Logo thương hiệu</Label>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {value ? (
            <img src={value} alt="" className="max-h-full max-w-full object-contain p-2" />
          ) : (
            <span className="text-xs text-muted-foreground">Chưa có logo</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            className="hidden"
            disabled={disabled || uploading}
            onChange={handleFile}
          />
          <div className="flex flex-wrap gap-2">
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
            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || uploading}
                onClick={() => onChange('')}
              >
                <X className="mr-1 h-4 w-4" />
                Gỡ logo
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, SVG — tối đa 3MB (Cloudinary)</p>
        </div>
      </div>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
    </div>
  );
}
