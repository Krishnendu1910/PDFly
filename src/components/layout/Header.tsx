import { useState, useEffect, useRef, type FC } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { FileText, Menu, X } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { label: 'Tools', to: ROUTES.TOOLS },
  { label: 'About', to: ROUTES.ABOUT },
  { label: 'Privacy', to: ROUTES.PRIVACY },
];

export const Header: FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navContainerRef = useRef<HTMLElement>(null);
  const firstNavLinkRef = useRef<HTMLAnchorElement>(null);
  const lastNavLinkRef = useRef<HTMLAnchorElement>(null);

  // Close mobile navigation on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  // Manage keyboard focus and containment in mobile navigation
  useEffect(() => {
    if (!mobileMenuOpen) return;

    // Focus the first link upon opening
    firstNavLinkRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileMenuOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key === 'Tab') {
        const trigger = triggerRef.current;
        const firstLink = firstNavLinkRef.current;
        const lastLink = lastNavLinkRef.current;

        if (event.shiftKey) {
          // Shift + Tab: backwards
          if (document.activeElement === firstLink) {
            event.preventDefault();
            trigger?.focus();
          } else if (document.activeElement === trigger) {
            event.preventDefault();
            lastLink?.focus();
          }
        } else {
          // Tab: forwards
          if (document.activeElement === lastLink) {
            event.preventDefault();
            trigger?.focus();
          } else if (document.activeElement === trigger) {
            event.preventDefault();
            firstLink?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          to={ROUTES.HOME}
          className="flex items-center gap-2.5 text-foreground font-bold text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1"
          aria-label="PDFly home"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-xs">
            <FileText className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="font-display tracking-tight">PDFly</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <nav aria-label="Main Navigation" className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'px-3.5 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-secondary text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="border-l border-border pl-4">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Hamburger & Theme Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 top-16 bg-black/40 backdrop-blur-xs z-30 md:hidden"
              onClick={() => {
                setMobileMenuOpen(false);
                triggerRef.current?.focus();
              }}
              aria-hidden="true"
            />

            {/* Menu Panel */}
            <motion.nav
              id="mobile-navigation"
              ref={navContainerRef}
              aria-label="Mobile Navigation"
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0, y: -10 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 left-0 right-0 border-b border-border bg-background p-4 shadow-lg z-40 md:hidden flex flex-col gap-1"
            >
              {navItems.map((item, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === navItems.length - 1;

                return (
                  <NavLink
                    key={item.to}
                    ref={isFirst ? firstNavLinkRef : isLast ? lastNavLinkRef : undefined}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'px-4 py-3 rounded-lg text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isActive
                          ? 'bg-secondary text-primary font-semibold'
                          : 'text-foreground hover:bg-accent',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                );
              })}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
