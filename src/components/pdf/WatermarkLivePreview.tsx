import { useState, useRef, useEffect, type FC, type CSSProperties } from 'react';
import { ChevronLeft, ChevronRight, Eye, RefreshCw, AlertCircle, Stamp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { WatermarkPosition, WatermarkRotation } from '@/lib/pdf';
import type { RenderPagePreviewResult } from '@/lib/pdf/rendering/thumbnail';

export interface WatermarkLivePreviewProps {
  pagePreview: RenderPagePreviewResult | null;
  loading: boolean;
  error?: string | null;
  currentPage: number;
  totalPages: number | null;
  watermarkText: string;
  position: WatermarkPosition;
  rotation: WatermarkRotation;
  opacity: number;
  fontSize: number;
  onPageChange?: (newPage: number) => void;
  disabled?: boolean;
}

export const WatermarkLivePreview: FC<WatermarkLivePreviewProps> = ({
  pagePreview,
  loading,
  error,
  currentPage,
  totalPages,
  watermarkText,
  position,
  rotation,
  opacity,
  fontSize,
  onPageChange,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Measure rendered preview container width accurately with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      if (el.clientWidth > 0) {
        setContainerWidth(el.clientWidth);
      }
    };

    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateWidth);
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, [pagePreview]);

  const effectiveWidth = containerWidth || pagePreview?.renderedWidth || 360;
  const pageWidth = pagePreview?.pageWidth || 595.28;
  const pageHeight = pagePreview?.pageHeight || 841.89;
  const scale = effectiveWidth / pageWidth;
  const displayFontSize = Math.max(10, Math.round(fontSize * scale));

  // Compute watermark placement matching watermark.ts PDF points mapping
  let positionStyle: CSSProperties = {};
  if (rotation === 'diagonal') {
    positionStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) rotate(-45deg)',
      transformOrigin: 'center center',
    };
  } else {
    // Horizontal (0 degrees)
    if (position === 'top') {
      const topPct = (100 / pageHeight) * 100;
      positionStyle = {
        top: `${topPct}%`,
        left: '50%',
        transform: 'translate(-50%, -50%)',
        transformOrigin: 'center center',
      };
    } else if (position === 'bottom') {
      const bottomPct = (100 / pageHeight) * 100;
      positionStyle = {
        bottom: `${bottomPct}%`,
        left: '50%',
        transform: 'translate(-50%, 50%)',
        transformOrigin: 'center center',
      };
    } else {
      // center
      positionStyle = {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        transformOrigin: 'center center',
      };
    }
  }

  const cleanText = watermarkText.trim() || 'SAMPLE';

  return (
    <div
      role="region"
      aria-label="Watermark live preview"
      className="flex flex-col items-center justify-between p-4 sm:p-6 rounded-2xl border border-border bg-secondary/15 h-full min-h-[420px]"
    >
      {/* Top Bar: Preview Label + Multi-Page Navigation */}
      <div className="w-full flex items-center justify-between gap-3 pb-3 mb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Live Preview
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground hidden sm:inline">
            {rotation === 'diagonal' ? 'Diagonal 45°' : `Horizontal · ${position.toUpperCase()}`}
          </span>
        </div>

        {/* Page Selector (Prev / Page X of N / Next) */}
        {totalPages && totalPages > 1 && onPageChange && (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1 || disabled || loading}
              onClick={() => onPageChange(currentPage - 1)}
              className="h-7 px-2 text-xs"
              aria-label="Previous preview page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>

            <span className="font-mono text-xs text-muted-foreground px-1 select-none">
              {`${currentPage} / ${totalPages}`}
            </span>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={currentPage >= totalPages || disabled || loading}
              onClick={() => onPageChange(currentPage + 1)}
              className="h-7 px-2 text-xs"
              aria-label="Next preview page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Main Preview Workspace */}
      <div className="w-full flex-1 flex items-center justify-center py-2">
        {loading && !pagePreview ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 text-muted-foreground min-h-[280px]">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs font-medium">Loading document preview…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 text-muted-foreground min-h-[280px]">
            <AlertCircle className="w-6 h-6 text-amber" />
            <p className="text-xs font-medium text-foreground">Preview unavailable</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">{error}</p>
          </div>
        ) : pagePreview ? (
          <div
            ref={containerRef}
            className="relative w-full max-w-[340px] sm:max-w-[400px] border border-border rounded-lg shadow-md overflow-hidden bg-white select-none transition-all"
            style={{
              aspectRatio: `${pageWidth} / ${pageHeight}`,
            }}
          >
            {/* Rendered PDF Page Image */}
            <img
              src={pagePreview.dataUrl}
              alt={`Page ${currentPage} of document`}
              className="w-full h-full object-contain block select-none pointer-events-none"
            />

            {/* Editor-Only Subtle Alignment Guide */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none border border-primary/20 opacity-0 hover:opacity-100 transition-opacity"
            />

            {/* Live Watermark Overlay */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center"
            >
              <div
                style={{
                  ...positionStyle,
                  position: 'absolute',
                  fontSize: `${displayFontSize}px`,
                  fontFamily: 'Helvetica, Arial, sans-serif',
                  fontWeight: 'bold',
                  color: 'rgb(128, 128, 128)',
                  opacity: Math.max(0.05, Math.min(opacity, 1.0)),
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                  userSelect: 'none',
                  transition: 'opacity 150ms ease-out, transform 150ms ease-out, font-size 150ms ease-out',
                }}
                className="select-none motion-reduce:transition-none"
              >
                {cleanText}
              </div>
            </div>

            {/* Subtle Loading Indicator during page switch */}
            {loading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-2xs flex items-center justify-center text-xs font-medium text-foreground">
                <RefreshCw className="w-4 h-4 animate-spin text-primary mr-1.5" />
                <span>Updating page…</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 text-muted-foreground min-h-[280px]">
            <Stamp className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-xs font-medium">Select a PDF to view watermark preview</p>
          </div>
        )}
      </div>

      {/* Footer Info / Live Synchronized Badge */}
      <div className="w-full pt-3 mt-2 border-t border-border/60 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
          <span>Real-time layout sync</span>
        </span>
        <span>
          {`${Math.round(opacity * 100)}% opacity • ${fontSize} pt`}
        </span>
      </div>
    </div>
  );
};

