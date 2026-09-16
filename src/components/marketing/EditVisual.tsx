import type { FC } from 'react';
import { Crop, Hash, Stamp, PenNib, CheckCircle } from '@/components/icons';

export const EditVisual: FC = () => {
  return (
    <div className="relative w-full max-w-md mx-auto p-5 sm:p-6 rounded-xl border border-border bg-card shadow-sm select-none" aria-hidden="true">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border text-xs">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-violet/10 text-violet flex items-center justify-center font-bold">
            <PenNib className="w-3.5 h-3.5" />
          </span>
          <span className="font-semibold text-foreground">Document Finishing Suite</span>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
          Vector Stamp Overlay
        </span>
      </div>

      {/* Simulated Document Canvas with Overlay Tools */}
      <div className="relative my-4 p-4 rounded-lg bg-muted/20 border border-border overflow-hidden min-h-[220px] flex flex-col justify-between">
        {/* Angled Watermark Stamp */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 -rotate-12 select-none">
          <span className="text-3xl font-extrabold uppercase tracking-widest text-violet border-2 border-violet px-4 py-1 rounded">
            CONFIDENTIAL
          </span>
        </div>

        {/* Top: Crop Indicator Box */}
        <div className="relative border border-dashed border-amber/70 rounded p-2.5 bg-amber/5">
          <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-amber" />
          <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-amber" />
          <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-amber" />
          <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-amber" />
          <div className="flex items-center justify-between text-[10px] text-amber font-semibold pb-1.5">
            <span className="flex items-center gap-1">
              <Crop className="w-3 h-3" /> Crop Box
            </span>
            <span className="font-mono">595 &times; 842 pt</span>
          </div>
          <div className="space-y-1.5">
            <div className="h-1.5 w-3/4 bg-foreground/15 rounded" />
            <div className="h-1.5 w-full bg-foreground/10 rounded" />
          </div>
        </div>

        {/* Middle Document simulated lines */}
        <div className="space-y-1.5 my-2">
          <div className="h-1.5 w-full bg-foreground/10 rounded" />
          <div className="h-1.5 w-5/6 bg-foreground/10 rounded" />
        </div>

        {/* Bottom Finishing Elements: Page Number & Signature */}
        <div className="pt-2 border-t border-border/80 flex items-end justify-between gap-2">
          {/* Page Number Pill */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cobalt/10 text-cobalt text-[11px] font-mono font-medium">
            <Hash className="w-3 h-3" />
            <span>Page 1 of 8</span>
          </div>

          {/* Draggable Free Signature Stamp */}
          <div className="p-2 rounded-lg bg-card border border-violet/30 shadow-xs ring-1 ring-violet/20 flex items-center gap-2">
            <PenNib className="w-3.5 h-3.5 text-violet shrink-0" />
            <div>
              <p className="font-serif italic text-xs text-foreground leading-none">Jane Smith</p>
              <p className="text-[9px] text-emerald font-medium flex items-center gap-0.5 mt-0.5">
                <CheckCircle className="w-2.5 h-2.5" /> Placed freely
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Features Strip */}
      <div className="grid grid-cols-4 gap-2 pt-1 text-[11px] text-muted-foreground text-center">
        <div className="flex items-center justify-center gap-1 p-1 rounded bg-muted/40">
          <Crop className="w-3 h-3 text-amber" />
          <span>Crop</span>
        </div>
        <div className="flex items-center justify-center gap-1 p-1 rounded bg-muted/40">
          <Hash className="w-3 h-3 text-cobalt" />
          <span>Numbers</span>
        </div>
        <div className="flex items-center justify-center gap-1 p-1 rounded bg-muted/40">
          <Stamp className="w-3 h-3 text-violet" />
          <span>Watermark</span>
        </div>
        <div className="flex items-center justify-center gap-1 p-1 rounded bg-muted/40">
          <PenNib className="w-3 h-3 text-violet" />
          <span>Sign</span>
        </div>
      </div>
    </div>
  );
};
