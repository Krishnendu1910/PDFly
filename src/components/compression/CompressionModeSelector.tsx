import { type FC } from 'react';
import { Check, Sparkles, Gauge, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import { COMPRESSION_PROFILES, type CompressionMode } from '@/lib/pdf';

export interface CompressionModeSelectorProps {
  selectedMode: CompressionMode;
  onChange: (mode: CompressionMode) => void;
  disabled?: boolean;
}

const MODES: {
  id: CompressionMode;
  icon: typeof Sparkles;
  badgeText: string;
  badgeVariant: 'default' | 'outline' | 'secondary';
}[] = [
  {
    id: 'quality',
    icon: Sparkles,
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
    icon: Zap,
    badgeText: 'Max Savings',
    badgeVariant: 'secondary',
  },
];

export const CompressionModeSelector: FC<CompressionModeSelectorProps> = ({
  selectedMode,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-3" role="radiogroup" aria-label="Select compression level">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">Compression Level</label>
        <span className="text-xs text-muted-foreground">Select optimization priority</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
    </div>
  );
};

