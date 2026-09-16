import { type FC } from 'react';
import { WarningCircle, X } from '@/components/icons';
import type { FileValidationError } from '@/types/file';

export interface FileErrorBannerProps {
  errors: readonly FileValidationError[];
  onDismiss?: () => void;
  title?: string;
}

export const FileErrorBanner: FC<FileErrorBannerProps> = ({ errors, onDismiss, title }) => {
  if (!errors.length) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive-foreground flex items-start justify-between gap-3 shadow-xs animate-in fade-in duration-150"
    >
      <div className="flex items-start gap-3 min-w-0">
        <WarningCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-foreground">
            {title || (errors.length === 1 ? 'Unable to add file' : `${errors.length} files could not be added`)}
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
            {errors.map((err, idx) => (
              <li key={`${err.code}-${err.fileName ?? idx}`} className="truncate">
                {err.message}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss errors"
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-destructive/20 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

