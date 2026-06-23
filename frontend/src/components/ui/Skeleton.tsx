interface SkeletonProps {
  variant?: 'text' | 'circle' | 'card' | 'rect';
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({ variant = 'text', width, height, className = '' }: SkeletonProps) {
  const base = 'animate-pulse bg-surface-200 dark:bg-surface-700';

  const variants: Record<string, string> = {
    text: `${base} h-4 rounded`,
    circle: `${base} rounded-full`,
    card: `${base} rounded-2xl h-48`,
    rect: `${base} rounded-xl`,
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;
  if (variant === 'circle' && !width) style.width = '40px';
  if (variant === 'circle' && !height) style.height = '40px';

  return <div className={`${variants[variant]} ${className}`} style={style} />;
}
