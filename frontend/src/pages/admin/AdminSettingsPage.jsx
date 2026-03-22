import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Store, 
  MapPin, 
  CreditCard, 
  Phone, 
  Mail, 
  FileText, 
  Percent,
  Save,
  Loader2,
  Building2
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    shopName: '',
    shopAddress: '',
    taxCode: '',
    bankAccount: '',
    phone: '',
    email: '',
    vatRate: 10,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axiosInstance.get('/admin/settings');
        const data = res.data.settings || {};
        setSettings({
          shopName: data.shopName || '',
          shopAddress: data.shopAddress || '',
          taxCode: data.taxCode || '',
          bankAccount: data.bankAccount || '',
          phone: data.phone || '',
          email: data.email || '',
          vatRate: (data.vatRate !== undefined ? Number(data.vatRate) * 100 : 10),
        });
      } catch {
        toast.error('Không thể tải cài đặt');
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setSettings((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...settings,
        vatRate: Number(settings.vatRate) / 100,
      };
      await axiosInstance.patch('/admin/settings', payload);
      toast.success('Lưu cài đặt thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi lưu cài đặt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Cài đặt hệ thống</h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Quản lý thông tin cửa hàng, địa chỉ, mã số thuế và cấu hình VAT.
          </p>
        </div>
        <Button onClick={handleSubmit} disabled={loading} size="lg" className="w-full md:w-auto shadow-sm transition-all hover:scale-[1.02]">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Section: General Info */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"> 
            <Store className="h-5 w-5 text-blue-500" /> 
            Thông tin chung
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Tên hiển thị và cấu hình thuế VAT mặc định áp dụng cho toàn bộ cửa hàng.
          </p>
        </div>
        <Card className="lg:col-span-2 shadow-sm border-gray-200/60 dark:border-gray-800 transition-all hover:shadow-md">
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label htmlFor="shopName" className="font-medium text-gray-700 dark:text-gray-300">Tên cửa hàng</Label>
                <div className="relative group">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input 
                    id="shopName" 
                    name="shopName" 
                    value={settings.shopName} 
                    onChange={handleChange} 
                    placeholder="VD: NexTech" 
                    className="pl-9 h-11" 
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="vatRate" className="font-medium text-gray-700 dark:text-gray-300">Cấu hình VAT (%)</Label>
                <div className="relative group">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input 
                    id="vatRate" 
                    name="vatRate" 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="1" 
                    value={settings.vatRate} 
                    onChange={handleChange} 
                    className="pl-9 h-11" 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="col-span-full border-t border-gray-100 dark:border-gray-800 my-4" />

        {/* Section: Contact & Address */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"> 
            <Building2 className="h-5 w-5 text-emerald-500" /> 
            Liên hệ & Địa chỉ
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Cung cấp địa chỉ trụ sở và các thông tin liên lạc chính thức để khách hàng có thể liên hệ.
          </p>
        </div>
        <Card className="lg:col-span-2 shadow-sm border-gray-200/60 dark:border-gray-800 transition-all hover:shadow-md">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="shopAddress" className="font-medium text-gray-700 dark:text-gray-300">Địa chỉ cửa hàng / Công ty</Label>
              <div className="relative group">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input 
                  id="shopAddress" 
                  name="shopAddress" 
                  value={settings.shopAddress} 
                  onChange={handleChange} 
                  placeholder="VD: 123 Nguyễn Huệ, Quận 1, TP.HCM" 
                  className="pl-9 h-11" 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label htmlFor="phone" className="font-medium text-gray-700 dark:text-gray-300">Điện thoại liên hệ</Label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input 
                    id="phone" 
                    name="phone" 
                    value={settings.phone} 
                    onChange={handleChange} 
                    placeholder="VD: 0901234567" 
                    className="pl-9 h-11" 
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="email" className="font-medium text-gray-700 dark:text-gray-300">Email liên hệ</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input 
                    id="email" 
                    type="email" 
                    name="email" 
                    value={settings.email} 
                    onChange={handleChange} 
                    placeholder="VD: contact@nextech.vn" 
                    className="pl-9 h-11" 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="col-span-full border-t border-gray-100 dark:border-gray-800 my-4" />

        {/* Section: Finance & Legal */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"> 
            <CreditCard className="h-5 w-5 text-purple-500" /> 
            Tài chính & Pháp lý
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Thông tin mã số thuế và tài khoản ngân hàng dùng cho giao dịch và xuất hóa đơn.
          </p>
        </div>
        <Card className="lg:col-span-2 shadow-sm border-gray-200/60 dark:border-gray-800 transition-all hover:shadow-md">
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label htmlFor="taxCode" className="font-medium text-gray-700 dark:text-gray-300">Mã số thuế</Label>
                <div className="relative group">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <Input 
                    id="taxCode" 
                    name="taxCode" 
                    value={settings.taxCode} 
                    onChange={handleChange} 
                    placeholder="Không bắt buộc" 
                    className="pl-9 h-11" 
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="bankAccount" className="font-medium text-gray-700 dark:text-gray-300">Tài khoản ngân hàng</Label>
                <div className="relative group">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <Input 
                    id="bankAccount" 
                    name="bankAccount" 
                    value={settings.bankAccount} 
                    onChange={handleChange} 
                    placeholder="VD: VCB 0123..." 
                    className="pl-9 h-11" 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form buttons (mobile mostly, as save is in header) */}
        <div className="col-span-full flex justify-end mt-4 md:hidden">
          <Button type="submit" disabled={loading} size="lg" className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>

      </form>
    </div>
  );
}

