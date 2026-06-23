import { useState, useEffect } from 'react';
import { Search, Shield, ShieldOff, UserX, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  auth_provider: string;
  is_active: boolean;
  is_admin: boolean;
  plan_name: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const pageSize = 10;

  useEffect(() => { loadUsers(); }, [page, search, filter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
      if (search) params.set('search', search);
      if (filter === 'active') params.set('is_active', 'true');
      if (filter === 'inactive') params.set('is_active', 'false');
      const r = await api.get(`/api/v1/admin/users?${params}`);
      setUsers(r.data.users || []);
      setTotal(r.data.total || 0);
    } catch {}
    finally { setLoading(false); }
  };

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      await api.patch(`/api/v1/admin/users/${userId}`, { is_admin: !isAdmin });
      toast.success(isAdmin ? 'Admin role removed' : 'Admin role granted');
      loadUsers();
    } catch { toast.error('Failed to update user'); }
  };

  const toggleActive = async (userId: string, isActive: boolean) => {
    try {
      await api.patch(`/api/v1/admin/users/${userId}`, { is_active: !isActive });
      toast.success(isActive ? 'User suspended' : 'User activated');
      loadUsers();
    } catch { toast.error('Failed to update user'); }
  };

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (u: AdminUser) => (
        <div className="flex items-center gap-3">
          <Avatar alt={u.full_name || u.email} size="sm" />
          <div>
            <p className="font-medium text-surface-900 dark:text-white">{u.full_name || 'No name'}</p>
            <p className="text-xs text-surface-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'plan_name',
      header: 'Plan',
      render: (u: AdminUser) => (
        <Badge variant={u.plan_name === 'enterprise' ? 'info' : u.plan_name === 'pro' ? 'success' : 'default'}>
          {u.plan_name}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (u: AdminUser) => <Badge variant={u.is_active ? 'success' : 'error'} dot>{u.is_active ? 'Active' : 'Suspended'}</Badge>,
    },
    {
      key: 'is_admin',
      header: 'Role',
      render: (u: AdminUser) => u.is_admin ? <Badge variant="warning">Admin</Badge> : <span className="text-sm text-surface-500">User</span>,
    },
    {
      key: 'created_at',
      header: 'Joined',
      render: (u: AdminUser) => new Date(u.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: '',
      render: (u: AdminUser) => (
        <Dropdown
          trigger={<Button size="sm" variant="ghost">Actions</Button>}
          items={[
            {
              label: u.is_admin ? 'Remove Admin' : 'Make Admin',
              icon: u.is_admin ? ShieldOff : Shield,
              onClick: () => toggleAdmin(u.id, u.is_admin),
            },
            {
              label: u.is_active ? 'Suspend User' : 'Activate User',
              icon: u.is_active ? UserX : UserCheck,
              onClick: () => toggleActive(u.id, u.is_active),
              variant: u.is_active ? 'danger' : undefined,
              divider: true,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Manage Users</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">{total} total users</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Tabs
          tabs={[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'inactive', label: 'Inactive' },
          ]}
          activeTab={filter}
          onTabChange={f => { setFilter(f); setPage(1); }}
          variant="pills"
        />
      </div>

      <Table
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="No users found"
        page={page}
        totalPages={Math.ceil(total / pageSize)}
        onPageChange={setPage}
      />
    </div>
  );
}
