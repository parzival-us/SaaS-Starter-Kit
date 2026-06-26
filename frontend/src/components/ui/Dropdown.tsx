import { useState, useRef, useEffect, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface DropdownItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'danger';
  divider?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-flex">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={`absolute top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'} z-50 min-w-48 bg-white dark:bg-black rounded-xl border border-surface-200 dark:border-white/20 shadow-xl py-1.5 animate-scale-in origin-top-right`}
        >
          {items.map((item, i) => (
            <div key={i}>
              {item.divider && <div className="my-1.5 border-t border-surface-100 dark:border-white/20" />}
              <button
                onClick={() => { item.onClick(); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${
                  item.variant === 'danger'
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-surface-700 dark:text-white/70 hover:bg-surface-50 dark:hover:bg-surface-700/50'
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
