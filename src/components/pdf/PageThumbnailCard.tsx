import { type FC, type DragEvent } from 'react';
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  Trash,
  Check,
  DotsSixVertical,
} from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import type { PdfRotationAngle } from '@/lib/pdf';

export interface PageThumbnailCardProps {
  pageNumber: number;
  displayIndex: number;
  totalDisplayPages: number;
  rotation: PdfRotationAngle;
  thumbnailUrl?: string;
  thumbnailStatus?: 'loading' | 'loaded' | 'error';
  isSelected?: boolean;
  onToggleSelect?: (pageNumber: number) => void;
  onRotateClockwise?: (pageNumber: number) => void;
  onRotateCounterClockwise?: (pageNumber: number) => void;
  onMoveLeft?: (index: number) => void;
  onMoveRight?: (index: number) => void;
  onRemove?: (pageNumber: number) => void;
  draggable?: boolean;
  isDragTarget?: boolean;
  onDragStart?: (e: DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>, index: number) => void;
  onDragLeave?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>, index: number) => void;
  showReorderControls?: boolean;
  showRotateControls?: boolean;
  showSelectControl?: boolean;
  showRemoveControl?: boolean;
  disabled?: boolean;
}

export const PageThumbnailCard: FC<PageThumbnailCardProps> = ({
  pageNumber,
  displayIndex,
  totalDisplayPages,
  rotation,
  thumbnailUrl,
  thumbnailStatus = 'loaded',
  isSelected = false,
  onToggleSelect,
  onRotateClockwise,
  onRotateCounterClockwise,
  onMoveLeft,
  onMoveRight,
  onRemove,
  draggable = false,
  isDragTarget = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  showReorderControls = false,
  showRotateControls = false,
  showSelectControl = false,
  showRemoveControl = false,
  disabled = false,
}) => {
  const isFirst = displayIndex === 0;
  const isLast = displayIndex === totalDisplayPages - 1;

  return (
    <div
      draggable={draggable && !disabled}
      onDragStart={(e) => onDragStart?.(e, displayIndex)}
      onDragOver={(e) => onDragOver?.(e, displayIndex)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop?.(e, displayIndex)}
      className={cn(
        'group relative flex flex-col rounded-xl border bg-card p-3 shadow-xs transition-all duration-150 select-none',
        isDragTarget && 'border-primary ring-2 ring-primary/40 bg-primary/5 scale-[1.02] shadow-md',
        isSelected && !isDragTarget && 'border-primary ring-2 ring-primary/20',
        !isSelected && !isDragTarget && 'border-border hover:border-primary/40',
        draggable && !disabled && 'cursor-grab active:cursor-grabbing',
        disabled && 'opacity-60 pointer-events-none',
      )}
    >
      {/* Top Header / Badges */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          {draggable && !disabled && (
            <DotsSixVertical
              className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0"
              aria-hidden="true"
            />
          )}

          {showSelectControl && onToggleSelect && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onToggleSelect(pageNumber)}
              aria-label={`Select page ${pageNumber}`}
              className={cn(
                'w-5 h-5 rounded border flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border bg-background hover:border-primary/50 text-transparent',
              )}
            >
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}

          <span className="text-xs font-bold text-foreground font-mono">
            Page {pageNumber}
          </span>
        </div>

        {rotation !== 0 && (
          <Badge variant="secondary" size="sm" className="text-[10px] font-mono">
            {rotation}°
          </Badge>
        )}
      </div>

      {/* Visual Thumbnail Area */}
      <div className="relative aspect-[3/4] w-full rounded-lg bg-secondary/50 border border-border/80 overflow-hidden flex items-center justify-center">
        {thumbnailStatus === 'loading' ? (
          <div className="flex flex-col items-center justify-center p-4 text-xs text-muted-foreground animate-pulse">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2" />
            <span>Loading...</span>
          </div>
        ) : thumbnailStatus === 'error' || !thumbnailUrl ? (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <span className="text-xs font-medium text-muted-foreground">Preview unavailable</span>
            <span className="text-[10px] text-muted-foreground/80 mt-0.5 font-mono">Page {pageNumber}</span>
          </div>
        ) : (
          <img
            src={thumbnailUrl}
            alt={`Preview of page ${pageNumber}`}
            loading="lazy"
            className="w-full h-full object-contain transition-transform duration-200 pointer-events-none"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        )}
      </div>

      {/* Action Controls Toolbar */}
      <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between gap-1">
        {/* Reordering controls (Move Left / Move Right) */}
        {showReorderControls && onMoveLeft && onMoveRight && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              disabled={disabled || isFirst}
              onClick={() => onMoveLeft(displayIndex)}
              aria-label={`Move page ${pageNumber} left`}
              title="Move left"
              className={cn(
                'p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:opacity-30 disabled:pointer-events-none',
              )}
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={disabled || isLast}
              onClick={() => onMoveRight(displayIndex)}
              aria-label={`Move page ${pageNumber} right`}
              title="Move right"
              className={cn(
                'p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:opacity-30 disabled:pointer-events-none',
              )}
            >
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Rotate controls (Rotate CCW / CW) */}
        {showRotateControls && onRotateCounterClockwise && onRotateClockwise && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRotateCounterClockwise(pageNumber)}
              aria-label={`Rotate page ${pageNumber} 90 degrees counter-clockwise`}
              title="Rotate counter-clockwise (90°)"
              className={cn(
                'p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <ArrowCounterClockwise className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRotateClockwise(pageNumber)}
              aria-label={`Rotate page ${pageNumber} 90 degrees clockwise`}
              title="Rotate clockwise (90°)"
              className={cn(
                'p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <ArrowClockwise className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Remove control */}
        {showRemoveControl && onRemove && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onRemove(pageNumber)}
            aria-label={`Remove page ${pageNumber}`}
            title="Remove page"
            className={cn(
              'p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <Trash className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
