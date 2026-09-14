import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', type = 'button', disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs':
              variant === 'primary',
            'bg-card text-foreground hover:bg-muted border border-border':
              variant === 'secondary',
            'border border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground':
              variant === 'outline',
            'bg-transparent text-foreground hover:bg-muted hover:text-foreground':
              variant === 'ghost',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs':
              variant === 'destructive',
            'bg-emerald text-white hover:bg-emerald/90 shadow-xs':
              variant === 'success',
            'text-xs px-3 h-8 gap-1.5': size === 'sm',
            'text-sm px-4 h-10 gap-2': size === 'md',
            'text-sm sm:text-base px-5 h-11 gap-2.5': size === 'lg',
          },
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
