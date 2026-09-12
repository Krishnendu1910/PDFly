import { type FC } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

interface StepCardProps {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const StepCard: FC<StepCardProps> = ({ number, title, description, icon: Icon }) => {
  return (
    <Card className="relative overflow-hidden border-border bg-card hover:border-primary/30 transition-colors">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="w-6 h-6" aria-hidden="true" />
          </div>
          <span className="text-3xl font-extrabold text-muted-foreground/30 font-mono">
            {number}
          </span>
        </div>

        <h3 className="text-xl font-bold text-foreground mb-2">
          {title}
        </h3>

        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

