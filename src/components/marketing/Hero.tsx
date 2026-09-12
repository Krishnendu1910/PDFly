import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/Button';
import { WorkflowVisualizer } from '@/components/marketing/WorkflowVisualizer';

export const Hero: FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
        {/* Release / Status Badge */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/80 text-xs font-semibold text-foreground shadow-xs backdrop-blur-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <span>Client-Side PDF Architecture</span>
          <span className="text-muted-foreground">&bull;</span>
          <span className="text-primary font-medium">Phase 2 Design System</span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 15 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]"
        >
          Simple PDF tools. <br className="hidden sm:inline" />
          <span className="text-primary">Right in your browser.</span>
        </motion.h1>

        {/* Supporting Copy */}
        <motion.p
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 15 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          A browser-based toolkit designed to merge, split, rotate, convert, and compress documents locally. Built for privacy and speed without remote file uploads.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 15 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
        >
          <Link to={ROUTES.TOOLS} className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-base">
              Explore PDF Tools
              <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
          </Link>
          <a href="#how-it-works" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
              How It Works
            </Button>
          </a>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground pt-4"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            <span>Designed for local processing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Zero server storage model</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Open browser toolkit</span>
          </div>
        </motion.div>

        {/* Workflow Diagram */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="pt-8 sm:pt-12"
        >
          <WorkflowVisualizer />
        </motion.div>
      </div>
    </section>
  );
};

