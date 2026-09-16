import type { FC } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FileText, ArrowDown, LockKey as Lock, CheckCircle as CheckCircle2, ShieldCheck } from '@/components/icons';

export const AboutHeroVisual: FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className="relative w-full max-w-[340px] sm:max-w-[380px] mx-auto select-none"
    >
      {/* Outer Card Frame */}
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs relative overflow-hidden">
        {/* Subtle Browser / Local Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-border/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted text-[10px] font-mono text-muted-foreground border border-border/50">
            <Lock className="w-2.5 h-2.5 text-emerald" />
            <span>in-browser sandbox</span>
          </div>
        </div>

        {/* 3-Stage Document Flow: PDF -> PDFly -> Result */}
        <div className="space-y-2.5">
          {/* Node 1: Input PDF */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-md bg-muted text-muted-foreground">
                <FileText className="w-4 h-4" />
              </span>
              <div>
                <div className="text-xs font-semibold text-foreground">input.pdf</div>
                <div className="text-[10px] text-muted-foreground font-mono">Your original file</div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-medium text-muted-foreground/60">01</span>
          </div>

          {/* Connector 1 */}
          <div className="flex justify-center py-0.5">
            <motion.div
              animate={shouldReduceMotion ? undefined : { y: [0, 2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-muted-foreground/40"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </motion.div>
          </div>

          {/* Node 2: PDFly Engine (In-Browser Processing) */}
          <div className="relative p-3.5 rounded-lg border border-primary/30 bg-primary/5">
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-l-lg" />
            <div className="flex items-center justify-between pl-1">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground shadow-2xs">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>PDFly Engine</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald inline-block" />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">Local browser memory</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                02 Local
              </span>
            </div>
          </div>

          {/* Connector 2 */}
          <div className="flex justify-center py-0.5">
            <motion.div
              animate={shouldReduceMotion ? undefined : { y: [0, 2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              className="text-muted-foreground/40"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </motion.div>
          </div>

          {/* Node 3: Result */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-md bg-emerald/10 text-emerald">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <div>
                <div className="text-xs font-semibold text-foreground">processed-output.pdf</div>
                <div className="text-[10px] text-muted-foreground font-mono">Ready to download</div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-medium text-muted-foreground/60">03</span>
          </div>
        </div>

        {/* Bottom Assurance */}
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald shrink-0" />
          <span>Zero processing uploads to external servers</span>
        </div>
      </div>
    </div>
  );
};
