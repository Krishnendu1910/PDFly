import { type FC } from 'react';
import {
  Sparkle,
  Gauge,
  Lightning,
  Check,
  Target,
  WarningCircle,
  type PDFlyIcon,
} from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import { COMPRESSION_PROFILES, type CompressionMode, type TargetSizeUnit } from '@/lib/pdf';

export type { TargetSizeUnit };

export interface CompressionModeSelectorProps {
  selectedMode: CompressionMode;
  onChange: (mode: CompressionMode) => void;
  disabled?: boolean;
  targetSizeValue?: string;
  targetSizeUnit?: TargetSizeUnit;
  onTargetSizeChange?: (value: string, unit: TargetSizeUnit) => void;
  formattedOriginalSize?: string;
  targetSizeError?: string | null;
}

const MODES: {
  id: CompressionMode;
  icon: PDFlyIcon;
  badgeText: string;
  badgeVariant: 'default' | 'outline' | 'secondary';
}[] = [
  {
    id: 'quality',
    icon: Sparkle,
    badgeText: 'High Fidelity',
    badgeVariant: 'outline',
  },
  {
    id: 'balanced',
    icon: Gauge,
    badgeText: 'Recommended',
    badgeVariant: 'default',
  },
  {
    id: 'strong',
    icon: Lightning,
    badgeText: 'Max Savings',
    badgeVariant: 'secondary',
  },
  {
    id: 'target',
    icon: Target,
    badgeText: 'Custom',
    badgeVariant: 'outline',
  },
];

export const CompressionModeSelector: FC<CompressionModeSelectorProps> = ({
  selectedMode,
  onChange,
  disabled = false,
  targetSizeValue = '',
  targetSizeUnit = 'MB',
  onTargetSizeChange,
  formattedOriginalSize,
  targetSizeError,
}) => {
  return (
    <div className="space-y-4" role="radiogroup" aria-label="Select compression level">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">Compression Level</label>
        <span className="text-xs text-muted-foreground">Select optimization priority</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {MODES.map(({ id, icon: Icon, badgeText, badgeVariant }) => {
          const profile = COMPRESSION_PROFILES[id];
          const isSelected = selectedMode === id;

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(id)}
              className={cn(
                'relative flex flex-col p-4 rounded-xl border text-left transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-accent/40',
                disabled && 'opacity-60 pointer-events-none',
              )}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground',
                    )}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span className="font-bold text-sm text-foreground">{profile.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Badge variant={badgeVariant} size="sm" className="text-[10px] font-mono px-1.5 py-0">
                    {badgeText}
                  </Badge>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" aria-hidden="true" />
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed flex-1 mt-1">
                {profile.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Target Size Input Controls */}
      {selectedMode === 'target' && (
        <div className="p-4 sm:p-5 rounded-xl border border-border bg-secondary/20 space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label htmlFor="target-size-input" className="text-sm font-bold text-foreground block">
                Target File Size
              </label>
              <span className="text-xs text-muted-foreground">
                PDFly will try to reduce the file to your target size.
              </span>
            </div>

            {formattedOriginalSize && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 self-start sm:self-auto bg-card px-2.5 py-1 rounded-md border border-border">
                <span>Original size:</span>
                <strong className="font-mono text-foreground font-semibold">
                  {formattedOriginalSize}
                </strong>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                id="target-size-input"
                type="number"
                step="any"
                min="0"
                disabled={disabled}
                value={targetSizeValue}
                onChange={(e) => onTargetSizeChange?.(e.target.value, targetSizeUnit)}
                placeholder="e.g. 2.0"
                aria-label="Target file size numeric value"
                aria-invalid={!!targetSizeError}
                aria-describedby={targetSizeError ? 'target-size-error' : undefined}
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-lg border bg-card text-foreground font-mono text-sm placeholder:text-muted-foreground/60 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  targetSizeError
                    ? 'border-destructive focus-visible:ring-destructive'
                    : 'border-input hover:border-primary/50',
                  disabled && 'opacity-60 cursor-not-allowed',
                )}
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="target-size-unit" className="sr-only">
                Target size unit
              </label>
              <select
                id="target-size-unit"
                disabled={disabled}
                value={targetSizeUnit}
                onChange={(e) => onTargetSizeChange?.(targetSizeValue, e.target.value as TargetSizeUnit)}
                aria-label="Target file size unit"
                className={cn(
                  'h-10 px-3.5 py-2 rounded-lg border border-input bg-card text-foreground font-mono text-sm font-semibold transition-colors cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  disabled && 'opacity-60 cursor-not-allowed',
                )}
              >
                <option value="KB">KB</option>
                <option value="MB">MB</option>
                <option value="GB">GB</option>
              </select>
            </div>
          </div>

          {targetSizeError && (
            <p
              id="target-size-error"
              role="alert"
              className="text-xs text-destructive font-medium flex items-center gap-1.5"
            >
              <WarningCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{targetSizeError}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
