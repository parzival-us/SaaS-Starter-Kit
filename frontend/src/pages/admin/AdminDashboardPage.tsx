import { useEffect, useState } from 'react';
import { Users, CreditCard, DollarSign, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

interface AdminStats {
  total_users: number;
  active_users: number;
  total_conversations: number;
  total_messages: number;
  total_api_keys: number;
  active_subscriptions: number;
  revenue_this_month: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get<AdminStats>('/api/v1/admin/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Overview of your SaaS platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.total_users || 0} trend={{ value: 15, isPositive: true }} />
        <StatCard icon={CreditCard} label="Active Subscriptions" value={stats?.active_subscriptions || 0} gradient />
        <StatCard icon={DollarSign} label="Revenue (This Month)" value={`$${(stats?.revenue_this_month || 0).toLocaleString()}`} trend={{ value: 23, isPositive: true }} />
        <StatCard icon={Activity} label="Total API Keys" value={stats?.total_api_keys || 0} />
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-surface-900 dark:text-white">Platform Overview</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">Active Users</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{stats?.active_users || 0}</p>
            </div>
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">Conversations</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{stats?.total_conversations || 0}</p>
            </div>
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">Messages</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{stats?.total_messages || 0}</p>
            </div>
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">API Keys Issued</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{stats?.total_api_keys || 0}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
