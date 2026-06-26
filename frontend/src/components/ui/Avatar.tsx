import { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline';
  className?: string;
}

export function Avatar({ src, alt, fallback, size = 'md', status, className = '' }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const sizes: Record<string, string> = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const statusSizes: Record<string, string> = {
    sm: 'w-2.5 h-2.5 border',
    md: 'w-3 h-3 border-2',
    lg: 'w-3.5 h-3.5 border-2',
    xl: 'w-4 h-4 border-2',
  };

  const initials = fallback || alt?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src && !imgError ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          onError={() => setImgError(true)}
          className={`${sizes[size]} rounded-full object-cover ring-2 ring-white dark:ring-surface-800`}
        />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold ring-2 ring-white dark:ring-surface-800`}>
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizes[size]} rounded-full border-white dark:border-white/20 ${
            status === 'online' ? 'bg-emerald-500' : 'bg-surface-400'
          }`}
        />
      )}
    </div>
  );
}
