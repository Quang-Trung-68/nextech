import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Cài đặt hệ thống</h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Quản lý thông tin cửa hàng, địa chỉ, mã số thuế và cấu hình VAT.
          </p>
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="w-full md:w-auto">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section: General Info */}
        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin chung</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="shopName">Tên cửa hàng</Label>
                <Input 
                  id="shopName" 
                  name="shopName" 
                  value={settings.shopName} 
                  onChange={handleChange} 
                  placeholder="VD: NexTech"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatRate">Cấu hình VAT (%)</Label>
                <Input 
                  id="vatRate" 
                  name="vatRate" 
                  type="number" 
                  min="0" 
                  max="100" 
                  step="1" 
                  value={settings.vatRate} 
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section: Contact & Address */}
        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Liên hệ & Địa chỉ</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="shopAddress">Địa chỉ cửa hàng / Công ty</Label>
                <Input 
                  id="shopAddress" 
                  name="shopAddress" 
                  value={settings.shopAddress} 
                  onChange={handleChange} 
                  placeholder="VD: 123 Nguyễn Huệ, Quận 1, TP.HCM"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Điện thoại liên hệ</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    value={settings.phone} 
                    onChange={handleChange} 
                    placeholder="VD: 0901234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email liên hệ</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    name="email" 
                    value={settings.email} 
                    onChange={handleChange} 
                    placeholder="VD: contact@nextech.vn"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section: Finance & Legal */}
        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Tài chính & Pháp lý</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="taxCode">Mã số thuế</Label>
                <Input 
                  id="taxCode" 
                  name="taxCode" 
                  value={settings.taxCode} 
                  onChange={handleChange} 
                  placeholder="Không bắt buộc"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccount">Tài khoản ngân hàng</Label>
                <Input 
                  id="bankAccount" 
                  name="bankAccount" 
                  value={settings.bankAccount} 
                  onChange={handleChange} 
                  placeholder="VD: VCB 0123..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

      </form>
    </div>
  );
}


