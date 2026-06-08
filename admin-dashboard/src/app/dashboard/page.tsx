'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { UserGrowthChart } from '@/components/dashboard/UserGrowthChart';
import { ProjectStatusChart } from '@/components/dashboard/ProjectStatusChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { adminApi } from '@/lib/api/admin';
import { DashboardStats } from '@/types';
import {
  Users,
  FolderOpen,
  TrendingUp,
  DollarSign,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats()
      .then(setStats)
      .catch(() => {
        // Use mock data if API not available
        setStats({
          totalUsers: 1842,
          totalProjects: 55,
          totalInvestments: 3210,
          totalRevenue: 12500000,
          activeProjects: 24,
          pendingProjects: 8,
          newUsersToday: 14,
          newUsersThisWeek: 87,
          totalTransactions: 4820,
          successRate: 94.5,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute>
      <DashboardLayout title="Dashboard">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Dashboard Overview</h1>
          <p className="text-sm text-text-muted mt-1">
            Welcome back — here&apos;s what&apos;s happening on Investly today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <div className="col-span-1">
            <StatsCard
              title="Total Users"
              value={stats?.totalUsers ?? 0}
              icon={<Users size={20} />}
              change={12}
              changeLabel="vs last month"
              color="primary"
              loading={loading}
            />
          </div>
          <div className="col-span-1">
            <StatsCard
              title="Total Projects"
              value={stats?.totalProjects ?? 0}
              icon={<FolderOpen size={20} />}
              change={8}
              changeLabel="vs last month"
              color="teal"
              loading={loading}
            />
          </div>
          <div className="col-span-1">
            <StatsCard
              title="Active Projects"
              value={stats?.activeProjects ?? 0}
              icon={<CheckCircle size={20} />}
              color="success"
              loading={loading}
            />
          </div>
          <div className="col-span-1">
            <StatsCard
              title="Investments"
              value={stats?.totalInvestments ?? 0}
              icon={<TrendingUp size={20} />}
              change={23}
              changeLabel="vs last month"
              color="amber"
              loading={loading}
            />
          </div>
          <div className="col-span-1">
            <StatsCard
              title="Total Revenue"
              value={stats ? formatCurrency(stats.totalRevenue) : '0'}
              icon={<DollarSign size={20} />}
              change={18}
              changeLabel="vs last month"
              color="primary"
              loading={loading}
            />
          </div>
          <div className="col-span-1">
            <StatsCard
              title="Success Rate"
              value={stats?.successRate ?? 0}
              icon={<Activity size={20} />}
              suffix="%"
              color="teal"
              loading={loading}
            />
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
          <div className="xl:col-span-2">
            <RevenueChart />
          </div>
          <div className="xl:col-span-1">
            <ProjectStatusChart />
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-1">
            <UserGrowthChart />
          </div>
          <div className="xl:col-span-2">
            <RecentActivity />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
