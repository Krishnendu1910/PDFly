import type { FC } from 'react';
import { FileText, ShieldCheck, CloudSlash, Lock } from '@/components/icons';

export const PrivacyBoundaryVisual: FC = () => {
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className="w-full max-w-4xl mx-auto select-none my-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Inside the Browser Boundary (12 cols on mobile, 8 cols on desktop) */}
        <div className="lg:col-span-8 rounded-xl border-2 border-emerald/30 bg-card p-5 sm:p-6 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-5">
          {/* Subtle Top Left Accent Spine */}
          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald rounded-l-xl" />

          {/* Browser Header Bar */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald/10 text-emerald">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                Your Browser Sandbox
              </span>
            </div>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald/10 text-emerald">
              <Lock className="w-2.5 h-2.5" />
              Local Device Boundary
            </span>
          </div>

          {/* Document In-Memory Flow Inside Browser */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center py-2">
            {/* Step A: Input */}
            <div className="p-3 rounded-lg border border-border bg-muted/30 text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-foreground">Your File</div>
              <div className="text-[10px] text-muted-foreground font-mono">Loaded in memory</div>
            </div>

            {/* Transition Arrow / Engine */}
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 text-center space-y-1 relative">
              <div className="w-7 h-7 mx-auto rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-2xs">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-foreground">PDFly Engine</div>
              <div className="text-[10px] text-primary font-mono">Processes locally</div>
            </div>

            {/* Step B: Output */}
            <div className="p-3 rounded-lg border border-border bg-muted/30 text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-md bg-emerald/10 text-emerald flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-foreground">Your Result</div>
              <div className="text-[10px] text-muted-foreground font-mono">Downloaded locally</div>
            </div>
          </div>

          {/* Boundary Assurance Footer */}
          <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>Documents are handled directly in volatile browser memory.</span>
            <span className="text-[11px] font-mono text-emerald font-semibold hidden sm:inline">
              100% Client-Side
            </span>
          </div>
        </div>

        {/* Outside the Boundary: Remote Cloud / Servers (4 cols on desktop) */}
        <div className="lg:col-span-4 rounded-xl border border-dashed border-border bg-muted/20 p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground/80">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-muted text-muted-foreground">
              <CloudSlash className="w-3.5 h-3.5" />
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider">
              Remote Servers
            </span>
          </div>

          <div className="space-y-2 py-2">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted text-xs font-mono font-medium text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              No Document Upload
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              PDFly does not send your documents over the network for PDF processing.
            </p>
          </div>

          <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground/70 font-mono">
            Zero remote storage servers
          </div>
        </div>
      </div>
    </div>
  );
};
