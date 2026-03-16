import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, Phone, Mail, CalendarDays, Shield } from 'lucide-react';
import useAuthStore from '../../../stores/useAuthStore';
import usePageTitle from '../../../hooks/usePageTitle';
import AvatarUpload from '../components/AvatarUpload';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { toast } from 'sonner';

const vnPhoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;

const profileSchema = z.object({
  name: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự.'),
  phone: z
    .string()
    .regex(vnPhoneRegex, 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).')
    .optional()
    .or(z.literal('')),
});

const ProfileInfoPage = () => {
  usePageTitle('Thông tin cá nhân');
  const user = useAuthStore((s) => s.user);
  const [serverError, setServerError] = useState('');

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  });

  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const onSubmit = (values) => {
    setServerError('');
    updateProfile(values, {
      onSuccess: () => {
        toast.success('Cập nhật thông tin thành công!');
      },
      onError: (err) => {
        setServerError(err.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.');
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Avatar section */}
      <div className="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm p-6 md:p-8">
        <h2 className="text-lg font-bold text-apple-dark tracking-tight mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-apple-blue" />
          Ảnh đại diện
        </h2>
        <AvatarUpload user={user} />
      </div>

      {/* Info section */}
      <div className="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm p-6 md:p-8">
        <h2 className="text-lg font-bold text-apple-dark tracking-tight mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-apple-blue" />
          Thông tin cá nhân
        </h2>

        {/* Read-only info */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-apple-gray/40 border border-[#f5f5f7]">
          <div>
            <p className="text-xs font-semibold text-apple-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> Email
            </p>
            <p className="text-sm font-medium text-apple-dark">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-apple-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <CalendarDays className="w-3 h-3" /> Ngày tham gia
            </p>
            <p className="text-sm font-medium text-apple-dark">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </div>

        {serverError && (
          <Alert variant="destructive" className="mb-5">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-apple-secondary" />
                    Họ và tên
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nguyễn Văn A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-apple-secondary" />
                    Số điện thoại
                    <span className="text-apple-secondary font-normal text-xs">(tuỳ chọn)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="0912345678" type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-full px-8 font-semibold bg-apple-blue hover:bg-apple-blue/90 h-10"
              >
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Cập nhật thông tin
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ProfileInfoPage;
