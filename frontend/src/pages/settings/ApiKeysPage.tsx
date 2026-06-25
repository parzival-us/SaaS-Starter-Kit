import { useState, useEffect } from 'react';
import { Plus, Copy, Key, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

interface ApiKey { id: string; name: string; key_prefix: string; is_active: boolean; last_used_at: string | null; created_at: string; }

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadKeys(); }, []);

  const loadKeys = async () => {
    try { const r = await api.get('/api/v1/api-keys'); setKeys(r.data.api_keys || []); } catch { /* silently ignore */ }
    finally { setLoading(false); }
  };

  const createKey = async () => {
    if (!newKeyName.trim()) { toast.error('Name is required'); return; }
    setCreating(true);
    try {
      const r = await api.post('/api/v1/api-keys', { name: newKeyName });
      setCreatedKey(r.data.key);
      setNewKeyName('');
      loadKeys();
    } catch { toast.error('Failed to create key'); }
    finally { setCreating(false); }
  };

  const revokeKey = async () => {
    if (!revokeId) return;
    try { await api.delete(`/api/v1/api-keys/${revokeId}`); toast.success('Key revoked'); setRevokeId(null); loadKeys(); }
    catch { toast.error('Failed to revoke key'); }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Copied to clipboard');
  };

  const columns = [
    { key: 'key_prefix', header: 'Key', render: (k: ApiKey) => <code className="text-sm bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">{k.key_prefix}...</code> },
    { key: 'name', header: 'Name' },
    { key: 'is_active', header: 'Status', render: (k: ApiKey) => <Badge variant={k.is_active ? 'success' : 'error'} dot>{k.is_active ? 'Active' : 'Revoked'}</Badge> },
    { key: 'created_at', header: 'Created', render: (k: ApiKey) => new Date(k.created_at).toLocaleDateString() },
    { key: 'last_used_at', header: 'Last Used', render: (k: ApiKey) => k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never' },
    { key: 'actions', header: '', render: (k: ApiKey) => k.is_active ? <Button size="sm" variant="danger" onClick={() => setRevokeId(k.id)}>Revoke</Button> : null },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">API Keys</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Manage your API access keys</p>
        </div>
        <Button onClick={() => { setCreatedKey(null); setCreateOpen(true); }} leftIcon={<Plus className="w-4 h-4" />}>Create Key</Button>
      </div>

      {!loading && keys.length === 0 ? (
        <EmptyState icon={Key} title="No API keys yet" description="Create your first API key to get started." action={{ label: 'Create Key', onClick: () => setCreateOpen(true) }} />
      ) : (
        <Table columns={columns} data={keys} loading={loading} emptyMessage="No API keys" />
      )}

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={createdKey ? 'Key Created' : 'Create API Key'}>
        {createdKey ? (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">This key will only be shown once</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 p-3 bg-surface-900 text-emerald-400 rounded-lg text-sm font-mono break-all">{createdKey}</code>
                <button onClick={() => copyKey(createdKey)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
                  <Copy className="w-4 h-4 text-surface-500" />
                </button>
              </div>
            </div>
            <Button onClick={() => { setCreateOpen(false); setCreatedKey(null); }} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input label="Key Name" placeholder="e.g. Production API Key" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} />
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={createKey} isLoading={creating}>Create</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Revoke Modal */}
      <Modal isOpen={!!revokeId} onClose={() => setRevokeId(null)} title="Revoke API Key">
        <p className="text-sm text-surface-600 dark:text-surface-400 mb-6">Are you sure you want to revoke this key? This action cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setRevokeId(null)}>Cancel</Button>
          <Button variant="danger" onClick={revokeKey}>Revoke Key</Button>
        </div>
      </Modal>
    </div>
  );
}
