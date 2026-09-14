import type { FC } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FileText, Sparkles, CheckCircle2 } from 'lucide-react';

interface Milestone {
  id: string;
  badge: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'future';
}

const MILESTONES: Milestone[] = [
  {
    id: 'idea',
    badge: 'Phase 01',
    title: 'The Idea',
    description: 'Build a useful PDF toolkit that feels simple enough to use every day without remote uploads.',
    status: 'completed',
  },
  {
    id: 'foundation',
    badge: 'Phase 02',
    title: 'The Foundation',
    description: 'Establish client-side PDF operations: Merge, Split, Reorder, Rotate, Compress, and Images to PDF.',
    status: 'completed',
  },
  {
    id: 'security',
    badge: 'Phase 03',
    title: 'Hardening & Reliability',
    description: 'Harden in-memory processing pipelines, file validation, corrupt document handling, and client safety.',
    status: 'completed',
  },
  {
    id: 'docket',
    badge: 'Phase 04',
    title: 'Universal Flow & Previews',
    description: 'Introduce interactive PDF preview modal, flexible output renaming, and universal download docket.',
    status: 'completed',
  },
  {
    id: 'toolkit',
    badge: 'Phase 05',
    title: 'Expanding the Toolkit',
    description: 'Grow to 14 utilities including Crop, Page Numbers, Watermark, Markdown extraction, and Sign PDF.',
    status: 'completed',
  },
  {
    id: 'polish',
    badge: 'Phase 06 · Current',
    title: 'Design & UX Polish',
    description: 'Elevate the visual system with digital document tile cards, clear hierarchy, and accessible navigation.',
    status: 'current',
  },
  {
    id: 'next',
    badge: 'Phase 07 · Next',
    title: 'Continuous Refinement',
    description: 'Ongoing performance tuning, workflow optimizations, and keeping PDF work simple and reliable.',
    status: 'future',
  },
];

export const AboutJourneyTimeline: FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative max-w-3xl mx-auto">
      {/* Central Connector Track */}
      <div
        aria-hidden="true"
        className="absolute left-4 sm:left-6 top-4 bottom-8 w-[2px] bg-border z-0"
      >
        {/* Animated Progress Line */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { height: '0%' }}
          whileInView={shouldReduceMotion ? undefined : { height: '86%' }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="w-full bg-primary origin-top"
          style={shouldReduceMotion ? { height: '86%' } : undefined}
        />

        {/* Small Traveling Document Marker */}
        {!shouldReduceMotion && (
          <motion.div
            initial={{ top: '0%' }}
            whileInView={{ top: '83%' }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
            className="absolute -left-[11px] w-6 h-6 rounded-full bg-card border-2 border-primary flex items-center justify-center text-primary shadow-xs z-10"
          >
            <FileText className="w-3 h-3" />
          </motion.div>
        )}
      </div>

      {/* Milestones List */}
      <ol className="space-y-8 sm:space-y-10 relative z-10">
        {MILESTONES.map((item, index) => {
          const isCompleted = item.status === 'completed';
          const isCurrent = item.status === 'current';

          return (
            <motion.li
              key={item.id}
              initial={shouldReduceMotion ? undefined : { opacity: 0, x: -10 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.3, delay: shouldReduceMotion ? 0 : index * 0.08 }}
              className="relative pl-12 sm:pl-16 group"
            >
              {/* Milestone Node Marker */}
              <div
                aria-hidden="true"
                className={`absolute left-1.5 sm:left-3.5 top-1.5 -translate-x-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${
                  isCurrent
                    ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                    : isCompleted
                    ? 'border-primary bg-card text-primary'
                    : 'border-dashed border-muted-foreground/40 bg-card text-muted-foreground/60'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isCurrent ? (
                  <Sparkles className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                )}
              </div>

              {/* Milestone Content Card */}
              <div
                className={`p-4 sm:p-5 rounded-lg border transition-all ${
                  isCurrent
                    ? 'border-primary/40 bg-card shadow-xs'
                    : 'border-border bg-card/60 hover:bg-card hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`font-mono text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      isCurrent
                        ? 'bg-primary/10 text-primary'
                        : isCompleted
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-muted/60 text-muted-foreground/60 border border-dashed border-border'
                    }`}
                  >
                    {item.badge}
                  </span>

                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                      Active Phase
                    </span>
                  )}
                </div>

                <h3 className="font-display text-base sm:text-lg font-bold text-foreground mb-1">
                  {item.title}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
};
