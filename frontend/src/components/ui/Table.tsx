import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  striped?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Table<T extends Record<string, any>>({
  columns, data, loading, emptyMessage = 'No data found', striped = true,
  page, totalPages, onPageChange,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-50 dark:bg-surface-800/50">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t border-surface-100 dark:border-surface-700/50">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded animate-pulse w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-surface-200 dark:border-surface-700 p-12 text-center">
        <p className="text-surface-500 dark:text-surface-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-50 dark:bg-surface-800/50">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr
                key={i}
                className={`border-t border-surface-100 dark:border-surface-700/50 transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/30 ${
                  striped && i % 2 === 1 ? 'bg-surface-50/50 dark:bg-surface-800/20' : ''
                }`}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-sm text-surface-700 dark:text-surface-300">
                    {col.render ? col.render(item) : String(item[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-surface-500 dark:text-surface-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange((page || 1) - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange((page || 1) + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
