import type { FC } from 'react';
import { Images, FileImage, FileCode, FileText, ArrowRight, Check } from '@/components/icons';

export const ConvertVisual: FC = () => {
  return (
    <div className="relative w-full max-w-md mx-auto p-5 sm:p-6 rounded-xl border border-border bg-card shadow-sm select-none" aria-hidden="true">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border text-xs">
        <span className="font-semibold text-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal" />
          Client-Side Conversion Pipelines
        </span>
        <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
          Lossless Vector & Text
        </span>
      </div>

      {/* 3 Pipeline Rows */}
      <div className="space-y-3.5 my-4">
        {/* Pipeline 1: Images to PDF */}
        <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded bg-coral/10 text-coral flex items-center justify-center shrink-0">
              <Images className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">JPG, PNG, WebP</p>
              <p className="text-[10px] text-muted-foreground truncate">Multi-image import</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-coral shrink-0 px-1">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2.5 min-w-0 text-right justify-end">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">Unified PDF</p>
              <p className="text-[10px] text-emerald font-medium truncate">EXIF auto-rotated</p>
            </div>
            <span className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Pipeline 2: PDF to Images */}
        <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">PDF Document</p>
              <p className="text-[10px] text-muted-foreground truncate">Vector rendering</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-teal shrink-0 px-1">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2.5 min-w-0 text-right justify-end">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">High-DPI Images</p>
              <p className="text-[10px] text-muted-foreground truncate">PNG / JPG archive</p>
            </div>
            <span className="w-8 h-8 rounded bg-teal/10 text-teal flex items-center justify-center shrink-0">
              <FileImage className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Pipeline 3: PDF to Markdown */}
        <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">PDF Document</p>
              <p className="text-[10px] text-muted-foreground truncate">Text extraction</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-teal shrink-0 px-1">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2.5 min-w-0 text-right justify-end">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">Structured .md</p>
              <p className="text-[10px] text-emerald font-medium truncate">Tables & headers</p>
            </div>
            <span className="w-8 h-8 rounded bg-teal/10 text-teal flex items-center justify-center shrink-0">
              <FileCode className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1 text-emerald text-[11px] font-medium">
          <Check className="w-3.5 h-3.5" /> High-DPI canvas worker rendering
        </span>
        <span className="font-mono text-[11px]">Zero Server Latency</span>
      </div>
    </div>
  );
};

