import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Edit3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';

interface Template { id: string; title: string; description: string | null; content: string; category: string; is_public: boolean; usage_count: number; user_id: string | null; created_at: string; }

const categories = ['all', 'writing', 'code', 'analysis', 'marketing', 'custom'];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', content: '', category: 'general', is_public: false });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    try { const r = await api.get('/api/v1/templates'); setTemplates(r.data.templates || []); } catch {}
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) { toast.error('Title and content are required'); return; }
    setLoading(true);
    try {
      if (editId) { await api.patch(`/api/v1/templates/${editId}`, form); toast.success('Template updated'); }
      else { await api.post('/api/v1/templates', form); toast.success('Template created'); }
      setModalOpen(false);
      setEditId(null);
      setForm({ title: '', description: '', content: '', category: 'general', is_public: false });
      loadTemplates();
    } catch { toast.error('Failed to save template'); }
    finally { setLoading(false); }
  };

  const deleteTemplate = async (id: string) => {
    try { await api.delete(`/api/v1/templates/${id}`); toast.success('Template deleted'); loadTemplates(); } catch { toast.error('Failed to delete'); }
  };

  const openEdit = (t: Template) => {
    setEditId(t.id);
    setForm({ title: t.title, description: t.description || '', content: t.content, category: t.category, is_public: t.is_public });
    setModalOpen(true);
  };

  const filtered = templates.filter(t => {
    if (category !== 'all' && t.category !== category) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Prompt Templates</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Create and manage reusable prompt templates</p>
        </div>
        <Button onClick={() => { setEditId(null); setForm({ title: '', description: '', content: '', category: 'general', is_public: false }); setModalOpen(true); }} leftIcon={<Plus className="w-4 h-4" />}>
          Create Template
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
        </div>
        <Tabs
          tabs={categories.map(c => ({ id: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
          activeTab={category}
          onTabChange={setCategory}
          variant="pills"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No templates found" description="Create your first template to get started." action={{ label: 'Create Template', onClick: () => setModalOpen(true) }} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <Card key={t.id} hover>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-surface-900 dark:text-white">{t.title}</h3>
                  <Badge variant="info" size="sm">{t.category}</Badge>
                </div>
                {t.description && <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2">{t.description}</p>}
                <p className="text-xs text-surface-400">Used {t.usage_count} times</p>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => navigate('/chat')}>Use</Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(t)}><Edit3 className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteTemplate(t.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Template' : 'Create Template'}>
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Input label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Content</label>
            <textarea rows={5} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none" />
          </div>
          <div className="flex gap-4">
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="flex-1 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300">
              {categories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} className="w-4 h-4 rounded border-surface-300 text-brand-500" />
              <span className="text-sm text-surface-700 dark:text-surface-300">Public</span>
            </label>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} isLoading={loading}>{editId ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
