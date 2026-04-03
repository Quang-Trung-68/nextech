import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import usePageTitle from '@/hooks/usePageTitle';
import { useAdminStats, useAdminRevenue } from '@/features/admin/hooks/useAdmin';
import { StatCard } from '@/features/admin/components/StatCard';
import { DollarSign, ShoppingBag, Package, Users, ScanBarcode, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import { DataTable } from '@/features/admin/components/DataTable';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const latestOrdersColumns = [
  {
    accessorKey: 'id',
    header: 'Mã đơn',
    cell: ({ row }) => <span className="font-mono text-xs">#{row.original.id.slice(-8).toUpperCase()}</span>,
  },
  {
    accessorKey: 'user.name',
    header: 'Khách hàng',
  },
  {
    accessorKey: 'totalAmount',
    header: 'Tổng tiền',
    cell: ({ row }) => <span className="font-medium text-primary">{formatCurrency(row.original.totalAmount)}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'createdAt',
    header: 'Thời gian',
    cell: ({ row }) => <span className="text-muted-foreground text-xs">{new Date(row.original.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</span>,
  },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const isMonth = label?.startsWith('T');
    const displayLabel = isMonth ? `Tháng ${label.substring(1)}` : `Ngày ${label?.substring(1)}`;

    return (
      <div className="bg-background border rounded-lg shadow-sm p-3">
        <p className="font-medium mb-1">{displayLabel}</p>
        <p className="text-primary font-bold">
          {Number(payload[0].value).toLocaleString('vi-VN')} ₫
        </p>
      </div>
    );
  }
  return null;
};

const AdminDashboardPage = () => {
  usePageTitle('Tổng quan | Quản trị');
  const navigate = useNavigate();
  const [period] = useState('month');
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2022 + 1 }, (_, i) => 2022 + i);

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState('All');

  const { data: stats, isLoading: isLoadingStats, isError } = useAdminStats(period);
  const { data: revenueData, isLoading: isLoadingRevenue } = useAdminRevenue(selectedYear, selectedMonth);

  const averageRevenue = useMemo(() => {
    if (!revenueData || revenueData.length === 0) return 0;
    const total = revenueData.reduce((acc, curr) => acc + curr.revenue, 0);
    return total / revenueData.length;
  }, [revenueData]);

  if (isLoadingStats) return <LoadingSkeleton />;
  if (isError) return <div className="text-red-500">Không tải được thống kê.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Bảng điều khiển</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(stats?.totalRevenueAllTime || 0)}
          icon={DollarSign}
        />
        <div onClick={() => navigate('/admin/orders')} className="cursor-pointer transition hover:scale-105">
          <StatCard
            title="Tổng đơn hàng"
            value={(stats?.totalOrdersAllTime || 0).toLocaleString('vi-VN')}
            icon={ShoppingBag}
          />
        </div>
        <div onClick={() => navigate('/admin/products')} className="cursor-pointer transition hover:scale-105">
          <StatCard
            title="Sản phẩm"
            value={(stats?.totalProducts || 0).toLocaleString('vi-VN')}
            icon={Package}
          />
        </div>
        <div onClick={() => navigate('/admin/users')} className="cursor-pointer transition hover:scale-105">
          <StatCard
            title="Người dùng"
            value={(stats?.totalUsersAllTime || 0).toLocaleString('vi-VN')}
            icon={Users}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div onClick={() => navigate('/admin/inventory/serials')} className="cursor-pointer transition hover:scale-105">
          <StatCard
            title="Serial còn trong kho"
            value={(stats?.inventory?.serialInStockCount ?? 0).toLocaleString('vi-VN')}
            icon={ScanBarcode}
          />
        </div>
        <div
          onClick={() => navigate('/admin/inventory/serials?tab=low')}
          className="cursor-pointer transition hover:scale-105"
        >
          <StatCard
            title="Cảnh báo sắp hết hàng"
            value={(stats?.inventory?.lowStockAlertCount ?? 0).toLocaleString('vi-VN')}
            icon={AlertTriangle}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Biểu đồ doanh thu theo tháng */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold">
              Doanh thu theo {selectedMonth === 'All' ? 'tháng' : 'ngày'}
            </h2>

            <div className="flex items-center justify-end gap-3">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Năm</span>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Năm" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Tháng</span>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Tháng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">Cả năm</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        Tháng {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="h-[300px]">
            {isLoadingRevenue ? (
              <Skeleton className="w-full h-full rounded-md" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${Math.round(v / 1000000)} Tr`}
                    dx={-10}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <ReferenceLine 
                    y={averageRevenue} 
                    stroke="#e5e7eb" 
                    strokeDasharray="4 4" 
                    label={{ value: 'TB', position: 'insideTopLeft', fill: '#9ca3af', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    activeDot={{ r: 5, fill: "#3b82f6" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bảng 5 đơn hàng mới nhất */}
        <div className="bg-card border rounded-xl p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Đơn hàng gần đây</h2>
          </div>
          <DataTable
            columns={latestOrdersColumns}
            data={stats?.latestOrders || []}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
