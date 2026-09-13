import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export const Footer: FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Top Row: Brand & Description on Left, Navigation on Right */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 pb-5 sm:pb-6 border-b border-border">
          <div className="space-y-1">
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center gap-2 text-foreground font-bold text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              aria-label="PDFly home"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground shadow-xs">
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
              <span className="font-display tracking-tight text-base font-bold">PDFly</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-normal">
              Privacy-first PDF tools that run in your browser.
            </p>
          </div>

          <nav
            aria-label="Footer Navigation"
            className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-muted-foreground"
          >
            <Link
              to={ROUTES.HOME}
              className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-0.5"
            >
              Home
            </Link>
            <Link
              to={ROUTES.TOOLS}
              className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-0.5"
            >
              Tools
            </Link>
            <Link
              to={ROUTES.ABOUT}
              className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-0.5"
            >
              About
            </Link>
            <Link
              to={ROUTES.PRIVACY}
              className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-0.5"
            >
              Privacy
            </Link>
          </nav>
        </div>

        {/* Bottom Row: Copyright on Left, Privacy Statement on Right */}
        <div className="pt-4 sm:pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>&copy; {currentYear} PDFly.All rights reserved.</p>
          <p>Made with ❤️ by Krishnendu Sarkar</p>
        </div>
      </div>
    </footer>
  );
};
