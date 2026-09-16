import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from '@/components/icons';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/Button';

export const CTASection: FC = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-secondary/30 p-8 sm:p-12 lg:p-16 text-center">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-2">
          <FileText className="w-6 h-6" aria-hidden="true" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Ready to work with your PDFs?
        </h2>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Manipulate, reorder, convert, and optimize documents with clean tools designed to run directly in your browser.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={ROUTES.TOOLS}>
            <Button size="lg" className="w-full sm:w-auto">
              Explore Tools
              <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden="true" />
            </Button>
          </Link>
          <Link to={ROUTES.ABOUT}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Learn Our Architecture
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

