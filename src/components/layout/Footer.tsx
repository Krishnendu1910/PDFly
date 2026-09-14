import type { FC } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export const Footer: FC = () => {
  return (
    <footer className="w-full border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Top Tier: Brand + Social Icons on Left, Navigation on Right */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border">
          {/* Left: Brand & Icon-Only Social Profiles */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <Link
                to={ROUTES.HOME}
                className="inline-flex items-center gap-2 text-foreground font-bold text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded p-0.5"
                aria-label="PDFly home"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground shadow-xs">
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                <span className="font-display tracking-tight text-base font-bold">PDFly</span>
              </Link>

              {/* Vertical Separator */}
              <span className="h-5 w-px bg-border shrink-0" aria-hidden="true" />

              {/* Icon-Only Social Links */}
              <div className="flex items-center gap-3.5 text-muted-foreground">
                <a
                  href="https://github.com/Krishnendu1910"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <svg
                    className="w-[18px] h-[18px] shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                </a>

                <a
                  href="https://www.linkedin.com/in/krishnendu-sarkar19/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <svg
                    className="w-[18px] h-[18px] shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6z" />
                  </svg>
                </a>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-normal">
              Simple PDF tools that run in your browser.
            </p>
          </div>

          {/* Right: Navigation Links (About, Privacy only) */}
          <nav
            aria-label="Footer Navigation"
            className="flex items-center gap-5 sm:gap-6 text-xs sm:text-sm font-medium text-muted-foreground"
          >
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

        {/* Bottom Tier: Copyright on Left Extreme, Credit on Right Extreme */}
        <div className="pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>&copy; 2026 PDFly</p>
          <p className="flex items-center gap-1.5">
            <span>Made with</span>
            <span className="animate-heartbeat select-none inline-block" role="img" aria-label="love">
              ❤️
            </span>
            <span>by Krishnendu Sarkar</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
