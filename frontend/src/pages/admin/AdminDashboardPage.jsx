import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import { useAdminStats } from '../../features/admin/hooks/useAdmin';
import { StatCard } from '../../features/admin/components/StatCard';
import { DollarSign, ShoppingBag, Package, Users } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const AdminDashboardPage = () => {
  usePageTitle('Dashboard | Quản trị');
  const navigate = useNavigate();
  const [period] = useState('month');
  const { data: stats, isLoading, isError } = useAdminStats(period);

  if (isLoading) return <div>Loading dashboard stats...</div>;
  if (isError) return <div className="text-red-500">Failed to load statistics.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.revenue?.total || 0)}
          icon={DollarSign}
        />
        <div onClick={() => navigate('/admin/orders')} className="cursor-pointer transition hover:scale-105">
          <StatCard
            title="Total Orders"
            value={stats?.orders?.totalInPeriod || 0}
            icon={ShoppingBag}
          />
        </div>
        <StatCard
          title="Low Stock Products"
          value={stats?.lowStockProducts?.length || 0}
          icon={Package}
        />
        <StatCard
          title="New Users"
          value={stats?.newUsers || 0}
          icon={Users}
        />
      </div>

      {/* Placeholder for Revenue Chart */}
      <div className="mt-8 bg-card border rounded-xl p-6 h-96 flex items-center justify-center text-muted-foreground">
        [ Revenue Chart Plugin can go here ]
      </div>
    </div>
  );
};

export default AdminDashboardPage;
