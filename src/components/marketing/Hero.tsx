import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/Button';
import { HeroVisual } from '@/components/marketing/HeroVisual';

export const Hero: FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative pt-8 sm:pt-12 lg:pt-16 pb-6 sm:pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column: Copy & Actions */}
        <div className="lg:col-span-6 text-center lg:text-left space-y-4 sm:space-y-6">
          {/* Main Heading */}
          <motion.h1
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]"
          >
            Your PDFs, simplified.
          </motion.h1>

          {/* Supporting Copy */}
          <motion.p
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: shouldReduceMotion ? 0 : 0.05 }}
            className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed"
          >
            Simple PDF tools to organize, convert, edit, and finish your documents right in your browser.
          </motion.p>

          {/* Action Row & Secondary Reassurance */}
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: shouldReduceMotion ? 0 : 0.1 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
          >
            <Link to={ROUTES.TOOLS} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base font-semibold px-6 shadow-xs">
                Explore PDF Tools
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            </Link>

            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald shrink-0" aria-hidden="true" />
              <span>Files stay in your browser.</span>
            </div>
          </motion.div>
        </div>

        {/* Right Column: PDFly Product Visual Composition */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: shouldReduceMotion ? 0 : 0.08 }}
          className="lg:col-span-6 flex justify-center w-full"
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
};
