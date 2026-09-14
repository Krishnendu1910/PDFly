import type { FC } from 'react';
import {
  FileText,
  Layers,
  Scissors,
  RotateCw,
  Minimize2,
  PenLine,
  CheckCircle2,
  Crop,
} from 'lucide-react';

export const HeroVisual: FC = () => {
  return (
    <div className="relative w-full max-w-md lg:max-w-lg mx-auto select-none" aria-hidden="true">
      {/* Decorative ambient backdrop */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-primary/5 via-transparent to-cobalt/5 rounded-2xl blur-xl pointer-events-none" />

      {/* Main Document Preview Card */}
      <div className="relative bg-card rounded-xl border border-border shadow-md p-5 sm:p-6 overflow-hidden">
        {/* Document Header Bar */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border text-xs">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <span className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="w-3 h-3" />
            </span>
            <span className="font-mono truncate max-w-[160px]">Client_Agreement.pdf</span>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
            Page 1 of 4
          </span>
        </div>

        {/* Simulated Document Body with Crop Handles */}
        <div className="relative my-4 p-4 rounded-lg bg-muted/30 border border-dashed border-border">
          {/* Corner Crop Indicators */}
          <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-primary" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-primary" />
          <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-primary" />
          <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-primary" />

          {/* Skeleton Document Lines */}
          <div className="space-y-2.5">
            <div className="h-3 w-1/3 rounded bg-foreground/15" />
            <div className="space-y-1.5 pt-1">
              <div className="h-2 w-full rounded bg-foreground/10" />
              <div className="h-2 w-5/6 rounded bg-foreground/10" />
              <div className="h-2 w-4/6 rounded bg-foreground/10" />
            </div>

            {/* Document Data Table Mockup */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="h-6 rounded bg-foreground/5 border border-border/60" />
              <div className="h-6 rounded bg-foreground/5 border border-border/60" />
              <div className="h-6 rounded bg-foreground/5 border border-border/60" />
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="h-2 w-full rounded bg-foreground/10" />
              <div className="h-2 w-3/4 rounded bg-foreground/10" />
            </div>
          </div>

          {/* Signature Stamp Badge */}
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Crop className="w-3 h-3 text-amber" />
              <span>Visible margins cropped</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-violet/10 border border-violet/20 text-violet text-xs font-semibold">
              <PenLine className="w-3.5 h-3.5" />
              <span className="font-serif italic font-normal text-sm">John Doe</span>
              <CheckCircle2 className="w-3 h-3 text-emerald ml-0.5" />
            </div>
          </div>
        </div>

        {/* Floating Quick Feature Cards */}
        <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
          {/* Merge Pill */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border shadow-xs">
            <span className="w-6 h-6 rounded bg-cobalt/10 text-cobalt flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-[11px] truncate">Merge PDF</p>
              <p className="text-[10px] text-muted-foreground truncate">2 files &rarr; 1 doc</p>
            </div>
          </div>

          {/* Compress Pill */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border shadow-xs">
            <span className="w-6 h-6 rounded bg-emerald/10 text-emerald flex items-center justify-center shrink-0">
              <Minimize2 className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-[11px] truncate">Compress PDF</p>
              <p className="text-[10px] text-emerald font-medium truncate">-74% file size</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Accent Badge: Split (Top-Right) */}
      <div className="absolute -top-3 -right-2 sm:-right-4 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border shadow-sm text-xs font-semibold text-foreground">
        <span className="w-5 h-5 rounded bg-vermillion/10 text-vermillion flex items-center justify-center">
          <Scissors className="w-3 h-3" />
        </span>
        <span>Split 1-4</span>
      </div>

      {/* Floating Accent Badge: Rotate (Bottom-Left) */}
      <div className="absolute -bottom-2 -left-2 sm:-left-4 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border shadow-sm text-xs font-semibold text-foreground">
        <span className="w-5 h-5 rounded bg-amber/10 text-amber flex items-center justify-center">
          <RotateCw className="w-3 h-3" />
        </span>
        <span>Rotate 90&deg;</span>
      </div>
    </div>
  );
};
