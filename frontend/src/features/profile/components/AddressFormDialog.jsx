import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { AddressSelector } from '@/components/shared/AddressSelector';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateAddress, useUpdateAddress } from '@/features/profile/hooks/useAddressMutations';
import { toast } from 'sonner';

const vnPhoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;

const addressSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự.'),
  phone: z.string().regex(vnPhoneRegex, 'Số điện thoại không hợp lệ (10 số, bắt đầu 0).'),
  address: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự.'),
  ward: z.string().min(2, 'Xã/Phường phải có ít nhất 2 ký tự.'),
  city: z.string().min(2, 'Thành phố phải có ít nhất 2 ký tự.'),
  isDefault: z.boolean().default(false),
});

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {object|null} props.editingAddress - null = create mode, object = edit mode
 */
const AddressFormDialog = ({ open, onClose, editingAddress = null }) => {
  const isEdit = !!editingAddress;

  const form = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      address: '',
      ward: '',
      city: '',
      isDefault: false,
    },
  });

  // Pre-fill when editing
  useEffect(() => {
    if (editingAddress) {
      form.reset({
        fullName: editingAddress.fullName || '',
        phone: editingAddress.phone || '',
        address: editingAddress.address || '',
        ward: editingAddress.ward || '',
        city: editingAddress.city || '',
        isDefault: editingAddress.isDefault || false,
      });
    } else {
      form.reset({
        fullName: '',
        phone: '',
        address: '',
        ward: '',
        city: '',
        isDefault: false,
      });
    }
  }, [editingAddress, form]);

  const { mutate: createAddress, isPending: isCreating } = useCreateAddress();
  const { mutate: updateAddress, isPending: isUpdating } = useUpdateAddress();
  const isPending = isCreating || isUpdating;

  const onSubmit = (values) => {
    if (isEdit) {
      updateAddress(
        { id: editingAddress.id, ...values },
        {
          onSuccess: () => {
            toast.success('Đã cập nhật địa chỉ.');
            onClose();
          },
          onError: (err) => toast.error(err.response?.data?.message || 'Không thể cập nhật địa chỉ.'),
        }
      );
    } else {
      createAddress(values, {
        onSuccess: () => {
          toast.success('Đã thêm địa chỉ mới.');
          form.reset({
            fullName: '',
            phone: '',
            address: '',
            ward: '',
            city: '',
            isDefault: false,
          });
          onClose();
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Không thể thêm địa chỉ.'),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-apple-dark">
            {isEdit ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ tên người nhận</FormLabel>
                  <FormControl>
                    <Input placeholder="Nguyễn Văn A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <Input placeholder="0912345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="city"
              render={({ field: cityField, fieldState: cityState }) => (
                <Controller
                  control={form.control}
                  name="ward"
                  render={({ field: wardField, fieldState: wardState }) => (
                    <AddressSelector
                      cityValue={cityField.value}
                      onCityChange={cityField.onChange}
                      cityError={cityState.error?.message}
                      wardValue={wardField.value}
                      onWardChange={wardField.onChange}
                      wardError={wardState.error?.message}
                    />
                  )}
                />
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ (số nhà, tên đường)</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Đường Lê Lợi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0 pt-1">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="leading-none cursor-pointer">
                    Đặt làm địa chỉ mặc định
                  </FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-full px-6 font-medium border-[#d2d2d7]"
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-full px-6 font-semibold bg-apple-blue hover:bg-apple-blue/90"
              >
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? 'Cập nhật' : 'Thêm địa chỉ'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddressFormDialog;
