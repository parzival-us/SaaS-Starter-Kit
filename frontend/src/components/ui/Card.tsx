import type { ReactNode } from 'react';

interface CardProps {
  variant?: 'default' | 'glass' | 'gradient-border';
  hover?: boolean;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ variant = 'default', hover = false, children, className = '', onClick }: CardProps) {
  const variants: Record<string, string> = {
    default: 'bg-white dark:bg-black/80 border border-surface-200 dark:border-white/20',
    glass: 'bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/20/50',
    'gradient-border': 'bg-white dark:bg-black/80 border border-transparent bg-clip-padding [background-image:linear-gradient(white,white),linear-gradient(135deg,var(--color-brand-400),var(--color-accent-400))] dark:[background-image:linear-gradient(var(--color-surface-800),var(--color-surface-800)),linear-gradient(135deg,var(--color-brand-400),var(--color-accent-400))]',
  };

  const hoverClass = hover ? 'hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer' : '';

  return (
    <div
      className={`rounded-2xl shadow-sm ${variants[variant]} ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 border-b border-surface-100 dark:border-white/20/50 ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 border-t border-surface-100 dark:border-white/20/50 ${className}`}>{children}</div>;
}
