import { useState, useEffect } from "react";
import usePageTitle from "@/hooks/usePageTitle";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Loader2, Save } from "lucide-react";

const LOW_ORDER_INTERVAL_OPTIONS = [
  { value: "HOURLY", label: "Mỗi giờ" },
  { value: "DAILY", label: "Mỗi ngày" },
  { value: "MONTHLY", label: "Mỗi tháng" },
];

export default function AdminSettingsPage() {
  usePageTitle("Cài đặt | Quản trị");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    shopName: "",
    shopAddress: "",
    taxCode: "",
    bankAccount: "",
    phone: "",
    email: "",
    vatRate: 10,
    lowOrderAlertEnabled: false,
    lowOrderAlertInterval: "DAILY",
    lowOrderAlertThreshold: 5,
    lowStockAlertEnabled: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axiosInstance.get("/admin/settings");
        const data = res.data.settings || {};
        setSettings({
          shopName: data.shopName || "",
          shopAddress: data.shopAddress || "",
          taxCode: data.taxCode || "",
          bankAccount: data.bankAccount || "",
          phone: data.phone || "",
          email: data.email || "",
          vatRate: data.vatRate !== undefined ? Number(data.vatRate) * 100 : 10,
          lowOrderAlertEnabled: Boolean(data.lowOrderAlertEnabled),
          lowOrderAlertInterval: ["HOURLY", "DAILY", "MONTHLY"].includes(
            data.lowOrderAlertInterval,
          )
            ? data.lowOrderAlertInterval
            : "DAILY",
          lowOrderAlertThreshold:
            data.lowOrderAlertThreshold != null
              ? Number(data.lowOrderAlertThreshold)
              : 5,
          lowStockAlertEnabled: data.lowStockAlertEnabled !== false,
        });
      } catch {
        toast.error("Không thể tải cài đặt");
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
        lowOrderAlertInterval: settings.lowOrderAlertInterval,
        lowOrderAlertThreshold: Math.max(
          0,
          Math.min(999999, Number(settings.lowOrderAlertThreshold) || 0),
        ),
      };
      await axiosInstance.patch("/admin/settings", payload);
      toast.success("Lưu cài đặt thành công");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi lưu cài đặt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Cài đặt hệ thống
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Quản lý thông tin cửa hàng, địa chỉ, mã số thuế và cấu hình VAT.
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full md:w-auto"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
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

        {/* Section: Thông báo */}
        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Thông báo</h3>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border/80 bg-muted/20 p-4">
                <div className="space-y-1 flex-1">
                  <Label
                    htmlFor="lowStockAlert"
                    className="text-base font-medium"
                  >
                    Cảnh báo tồn kho thấp (serial / IMEI)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Khi bật, hệ thống kiểm tra định kỳ (mỗi giờ) số serial còn
                    trong kho so với ngưỡng từng sản phẩm/biến thể và gửi thông
                    báo cho quản trị viên. Tắt nếu không muốn nhận loại cảnh báo
                    này.
                  </p>
                </div>
                <Switch
                  id="lowStockAlert"
                  checked={settings.lowStockAlertEnabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      lowStockAlertEnabled: checked,
                    }))
                  }
                  className="shrink-0"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border/80 bg-muted/20 p-4">
                <div className="space-y-1 flex-1">
                  <Label
                    htmlFor="lowOrderAlert"
                    className="text-base font-medium"
                  >
                    Cảnh báo đơn hàng thấp
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Bật để định kỳ kiểm tra <strong>số đơn đặt</strong> (theo
                    tần suất và ngưỡng bên dưới) và gửi thông báo cho quản trị
                    viên khi số đơn trong kỳ vừa qua thấp hơn ngưỡng.
                  </p>
                </div>
                <Switch
                  id="lowOrderAlert"
                  checked={settings.lowOrderAlertEnabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      lowOrderAlertEnabled: checked,
                    }))
                  }
                  className="shrink-0"
                />
              </div>
              <div className="grid gap-6 sm:grid-cols-2 max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="lowOrderAlertInterval">
                    Kiểm tra số lượng mỗi
                  </Label>
                  <select
                    id="lowOrderAlertInterval"
                    name="lowOrderAlertInterval"
                    value={settings.lowOrderAlertInterval}
                    onChange={handleChange}
                    disabled={!settings.lowOrderAlertEnabled}
                    className={cn(
                      "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none md:text-sm",
                      "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                      "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
                      "dark:bg-input/30 dark:disabled:bg-input/80",
                    )}
                  >
                    {LOW_ORDER_INTERVAL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    <strong>Mỗi giờ:</strong> đếm đơn trong giờ trước (chạy đầu
                    mỗi giờ). <strong>Mỗi ngày:</strong> cả ngày hôm qua (00:05
                    hàng ngày). <strong>Mỗi tháng:</strong> cả tháng trước
                    (00:05 ngày 1).
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowOrderAlertThreshold">
                    Ngưỡng số lượng
                  </Label>
                  <Input
                    id="lowOrderAlertThreshold"
                    name="lowOrderAlertThreshold"
                    type="number"
                    min={0}
                    max={999999}
                    step={1}
                    value={settings.lowOrderAlertThreshold}
                    onChange={handleChange}
                    disabled={!settings.lowOrderAlertEnabled}
                    placeholder="VD: 5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Nếu số đơn trong kỳ (không tính đơn đã hủy) thấp hơn ngưỡng
                    này, hệ thống gửi cảnh báo (tối đa một lần mỗi kỳ).
                  </p>
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
