import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { getToolTheme } from '@/lib/theme/toolTheme';
import { cn } from '@/lib/utils/cn';
import type { ToolDefinition } from '@/types/tools';

interface ToolCardProps {
  tool: ToolDefinition;
  index?: number;
  variant?: 'default' | 'minimal';
}

export const ToolCard: FC<ToolCardProps> = ({ tool, index = 0, variant = 'default' }) => {
  const shouldReduceMotion = useReducedMotion();
  const IconComponent = tool.icon;
  const theme = getToolTheme(tool.id || tool.slug);

  const categoryLabels: Record<string, string> = {
    organize: 'Organize',
    convert: 'Convert',
    optimize: 'Optimize',
    edit: 'Edit',
  };

  const isMinimal = variant === 'minimal';

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.2, delay: shouldReduceMotion ? 0 : index * 0.03 }}
      className="h-full"
    >
      <Link
        to={ROUTES.TOOL_DETAIL(tool.slug)}
        aria-label={`${tool.name} - ${tool.shortDescription || tool.description}`}
        className={cn(
          'group relative flex flex-col justify-between h-full rounded-lg border border-border bg-card overflow-hidden',
          'transition-all duration-200 ease-out',
          'hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 hover:shadow-xs',
          'motion-reduce:hover:translate-y-0 motion-reduce:transition-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          isMinimal ? 'p-5' : 'p-6',
        )}
      >
        {/* Subtle Tool Accent Edge (Left Document Spine) */}
        <span
          className={cn(
            'absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg transition-all duration-200',
            theme.accentBg,
            'opacity-50 dark:opacity-60 group-hover:opacity-100 group-hover:w-[3.5px]',
          )}
          aria-hidden="true"
        />

        <div>
          {/* Top Row: Tool Icon Badge on Left, Action Arrow on Right */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div
              className={cn(
                'w-11 h-11 rounded-[9px] flex items-center justify-center shrink-0 border border-current/10 transition-colors duration-200',
                theme.iconBg,
              )}
            >
              <IconComponent className="w-5 h-5" aria-hidden="true" />
            </div>

            <div className="pt-1 text-muted-foreground/40 group-hover:text-foreground transition-colors duration-200">
              <ArrowRight
                className="w-4 h-4 transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Middle: Title & Description */}
          <h3 className="font-display text-[16px] sm:text-[17px] font-semibold text-foreground tracking-tight mb-1.5 flex items-center gap-1 group-hover:text-foreground transition-colors">
            {tool.name}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {isMinimal ? (tool.shortDescription || tool.description) : tool.description}
          </p>
        </div>

        {/* Bottom Row: Subtle Category Indicator Rule */}
        <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
          <span>{categoryLabels[tool.category] || tool.category}</span>
        </div>
      </Link>
    </motion.div>
  );
};

