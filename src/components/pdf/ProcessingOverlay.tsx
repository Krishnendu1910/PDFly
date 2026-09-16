import { type FC, useEffect, useRef } from 'react';
import { CircleNotch } from '@/components/icons';

export interface ProcessingOverlayProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  progressPercent?: number;
}

export const ProcessingOverlay: FC<ProcessingOverlayProps> = ({
  isOpen,
  title = 'Processing PDF...',
  subtitle = 'Everything is computed securely on your device. Please do not close this tab.',
  progressPercent,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus management: capture active element on open and restore on close
  useEffect(() => {
    if (isOpen) {
      if (document.activeElement instanceof HTMLElement) {
        previousActiveElementRef.current = document.activeElement;
      }
      // Focus the dialog container
      dialogRef.current?.focus();

      // Lock body scroll while overlay is open
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
        // Gracefully restore focus only if element is still connected to the DOM
        if (
          previousActiveElementRef.current &&
          typeof previousActiveElementRef.current.focus === 'function' &&
          document.body.contains(previousActiveElementRef.current)
        ) {
          try {
            previousActiveElementRef.current.focus();
          } catch {
            // Ignore focus failures if element was disabled or detached
          }
        }
      };
    }
  }, [isOpen]);

  // Trap focus inside modal and manage keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      dialogRef.current?.focus();
    } else if (e.key === 'Escape') {
      // Intentional UX decision: Processing is an atomic client-side operation.
      // Prevent closing overlay via Escape to avoid orphaned operations or unhandled states.
      e.preventDefault();
    }
  };

  if (!isOpen) return null;

  const isDeterminate = typeof progressPercent === 'number' && progressPercent > 0;
  const clampedPercent = isDeterminate ? Math.min(100, Math.max(0, Math.round(progressPercent))) : 0;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="processing-overlay-title"
      aria-describedby="processing-overlay-status"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4 animate-in fade-in duration-200 outline-none"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl text-center space-y-4 animate-in zoom-in-95 duration-150 motion-reduce:animate-none">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <CircleNotch className="w-6 h-6 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <h3 id="processing-overlay-title" className="text-base font-bold text-foreground">
            {title}
          </h3>
          <p
            id="processing-overlay-status"
            aria-live="polite"
            className="text-xs text-muted-foreground leading-relaxed"
          >
            {subtitle}
          </p>
        </div>

        {isDeterminate ? (
          <div className="space-y-1.5 pt-1">
            <div
              role="progressbar"
              aria-label={title}
              aria-valuenow={clampedPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-full bg-secondary rounded-full h-2 overflow-hidden"
            >
              <div
                className="bg-primary h-full transition-all duration-300 rounded-full motion-reduce:transition-none"
                style={{ width: `${clampedPercent}%` }}
              />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono font-medium text-muted-foreground">
                {clampedPercent}%
              </span>
            </div>
          </div>
        ) : (
          <div
            role="status"
            aria-busy="true"
            aria-label={title}
            className="space-y-1.5 pt-1"
          >
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden relative">
              <div className="bg-primary/70 h-full w-1/3 rounded-full animate-pulse motion-reduce:animate-none mx-auto" />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono font-medium text-muted-foreground">
                Working...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

