import { Sun, Moon } from 'lucide-react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function Toggle({ checked, onChange, size = 'md', className = '' }: ToggleProps) {
  const sizes: Record<string, { track: string; thumb: string; translate: string; icon: string }> = {
    sm: { track: 'w-10 h-5', thumb: 'w-4 h-4', translate: 'translate-x-5', icon: 'w-2.5 h-2.5' },
    md: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7', icon: 'w-3.5 h-3.5' },
  };

  const s = sizes[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex ${s.track} items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 dark:focus:ring-offset-surface-900 ${
        checked ? 'bg-brand-600' : 'bg-surface-300 dark:bg-surface-600'
      } ${className}`}
    >
      <span
        className={`inline-flex items-center justify-center ${s.thumb} rounded-full bg-white shadow-md transform transition-transform duration-300 ${
          checked ? s.translate : 'translate-x-0.5'
        }`}
      >
        {checked ? (
          <Moon className={`${s.icon} text-brand-600`} />
        ) : (
          <Sun className={`${s.icon} text-amber-500`} />
        )}
      </span>
    </button>
  );
}
