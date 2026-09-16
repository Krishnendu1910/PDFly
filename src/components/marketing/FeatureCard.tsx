import { type FC } from 'react';
import type { PDFlyIcon } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/Card';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: PDFlyIcon;
}

export const FeatureCard: FC<FeatureCardProps> = ({ title, description, icon: Icon }) => {
  return (
    <Card className="border-border bg-card hover:border-primary/30 transition-all hover:shadow-sm">
      <CardContent className="p-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

