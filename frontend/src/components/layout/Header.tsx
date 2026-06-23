import { Menu, Bell, LogOut, User, Settings, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Toggle } from '@/components/ui/Toggle';
import { Dropdown } from '@/components/ui/Dropdown';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const dropdownItems = [
    { label: 'Profile', icon: User, onClick: () => navigate('/settings/profile') },
    { label: 'Settings', icon: Settings, onClick: () => navigate('/settings/billing') },
    ...(user?.is_admin ? [{ label: 'Admin Panel', icon: Shield, onClick: () => navigate('/admin'), divider: true }] : []),
    { label: 'Sign Out', icon: LogOut, onClick: () => { logout(); navigate('/login'); }, variant: 'danger' as const, divider: true },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-6 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-surface-800/50">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && <h1 className="text-lg font-semibold text-surface-900 dark:text-white">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        <Toggle checked={isDark} onChange={toggleTheme} size="sm" />

        <button className="relative p-2 rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
        </button>

        <Dropdown
          trigger={
            <button className="flex items-center gap-2 p-1 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
              <Avatar src={user?.avatar_url} alt={user?.full_name || 'User'} size="sm" status="online" />
              <span className="hidden md:block text-sm font-medium text-surface-700 dark:text-surface-300 max-w-[120px] truncate">
                {user?.full_name || user?.email}
              </span>
            </button>
          }
          items={dropdownItems}
        />
      </div>
    </header>
  );
}
