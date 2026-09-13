import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'outline'
    | 'success'
    | 'warning'
    | 'info'
    | 'cobalt'
    | 'vermillion'
    | 'emerald'
    | 'amber'
    | 'violet'
    | 'coral'
    | 'teal';
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
            'bg-emerald/10 text-emerald border border-emerald/20':
              variant === 'success' || variant === 'emerald',
            'bg-amber/10 text-amber border border-amber/20':
              variant === 'warning' || variant === 'amber',
            'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20':
              variant === 'info',
            'bg-cobalt/10 text-cobalt border border-cobalt/20': variant === 'cobalt',
            'bg-vermillion/10 text-vermillion border border-vermillion/20': variant === 'vermillion',
            'bg-violet/10 text-violet border border-violet/20': variant === 'violet',
            'bg-coral/10 text-coral border border-coral/20': variant === 'coral',
            'bg-teal/10 text-teal border border-teal/20': variant === 'teal',
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

