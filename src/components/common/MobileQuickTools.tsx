import { useState, useEffect, useRef, type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus, X } from '@/components/icons';
import { POPULAR_TOOL_IDS, TOOL_MAP } from '@/constants/tools';
import { ROUTES } from '@/constants/routes';
import { getToolTheme } from '@/lib/theme/toolTheme';
import { cn } from '@/lib/utils/cn';

/**
 * MobileQuickTools provides a persistent floating action button (FAB)
 * on smaller viewports (mobile/tablet < 1024px) for one-tap access to
 * PDFly's top popular tools.
 */
export const MobileQuickTools: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const location = useLocation();

  // Close menu on route navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Dismiss on click-outside or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const quickTools = POPULAR_TOOL_IDS.map((id) => TOOL_MAP[id]).filter(Boolean);

  return (
    <div
      ref={containerRef}
      className="fixed right-4 bottom-5 sm:right-6 sm:bottom-6 z-30 lg:hidden"
      style={{
        bottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))',
        right: 'max(1rem, env(safe-area-inset-right, 1rem))',
      }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-quick-tools-menu"
            role="menu"
            aria-label="Popular tools"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute bottom-full right-0 mb-3 w-56 sm:w-64 rounded-xl border border-border bg-card text-card-foreground shadow-xl p-1.5 focus:outline-none"
          >
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60 mb-1">
              Popular Tools
            </div>
            <div className="space-y-0.5">
              {quickTools.map((tool) => {
                const Icon = tool.icon;
                const theme = getToolTheme(tool.id);
                return (
                  <Link
                    key={tool.id}
                    to={ROUTES.TOOL_DETAIL(tool.slug)}
                    role="menuitem"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted/80 active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors group"
                  >
                    <div
                      className={cn(
                        'w-7 h-7 rounded-md flex items-center justify-center shrink-0 border border-current/10',
                        theme.iconBg,
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                    <span className="flex-1 text-left truncate font-semibold text-[13px] sm:text-[14px]">
                      {tool.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60 px-1.5 py-0.5 rounded bg-muted/60">
                      {tool.category}
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls="mobile-quick-tools-menu"
        aria-label={isOpen ? 'Close popular tools' : 'Open popular tools'}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary text-primary-foreground shadow-lg border border-primary/20 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer"
      >
        <motion.div
          key={isOpen ? 'close' : 'open'}
          initial={shouldReduceMotion ? undefined : { opacity: 0, rotate: isOpen ? -45 : 45 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, rotate: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, rotate: isOpen ? 45 : -45 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="flex items-center justify-center"
        >
          {isOpen ? (
            <X className="w-5 h-5 sm:w-6 sm:h-6" weight="bold" aria-hidden="true" />
          ) : (
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" weight="bold" aria-hidden="true" />
          )}
        </motion.div>
      </button>
    </div>
  );
};

