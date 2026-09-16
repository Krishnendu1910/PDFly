import { type FC } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FileArrowUp as FileUp, Cpu, DownloadSimple as Download, ArrowRight, CheckCircle as CheckCircle2 } from '@phosphor-icons/react';

export const WorkflowVisualizer: FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    {
      icon: FileUp,
      title: '1. Select Document',
      detail: 'Local memory load',
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      icon: Cpu,
      title: '2. Client Processing',
      detail: 'Planned in-memory runtime',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: Download,
      title: '3. Instant Download',
      detail: 'Saved to local device',
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
    },
  ];

  return (
    <div
      aria-label="PDFly planned workflow process: Select, Process Locally, Download"
      className="w-full max-w-2xl mx-auto p-4 sm:p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Planned Client-Side Architecture
        </span>
        <span className="hidden sm:inline text-[11px] font-mono lowercase">in-memory execution</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.title}
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.15 }}
              className="relative flex sm:flex-col items-center sm:items-start p-4 rounded-xl border border-border bg-background/80 hover:border-primary/30 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 mb-0 sm:mb-3 mr-3 sm:mr-0 ${step.bg} ${step.color}`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-semibold text-foreground truncate">{step.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden sm:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-muted-foreground/50">
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground px-2">
        <div className="flex items-center gap-1.5 text-foreground/80">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
          <span>Designed to keep files on your device</span>
        </div>
        <span className="text-[11px]">No remote server storage</span>
      </div>
    </div>
  );
};

