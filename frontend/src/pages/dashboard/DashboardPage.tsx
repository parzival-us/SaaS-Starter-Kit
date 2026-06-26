import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Zap, MessageSquare, Crown, Plus, FileText, Key } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardBody } from '@/components/ui/Card';

interface DashboardData {
  total_conversations: number;
  total_messages: number;
  total_api_calls: number;
  tokens_used: number;
  current_plan: string;
  usage_percentage: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get<DashboardData>('/api/v1/users/me/dashboard').then(r => setData(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          Welcome back, {user?.full_name?.split(' ')[0] || 'there'}! 👋
        </h1>
        <p className="text-surface-500 dark:text-white/60 mt-1">Here's what's happening with your AI workspace.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Total API Calls" value={data?.total_api_calls?.toLocaleString() || '0'} trend={{ value: 12, isPositive: true }} />
        <StatCard icon={Zap} label="Tokens Used" value={data?.tokens_used?.toLocaleString() || '0'} trend={{ value: 8, isPositive: true }} gradient />
        <StatCard icon={MessageSquare} label="Conversations" value={data?.total_conversations || 0} />
        <StatCard icon={Crown} label="Current Plan" value={(data?.current_plan || 'free').charAt(0).toUpperCase() + (data?.current_plan || 'free').slice(1)} />
      </div>

      {/* Usage Bar */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-surface-900 dark:text-white">Usage This Period</h3>
            <span className="text-sm text-surface-500">{Math.round(data?.usage_percentage || 0)}%</span>
          </div>
          <div className="h-3 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(data?.usage_percentage || 0, 100)}%` }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card hover onClick={() => navigate('/chat')}>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-900/30">
                <Plus className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="font-semibold text-surface-900 dark:text-white">New Chat</p>
                <p className="text-sm text-surface-500">Start a conversation</p>
              </div>
            </CardBody>
          </Card>
          <Card hover onClick={() => navigate('/templates')}>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent-50 dark:bg-accent-900/30">
                <FileText className="w-5 h-5 text-accent-600 dark:text-accent-400" />
              </div>
              <div>
                <p className="font-semibold text-surface-900 dark:text-white">Templates</p>
                <p className="text-sm text-surface-500">Browse & create prompts</p>
              </div>
            </CardBody>
          </Card>
          <Card hover onClick={() => navigate('/settings/api-keys')}>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30">
                <Key className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-surface-900 dark:text-white">API Keys</p>
                <p className="text-sm text-surface-500">Manage your keys</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
