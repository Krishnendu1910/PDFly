import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { Badge } from '@/components/ui/Badge';
import type { ToolDefinition } from '@/types/tools';

interface ToolCardProps {
  tool: ToolDefinition;
  index?: number;
}

export const ToolCard: FC<ToolCardProps> = ({ tool, index = 0 }) => {
  const shouldReduceMotion = useReducedMotion();
  const IconComponent = tool.icon;

  const categoryLabels: Record<string, string> = {
    organize: 'Organize',
    convert: 'Convert',
    optimize: 'Optimize',
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
        className="group relative flex flex-col justify-between h-full p-6 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform duration-200 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground">
              <IconComponent className="w-6 h-6" aria-hidden="true" />
            </div>

            <div className="flex items-center gap-1.5">
              {tool.badge && (
                <Badge variant="default" size="sm">
                  {tool.badge}
                </Badge>
              )}
              <Badge variant="outline" size="sm" className="capitalize text-muted-foreground">
                {categoryLabels[tool.category] || tool.category}
              </Badge>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2 flex items-center gap-1">
            {tool.name}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {tool.description}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
          <span>Open tool</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </div>
      </Link>
    </motion.div>
  );
};

