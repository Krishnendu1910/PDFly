import { type FC } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const Hero: FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative pt-12 sm:pt-20 pb-8 sm:pb-12 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
        {/* Release / Status Badge */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/80 text-xs font-semibold text-foreground shadow-xs backdrop-blur-xs"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>PDFly</span>
          <span className="text-muted-foreground">&bull;</span>
          <span className="text-muted-foreground font-normal">Free Client-Side Tools</span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 15 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]"
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
          Merge, split, compress, and convert documents locally. Fast, secure, and private with zero server uploads.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 15 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="flex items-center justify-center pt-2"
        >
          <a href="#tools" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-base">
              Explore PDF Tools
              <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

