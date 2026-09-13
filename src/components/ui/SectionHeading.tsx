import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface SectionHeadingProps extends HTMLAttributes<HTMLDivElement> {
  badge?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}

export const SectionHeading = forwardRef<HTMLDivElement, SectionHeadingProps>(
  ({ className, badge, title, description, align = 'center', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'space-y-3 mb-12 sm:mb-16',
          align === 'center' ? 'text-center mx-auto max-w-3xl' : 'text-left max-w-2xl',
          className,
        )}
        {...props}
      >
        {badge && (
          <div className={cn('inline-flex', align === 'center' && 'justify-center')}>
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              {badge}
            </span>
          </div>
        )}
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
    );
  },
);

SectionHeading.displayName = 'SectionHeading';

