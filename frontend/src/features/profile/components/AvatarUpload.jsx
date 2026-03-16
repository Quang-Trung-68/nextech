import { useRef, useState } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { useUploadAvatar } from '../hooks/useUploadAvatar';
import { toast } from 'sonner';

function getAvatarColor(userId = '') {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 60%, 50%)`;
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

const AvatarUpload = ({ user }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');

  const { mutate: uploadAvatar, isPending } = useUploadAvatar();

  const bgColor = getAvatarColor(user?.id);
  const initials = getInitials(user?.name);
  const currentAvatar = preview || user?.avatar;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError('');

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Chỉ chấp nhận file JPG, PNG hoặc WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFileError('Kích thước ảnh không được vượt quá 2MB.');
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setFileError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadAvatar(selectedFile, {
      onSuccess: () => {
        toast.success('Cập nhật ảnh đại diện thành công!');
        setSelectedFile(null);
        setPreview(null);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Tải ảnh lên thất bại. Vui lòng thử lại.');
        handleCancel();
      },
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar display */}
      <div className="relative group">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md overflow-hidden ring-4 ring-white"
          style={{ backgroundColor: currentAvatar ? 'transparent' : bgColor }}
        >
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt={user?.name}
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* Camera overlay button */}
        {!selectedFile && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Thay đổi ảnh đại diện"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Error message */}
      {fileError && (
        <p className="text-sm text-red-500 font-medium text-center">{fileError}</p>
      )}

      {/* Action buttons */}
      {!selectedFile ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm text-apple-blue font-medium hover:underline underline-offset-2 flex items-center gap-1.5"
        >
          <Camera className="w-3.5 h-3.5" />
          Thay đổi ảnh đại diện
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleUpload}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-apple-blue hover:bg-apple-blue/90 text-white text-sm font-semibold rounded-full transition-all shadow-sm disabled:opacity-60"
          >
            {isPending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Đang lưu...</>
            ) : (
              <><Upload className="w-3.5 h-3.5" />Lưu ảnh</>
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-apple-gray hover:bg-[#e8e8ed] text-apple-dark text-sm font-semibold rounded-full transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Huỷ
          </button>
        </div>
      )}

      <p className="text-xs text-apple-secondary">JPG, PNG hoặc WebP · Tối đa 2MB</p>
    </div>
  );
};

export default AvatarUpload;
