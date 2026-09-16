import { type FC, useId, useState, useEffect } from 'react';
import { WarningCircle, CheckCircle } from '@/components/icons';
import { parsePageRange } from '@/lib/pdf';
import { cn } from '@/lib/utils/cn';

export interface RangeInputProps {
  totalPages: number;
  value: string;
  onChange: (value: string, isValid: boolean, pageCount: number) => void;
  disabled?: boolean;
}

export const RangeInput: FC<RangeInputProps> = ({
  totalPages,
  value,
  onChange,
  disabled = false,
}) => {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState<number>(0);

  useEffect(() => {
    if (!value.trim()) {
      setError(null);
      setParsedCount(0);
      onChange(value, false, 0);
      return;
    }

    try {
      const res = parsePageRange(value, totalPages);
      setError(null);
      setParsedCount(res.pages.length);
      onChange(value, true, res.pages.length);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid page range format.';
      setError(msg);
      setParsedCount(0);
      onChange(value, false, 0);
    }
  }, [value, totalPages, onChange]);

  const setPreset = (presetValue: string) => {
    onChange(presetValue, true, 0);
  };

  const getOddPages = () => {
    const odds: number[] = [];
    for (let i = 1; i <= totalPages; i += 2) odds.push(i);
    return odds.join(', ');
  };

  const getEvenPages = () => {
    const evens: number[] = [];
    for (let i = 2; i <= totalPages; i += 2) evens.push(i);
    return evens.join(', ');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
          Page Selection Range
        </label>
        <span className="text-xs text-muted-foreground font-mono">
          Document has <strong>{totalPages}</strong> {totalPages === 1 ? 'page' : 'pages'}
        </span>
      </div>

      {/* Input row */}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value, false, 0)}
          disabled={disabled}
          placeholder="e.g. 1-3, 5, 8-10"
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border bg-background text-sm font-mono transition-colors shadow-xs',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
            error
              ? 'border-destructive focus:ring-destructive'
              : 'border-border focus:border-primary',
            disabled && 'opacity-60 cursor-not-allowed',
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : `${inputId}-help`}
        />

        {parsedCount > 0 && !error && (
          <div className="absolute right-3 top-2.5 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle className="w-4 h-4" aria-hidden="true" />
            <span>{parsedCount} {parsedCount === 1 ? 'page' : 'pages'} selected</span>
          </div>
        )}
      </div>

      {/* Feedback / Help text */}
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-destructive flex items-center gap-1.5 font-medium">
          <WarningCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : (
        <p id={`${inputId}-help`} className="text-xs text-muted-foreground">
          Enter single pages or ranges separated by commas (e.g. <code>1-3, 5</code>).
        </p>
      )}

      {/* Quick selection chips */}
      <div className="pt-1 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground mr-1">Presets:</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setPreset(`1-${totalPages}`)}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          All Pages (1-{totalPages})
        </button>
        {totalPages > 1 && (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setPreset(getOddPages())}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Odd Pages
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setPreset(getEvenPages())}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Even Pages
            </button>
          </>
        )}
      </div>
    </div>
  );
};

