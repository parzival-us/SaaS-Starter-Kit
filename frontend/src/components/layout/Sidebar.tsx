import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, FileText, Key, CreditCard, User, Shield, Users, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare },
  { path: '/templates', label: 'Templates', icon: FileText },
  { path: '/settings/api-keys', label: 'API Keys', icon: Key },
  { path: '/settings/billing', label: 'Billing', icon: CreditCard },
  { path: '/settings/profile', label: 'Profile', icon: User },
];

const adminItems = [
  { path: '/admin', label: 'Admin Dashboard', icon: Shield },
  { path: '/admin/users', label: 'Manage Users', icon: Users },
];

export function Sidebar({ collapsed, onToggle, onClose }: SidebarProps) {
  const { user } = useAuth();

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
      isActive
        ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-brand-500 before:rounded-r-full'
        : 'text-surface-600 dark:text-white/60 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-200'
    }`;

  return (
    <aside
      className={`flex flex-col h-full bg-white dark:bg-black border-r border-surface-200 dark:border-white/20 transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-100 dark:border-white/20">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/25">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
            NexusAI
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => linkClass(isActive)}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        {user?.is_admin && (
          <>
            <div className="my-4 border-t border-surface-100 dark:border-white/20" />
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                Admin
              </p>
            )}
            {adminItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                end={item.path === '/admin'}
                className={({ isActive }) => linkClass(isActive)}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3 py-3 border-t border-surface-100 dark:border-white/20">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full p-2 rounded-xl text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
