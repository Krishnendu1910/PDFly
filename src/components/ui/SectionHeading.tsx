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
          'space-y-2 mb-8 sm:mb-10',
          align === 'center' ? 'text-center mx-auto max-w-3xl' : 'text-left max-w-2xl',
          className,
        )}
        {...props}
      >
        {badge && (
          <div className={cn('inline-flex', align === 'center' && 'justify-center')}>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {badge}
            </span>
          </div>
        )}
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
    );
  },
);

SectionHeading.displayName = 'SectionHeading';

