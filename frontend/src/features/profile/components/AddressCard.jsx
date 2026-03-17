import { MapPin, Phone, User, Star, Pencil, Trash2, Check } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
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
} from '../../../components/ui/alert-dialog';
import { useDeleteAddress, useSetDefaultAddress } from '../hooks/useAddressMutations';
import { toast } from 'sonner';

const AddressCard = ({ address, totalCount, onEdit }) => {
  const { id, fullName, phone, address: street, ward, city, isDefault } = address;

  const { mutate: deleteAddress, isPending: isDeleting } = useDeleteAddress();
  const { mutate: setDefault, isPending: isSettingDefault } = useSetDefaultAddress();

  const handleDelete = () => {
    deleteAddress(id, {
      onSuccess: () => toast.success('Đã xoá địa chỉ.'),
      onError: (err) => toast.error(err.response?.data?.message || 'Không thể xoá địa chỉ.'),
    });
  };

  const handleSetDefault = () => {
    setDefault(id, {
      onSuccess: () => toast.success('Đã đặt làm địa chỉ mặc định.'),
      onError: (err) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra.'),
    });
  };

  return (
    <div
      className={`relative rounded-2xl border p-5 transition-all ${
        isDefault
          ? 'border-apple-blue bg-apple-blue/5 shadow-sm'
          : 'border-[#e5e5ea] bg-white hover:border-[#d2d2d7] hover:shadow-sm'
      }`}
    >
      {/* Default badge */}
      {isDefault && (
        <Badge className="absolute top-4 right-4 bg-apple-blue text-white border-none text-[11px] px-2 py-0.5 flex items-center gap-1">
          <Check className="w-3 h-3" />
          Mặc định
        </Badge>
      )}

      {/* Address info */}
      <div className="space-y-2 pr-20">
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-apple-secondary shrink-0" />
          <span className="font-semibold text-apple-dark text-[15px]">{fullName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-apple-secondary shrink-0" />
          <span className="text-sm text-apple-secondary">{phone}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-apple-secondary shrink-0 mt-0.5" />
          <span className="text-sm text-apple-secondary leading-relaxed">
            {street}{ward ? `, ${ward}` : ''}, {city}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#f5f5f7]">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(address)}
          className="h-8 rounded-full px-4 text-xs font-semibold border-[#d2d2d7] hover:bg-apple-gray"
        >
          <Pencil className="w-3 h-3 mr-1.5" />
          Sửa
        </Button>

        {!isDefault && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSetDefault}
            disabled={isSettingDefault}
            className="h-8 rounded-full px-4 text-xs font-semibold border-[#d2d2d7] hover:bg-apple-gray"
          >
            <Star className="w-3 h-3 mr-1.5" />
            Đặt mặc định
          </Button>
        )}

        {/* Delete — disabled if this is the only address (or if default with others remaining) */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isDeleting || (isDefault && totalCount > 1)}
              className="h-8 rounded-full px-4 text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 ml-auto"
              title={isDefault && totalCount > 1 ? 'Không thể xoá địa chỉ mặc định khi còn địa chỉ khác' : ''}
            >
              <Trash2 className="w-3 h-3 mr-1.5" />
              Xoá
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-apple-dark">Xác nhận xoá địa chỉ</AlertDialogTitle>
              <AlertDialogDescription className="text-base text-apple-secondary mt-2">
                Bạn có chắc muốn xoá địa chỉ của <b>{fullName}</b>? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6">
              <AlertDialogCancel className="rounded-full px-6 font-medium border-[#d2d2d7]">Giữ lại</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90 text-white rounded-full px-6 font-semibold"
              >
                Xoá địa chỉ
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AddressCard;
