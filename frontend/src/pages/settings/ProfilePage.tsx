import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleProfile = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.patch('/api/v1/users/me', { full_name: fullName });
      updateUser(r.data);
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
    finally { setLoading(false); }
  };

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setPwLoading(true);
    try {
      await api.post('/api/v1/users/me/change-password', { current_password: currentPw, new_password: newPw });
      toast.success('Password changed');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch { toast.error('Failed to change password'); }
    finally { setPwLoading(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Profile Settings</h1>

      <Card>
        <CardBody>
          <div className="flex items-center gap-4 mb-6">
            <Avatar src={user?.avatar_url} alt={user?.full_name || ''} size="xl" />
            <div>
              <p className="font-semibold text-surface-900 dark:text-white">{user?.full_name}</p>
              <p className="text-sm text-surface-500">{user?.email}</p>
            </div>
          </div>
          <form onSubmit={handleProfile} className="space-y-4">
            <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
            <Input label="Email" value={user?.email || ''} disabled helperText="Email cannot be changed" />
            <Button type="submit" isLoading={loading}>Save Changes</Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-surface-900 dark:text-white">Change Password</h3>
        </CardHeader>
        <CardBody>
          <form onSubmit={handlePassword} className="space-y-4">
            <Input label="Current Password" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
            <Input label="New Password" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} />
            <Input label="Confirm New Password" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              error={confirmPw && newPw !== confirmPw ? 'Passwords do not match' : undefined} />
            <Button type="submit" isLoading={pwLoading}>Update Password</Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
          <Button variant="danger">Delete Account</Button>
        </CardBody>
      </Card>
    </div>
  );
}
