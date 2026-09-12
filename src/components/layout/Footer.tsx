import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export const Footer: FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-border">
          <div className="space-y-2 max-w-sm">
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-2 text-foreground font-bold text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              aria-label="PDFly home"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground shadow-xs">
                <FileText className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="tracking-tight">PDFly</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fast, privacy-first PDF tools designed for local browser processing without remote server uploads.
            </p>
          </div>

          <nav
            aria-label="Footer Navigation"
            className="flex flex-wrap items-center gap-6 sm:gap-8 text-sm font-medium text-muted-foreground"
          >
            <Link
              to={ROUTES.HOME}
              className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
            >
              Home
            </Link>
            <Link
              to={ROUTES.TOOLS}
              className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
            >
              Tools
            </Link>
            <Link
              to={ROUTES.ABOUT}
              className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
            >
              About
            </Link>
            <Link
              to={ROUTES.PRIVACY}
              className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
            >
              Privacy
            </Link>
          </nav>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {currentYear} PDFly. Open browser-based toolkit.</p>
          <p>Designed for local client-side document workflows.</p>
        </div>
      </div>
    </footer>
  );
};
