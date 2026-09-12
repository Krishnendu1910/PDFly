import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export const NotFoundPage: FC = () => {
  useDocumentTitle('Page Not Found', 'The requested page could not be located on PDFly.');
  return (
    <div className="py-24 sm:py-32">
      <Container size="sm" className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted text-muted-foreground mb-6">
          <FileQuestion className="w-8 h-8" aria-hidden="true" />
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-foreground tracking-tight mb-3">
          404
        </h1>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">
          Page Not Found
        </h2>

        <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
          The requested page could not be located. It may have been moved or does not exist.
        </p>

        <Link to={ROUTES.HOME}>
          <Button size="md">
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Return to Homepage
          </Button>
        </Link>
      </Container>
    </div>
  );
};
