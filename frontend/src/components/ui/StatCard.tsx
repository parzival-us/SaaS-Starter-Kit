import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  gradient?: boolean;
  className?: string;
}

export function StatCard({ icon: Icon, label, value, trend, gradient, className = '' }: StatCardProps) {
  if (gradient) {
    return (
      <div className={`rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-lg shadow-brand-500/25 hover:-translate-y-0.5 transition-all duration-300 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <span className={`flex items-center gap-1 text-sm font-medium ${trend.isPositive ? 'text-emerald-200' : 'text-red-200'}`}>
              {trend.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {trend.value}%
            </span>
          )}
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-white/70 mt-1">{label}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-white dark:bg-black/80 border border-surface-200 dark:border-white/20 p-6 hover:-translate-y-0.5 transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 bg-brand-50 dark:bg-brand-900/30 rounded-xl">
          <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-sm font-medium ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-surface-900 dark:text-white">{value}</p>
      <p className="text-sm text-surface-500 dark:text-white/60 mt-1">{label}</p>
    </div>
  );
}
