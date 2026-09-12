import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'lg', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'w-full mx-auto px-4 sm:px-6 lg:px-8',
          {
            'max-w-3xl': size === 'sm',
            'max-w-5xl': size === 'md',
            'max-w-7xl': size === 'lg',
            'max-w-[1400px]': size === 'xl',
            'max-w-full': size === 'full',
          },
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Container.displayName = 'Container';

