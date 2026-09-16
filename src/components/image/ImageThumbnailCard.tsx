import { type FC, type DragEvent } from 'react';
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  Trash,
  DotsSixVertical,
  WarningCircle,
} from '@/components/icons';
import { Image as ImageIcon } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import type { ImageDescriptor } from '@/lib/pdf/images';

export interface ImageThumbnailCardProps {
  item: ImageDescriptor;
  displayIndex: number;
  totalDisplayCount: number;
  onRotateClockwise: (id: string) => void;
  onRotateCounterClockwise: (id: string) => void;
  onMoveLeft: (index: number) => void;
  onMoveRight: (index: number) => void;
  onRemove: (id: string) => void;
  draggable?: boolean;
  isDragTarget?: boolean;
  onDragStart?: (e: DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>, index: number) => void;
  onDragLeave?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>, index: number) => void;
  disabled?: boolean;
}

export const ImageThumbnailCard: FC<ImageThumbnailCardProps> = ({
  item,
  displayIndex,
  totalDisplayCount,
  onRotateClockwise,
  onRotateCounterClockwise,
  onMoveLeft,
  onMoveRight,
  onRemove,
  draggable = true,
  isDragTarget = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  disabled = false,
}) => {
  const isFirst = displayIndex === 0;
  const isLast = displayIndex === totalDisplayCount - 1;
  const { managedFile, dimensions, rotation, format, previewUrl, status, errorMessage } = item;

  return (
    <div
      draggable={draggable && !disabled && status !== 'error'}
      onDragStart={(e) => onDragStart?.(e, displayIndex)}
      onDragOver={(e) => onDragOver?.(e, displayIndex)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop?.(e, displayIndex)}
      className={cn(
        'group relative flex flex-col rounded-xl border bg-card p-3 shadow-xs transition-all duration-150 select-none',
        isDragTarget && 'border-primary ring-2 ring-primary/40 bg-primary/5 scale-[1.02] shadow-md',
        status === 'error' && 'border-destructive/50 bg-destructive/5',
        !isDragTarget && status !== 'error' && 'border-border hover:border-primary/40',
        draggable && !disabled && status !== 'error' && 'cursor-grab active:cursor-grabbing',
        disabled && 'opacity-60 pointer-events-none',
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {draggable && !disabled && status !== 'error' && (
            <DotsSixVertical
              className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0"
              aria-hidden="true"
            />
          )}

          <Badge variant="secondary" size="sm" className="font-mono text-[10px] px-1.5 py-0 shrink-0">
            #{displayIndex + 1}
          </Badge>

          <span
            className="text-xs font-semibold text-foreground truncate"
            title={managedFile.name}
          >
            {managedFile.name}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Badge variant="outline" size="sm" className="text-[10px] uppercase font-mono px-1 py-0">
            {format}
          </Badge>
          {rotation !== 0 && (
            <Badge variant="default" size="sm" className="text-[10px] font-mono px-1 py-0">
              {rotation}°
            </Badge>
          )}
        </div>
      </div>

      {/* Preview Thumbnail Container */}
      <div className="relative aspect-[4/3] w-full rounded-lg bg-secondary/50 border border-border/80 overflow-hidden flex items-center justify-center p-1">
        {status === 'error' ? (
          <div className="flex flex-col items-center justify-center p-3 text-center text-destructive">
            <WarningCircle className="w-6 h-6 mb-1.5 shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold">Image Error</span>
            <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
              {errorMessage || 'Failed to load'}
            </span>
          </div>
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt={`Preview of image #${displayIndex + 1}: ${managedFile.name}`}
            className="max-w-full max-h-full object-contain transition-transform duration-200 pointer-events-none"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="w-8 h-8 opacity-40 mb-1" aria-hidden="true" />
            <span className="text-[11px]">Loading...</span>
          </div>
        )}
      </div>

      {/* Dimensions & File Size Info */}
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground font-mono px-0.5">
        <span>{managedFile.formattedSize}</span>
        {dimensions ? (
          <span>
            {dimensions.width} × {dimensions.height}
          </span>
        ) : (
          <span className="opacity-60">Detecting...</span>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between gap-1">
        {/* Reordering Controls (Keyboard Accessible) */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={disabled || isFirst}
            onClick={() => onMoveLeft(displayIndex)}
            aria-label={`Move image #${displayIndex + 1} (${managedFile.name}) left`}
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
            aria-label={`Move image #${displayIndex + 1} (${managedFile.name}) right`}
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

        {/* Rotate Controls */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={disabled || status === 'error'}
            onClick={() => onRotateCounterClockwise(item.id)}
            aria-label={`Rotate image #${displayIndex + 1} 90 degrees counter-clockwise`}
            title="Rotate 90° CCW"
            className={cn(
              'p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:opacity-30 disabled:pointer-events-none',
            )}
          >
            <ArrowCounterClockwise className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={disabled || status === 'error'}
            onClick={() => onRotateClockwise(item.id)}
            aria-label={`Rotate image #${displayIndex + 1} 90 degrees clockwise`}
            title="Rotate 90° CW"
            className={cn(
              'p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:opacity-30 disabled:pointer-events-none',
            )}
          >
            <ArrowClockwise className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Remove Control */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRemove(item.id)}
          aria-label={`Remove image #${displayIndex + 1}: ${managedFile.name}`}
          title="Remove image"
          className={cn(
            'p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <Trash className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
