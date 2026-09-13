import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { Badge } from '@/components/ui/Badge';
import { getToolTheme } from '@/lib/theme/toolTheme';
import { cn } from '@/lib/utils/cn';
import type { ToolDefinition } from '@/types/tools';

interface ToolCardProps {
  tool: ToolDefinition;
  index?: number;
}

export const ToolCard: FC<ToolCardProps> = ({ tool, index = 0 }) => {
  const shouldReduceMotion = useReducedMotion();
  const IconComponent = tool.icon;
  const theme = getToolTheme(tool.id || tool.slug);

  const categoryLabels: Record<string, string> = {
    organize: 'Organize',
    convert: 'Convert',
    optimize: 'Optimize',
    edit: 'Edit',
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 15 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.25, delay: shouldReduceMotion ? 0 : index * 0.05 }}
      className="h-full"
    >
      <Link
        to={ROUTES.TOOL_DETAIL(tool.slug)}
        className={cn(
          'group relative flex flex-col justify-between h-full p-6 rounded-xl border border-border bg-card hover:shadow-md transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          theme.cardHoverBorder,
        )}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105',
                theme.iconBg,
              )}
            >
              <IconComponent className="w-6 h-6" aria-hidden="true" />
            </div>

            <div className="flex items-center gap-1.5">
              {tool.badge && (
                <Badge variant={theme.badgeVariant} size="sm">
                  {tool.badge}
                </Badge>
              )}
              <Badge variant="outline" size="sm" className="capitalize text-muted-foreground">
                {categoryLabels[tool.category] || tool.category}
              </Badge>
            </div>
          </div>

          <h3
            className={cn(
              'font-display text-lg font-semibold text-foreground transition-colors mb-2 flex items-center gap-1',
              theme.cardHoverText,
            )}
          >
            {tool.name}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {tool.description}
          </p>
        </div>

        <div
          className={cn(
            'mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs font-medium text-muted-foreground transition-colors',
            theme.cardHoverText,
          )}
        >
          <span>Open tool</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </div>
      </Link>
    </motion.div>
  );
};

