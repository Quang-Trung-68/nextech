import { useState } from "react";
import { useUploadTempImages, useDeleteTempImage } from "@/features/admin/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";

export function ImageUploadGrid({ images, onChange, onUploadingChange }) {
  const { mutate: uploadImages } = useUploadTempImages();
  const { mutate: deleteImage } = useDeleteTempImage();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      toast.error('Tối đa 5 ảnh');
      return;
    }

    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    setIsUploading(true);
    if (onUploadingChange) onUploadingChange(true);
    uploadImages(formData, {
      onSuccess: (data) => {
        onChange([...images, ...data.images]);
        toast.success('Upload ảnh thành công');
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Upload thất bại');
      },
      onSettled: () => {
        setIsUploading(false);
        if (onUploadingChange) onUploadingChange(false);
      }
    });

    e.target.value = ''; // Reset input
  };

  const handleRemove = (publicId) => {
    deleteImage(publicId, {
      onSuccess: () => {
        const newImages = images.filter(img => img.publicId !== publicId);
        onChange(newImages);
      },
      onError: (err) => {
        // Có thể server đã xoá hoặc lỗi, cứ xoá khỏi giao diện cho chắc
        const newImages = images.filter(img => img.publicId !== publicId);
        onChange(newImages);
        toast.error('Xóa trên cloud thất bại: ' + (err.response?.data?.message || err.message));
      }
    });
  };

  const handleSetThumbnail = (publicId) => {
    const newImages = [...images];
    const index = newImages.findIndex(img => img.publicId === publicId);
    if (index > 0) {
      // Swap with index 0
      const temp = newImages[0];
      newImages[0] = newImages[index];
      newImages[index] = temp;
      onChange(newImages);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md cursor-pointer text-sm font-medium transition-colors">
          <UploadCloud className="w-4 h-4 mr-2" />
          Tải ảnh lên (Max 5)
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
        {isUploading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-4 gap-4">
          {images.map((img, index) => (
            <div 
              key={img.publicId} 
              className={`relative group rounded-md overflow-hidden border-2 cursor-pointer transition-all ${
                index === 0 ? 'border-primary' : 'border-transparent'
              }`}
              onClick={() => handleSetThumbnail(img.publicId)}
            >
              <img
                src={img.url}
                alt="preview"
                className="w-full h-24 object-cover"
              />
              {index === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[10px] text-center py-0.5 font-medium">
                  Thumbnail
                </div>
              )}
              <button
                type="button"
                className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); handleRemove(img.publicId); }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Chưa có ảnh nào.</p>
      )}
    </div>
  );
}
