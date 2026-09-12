import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-full transition-colors whitespace-nowrap',
          {
            'bg-primary/10 text-primary border border-primary/20': variant === 'default',
            'bg-secondary text-secondary-foreground': variant === 'secondary',
            'border border-border text-foreground': variant === 'outline',
            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20':
              variant === 'success',
            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20':
              variant === 'warning',
            'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20':
              variant === 'info',
            'text-xs px-2.5 py-0.5': size === 'sm',
            'text-xs px-3 py-1 font-semibold': size === 'md',
          },
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

