import type { FC } from 'react';
import { Stack, Scissors, ArrowClockwise, ArrowsDownUp, FileMinus, Export, Check } from '@/components/icons';

export const OrganizeVisual: FC = () => {
  return (
    <div className="relative w-full max-w-md mx-auto p-5 sm:p-6 rounded-xl border border-border bg-card shadow-sm select-none" aria-hidden="true">
      {/* Top action rail */}
      <div className="flex items-center justify-between pb-4 border-b border-border text-xs">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-cobalt/10 text-cobalt flex items-center justify-center font-bold">
            <ArrowsDownUp className="w-3.5 h-3.5" />
          </span>
          <span className="font-semibold text-foreground">Interactive Page Sequence</span>
        </div>
        <span className="text-[11px] font-mono text-emerald bg-emerald/10 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
          <Check className="w-3 h-3" /> 6 Pages Loaded
        </span>
      </div>

      {/* Interactive Page Thumbnails Grid */}
      <div className="grid grid-cols-3 gap-3 my-4">
        {/* Page 1: Standard */}
        <div className="relative p-2.5 rounded-lg border border-border bg-muted/20 flex flex-col justify-between aspect-[3/4] shadow-xs">
          <span className="text-[10px] font-mono text-muted-foreground font-bold">01</span>
          <div className="space-y-1 my-auto">
            <div className="h-1.5 w-full bg-foreground/15 rounded" />
            <div className="h-1.5 w-3/4 bg-foreground/10 rounded" />
            <div className="h-1.5 w-4/5 bg-foreground/10 rounded" />
          </div>
          <span className="text-[9px] font-medium text-muted-foreground text-center">Original</span>
        </div>

        {/* Page 2: Rotated 90° */}
        <div className="relative p-2.5 rounded-lg border border-amber/30 bg-amber/5 flex flex-col justify-between aspect-[3/4] shadow-xs ring-1 ring-amber/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-amber font-bold">02</span>
            <ArrowClockwise className="w-3 h-3 text-amber" />
          </div>
          <div className="space-y-1 my-auto rotate-90 scale-90">
            <div className="h-1.5 w-full bg-amber/30 rounded" />
            <div className="h-1.5 w-3/4 bg-amber/20 rounded" />
          </div>
          <span className="text-[9px] font-semibold text-amber text-center">Rotated 90&deg;</span>
        </div>

        {/* Page 3: Reordered */}
        <div className="relative p-2.5 rounded-lg border border-violet/30 bg-violet/5 flex flex-col justify-between aspect-[3/4] shadow-xs ring-1 ring-violet/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-violet font-bold">03</span>
            <ArrowsDownUp className="w-3 h-3 text-violet" />
          </div>
          <div className="space-y-1 my-auto">
            <div className="h-1.5 w-full bg-violet/30 rounded" />
            <div className="h-1.5 w-2/3 bg-violet/20 rounded" />
          </div>
          <span className="text-[9px] font-semibold text-violet text-center">Reordered</span>
        </div>

        {/* Page 4: Removed */}
        <div className="relative p-2.5 rounded-lg border border-dashed border-vermillion/40 bg-vermillion/5 flex flex-col justify-between aspect-[3/4] opacity-65">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-vermillion font-bold line-through">04</span>
            <FileMinus className="w-3 h-3 text-vermillion" />
          </div>
          <div className="my-auto text-center">
            <span className="text-[10px] text-vermillion font-semibold">Removed</span>
          </div>
          <span className="text-[9px] font-medium text-vermillion/70 text-center">Excluded</span>
        </div>

        {/* Page 5: Extracted */}
        <div className="relative p-2.5 rounded-lg border border-teal/30 bg-teal/5 flex flex-col justify-between aspect-[3/4] shadow-xs ring-1 ring-teal/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-teal font-bold">05</span>
            <Export className="w-3 h-3 text-teal" />
          </div>
          <div className="space-y-1 my-auto">
            <div className="h-1.5 w-full bg-teal/30 rounded" />
            <div className="h-1.5 w-4/5 bg-teal/20 rounded" />
          </div>
          <span className="text-[9px] font-semibold text-teal text-center">Extracted</span>
        </div>

        {/* Page 6: Merged */}
        <div className="relative p-2.5 rounded-lg border border-cobalt/30 bg-cobalt/5 flex flex-col justify-between aspect-[3/4] shadow-xs ring-1 ring-cobalt/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-cobalt font-bold">06</span>
            <Stack className="w-3 h-3 text-cobalt" />
          </div>
          <div className="space-y-1 my-auto">
            <div className="h-1.5 w-full bg-cobalt/30 rounded" />
            <div className="h-1.5 w-3/4 bg-cobalt/20 rounded" />
          </div>
          <span className="text-[9px] font-semibold text-cobalt text-center">Appended</span>
        </div>
      </div>

      {/* Bottom status badge */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Scissors className="w-3.5 h-3.5 text-vermillion" />
          <span>Non-destructive client manipulation</span>
        </span>
        <span className="font-mono text-[11px] font-medium">100% In-Memory</span>
      </div>
    </div>
  );
};

