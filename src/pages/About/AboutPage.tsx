import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Monitor,
  Target,
  CheckCircle2,
  MousePointerClick,
  Cpu,
  Eye,
  Download,
  FileText,
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { AboutHeroVisual } from '@/components/marketing/AboutHeroVisual';
import { AboutJourneyTimeline } from '@/components/marketing/AboutJourneyTimeline';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export const AboutPage: FC = () => {
  useDocumentTitle(
    'About PDFly',
    'PDFly is a simple collection of PDF tools designed to run directly in your browser, with your documents processed locally on your device.',
  );
  const shouldReduceMotion = useReducedMotion();

  const principles = [
    {
      num: '01',
      label: 'LOCAL',
      description: 'Processing happens in your browser.',
      icon: Monitor,
    },
    {
      num: '02',
      label: 'FOCUSED',
      description: 'Each tool is designed around one clear PDF task.',
      icon: Target,
    },
    {
      num: '03',
      label: 'SIMPLE',
      description: 'Select a file, configure the task, review the result, and download.',
      icon: CheckCircle2,
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      name: 'SELECT',
      description: 'Choose your PDF or supported file.',
      icon: MousePointerClick,
    },
    {
      step: '02',
      name: 'PROCESS',
      description: 'PDFly processes it locally in your browser.',
      icon: Cpu,
    },
    {
      step: '03',
      name: 'REVIEW',
      description: 'Preview the generated PDF when the workflow supports it.',
      icon: Eye,
    },
    {
      step: '04',
      name: 'DOWNLOAD',
      description: 'Rename the result if needed and save it to your device.',
      icon: Download,
    },
  ];

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="space-y-16 sm:space-y-20 lg:space-y-24 py-10 sm:py-16 pb-20"
    >
      {/* 1. Hero */}
      <section>
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>About PDFly</span>
              </div>

              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                PDF tools, built differently.
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                PDFly is a simple collection of PDF tools designed to run directly in your browser, with your documents processed locally on your device.
              </p>

              <div className="pt-2 flex justify-center lg:justify-start">
                <Link to={ROUTES.TOOLS}>
                  <Button size="md">
                    <span>Explore PDF Tools</span>
                    <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <AboutHeroVisual />
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Why PDFly? */}
      <section className="scroll-mt-16">
        <Container size="lg">
          <div className="py-8 sm:py-12 border-y border-border">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start mb-10">
              <div className="lg:col-span-5 space-y-2">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Why PDFly?
                </h2>
                <p className="text-base sm:text-lg font-medium text-foreground">
                  Most PDF tools start with an upload.
                </p>
              </div>

              <div className="lg:col-span-7 space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                <p>
                  Many browser-based PDF services rely on uploading your document to remote infrastructure before processing it. PDFly takes a different approach: supported PDF processing happens locally in your browser.
                </p>
                <p>
                  That means you can work with your documents without making a PDF processing upload part of the workflow.
                </p>
              </div>
            </div>

            {/* 3. What Makes It Different (3 Principles) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-8 border-t border-border/60">
              {principles.map((item) => {
                const PrincipleIcon = item.icon;
                return (
                  <div
                    key={item.num}
                    className="p-5 rounded-lg border border-border bg-card/60 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-muted-foreground/60 tracking-wider">
                        {item.num}
                      </span>
                      <span className="flex items-center justify-center w-7 h-7 rounded-md bg-muted text-foreground">
                        <PrincipleIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-sm sm:text-base font-bold text-foreground mb-1">
                        {item.label}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* 4. How PDFly Works */}
      <section className="scroll-mt-16">
        <Container size="lg">
          <div className="space-y-2 mb-10 text-center sm:text-left">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              How it works
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Four simple steps from local file to finished result.
            </p>
          </div>

          {/* Connected Horizontal Path on Desktop / Stacked on Mobile */}
          <div className="relative">
            {/* Desktop Connecting Track */}
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-[28px] left-[6%] right-[6%] h-[2px] bg-border z-0"
            >
              {/* Subtle animated moving document marker along the track */}
              {!shouldReduceMotion && (
                <motion.div
                  animate={{ left: ['0%', '100%'] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-[11px] w-6 h-6 rounded-full bg-card border-2 border-primary flex items-center justify-center text-primary shadow-xs z-10"
                >
                  <FileText className="w-3 h-3" />
                </motion.div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 relative z-10">
              {workflowSteps.map((stage) => {
                const StepIcon = stage.icon;
                return (
                  <div
                    key={stage.step}
                    className="p-5 rounded-lg border border-border bg-card shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-border bg-card font-mono text-xs font-bold text-foreground">
                        {stage.step}
                      </span>
                      <span className="flex items-center justify-center w-7 h-7 rounded-md bg-muted text-muted-foreground">
                        <StepIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-sm sm:text-base font-bold text-foreground mb-1">
                        {stage.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* 5. The PDFly Journey */}
      <section className="scroll-mt-16">
        <Container size="lg">
          <div className="space-y-2 mb-10 text-center sm:text-left">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              From an idea to PDFly.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
              PDFly has grown through small improvements, careful engineering, and constant refinement.
            </p>
          </div>

          <AboutJourneyTimeline />
        </Container>
      </section>

      {/* 6. Short Future Statement */}
      <section className="scroll-mt-16">
        <Container size="lg">
          <div className="py-8 sm:py-10 border-t border-border text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Still improving.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              PDFly is not finished. The goal is to keep improving the tools, workflows, performance, and experience while keeping the product simple.
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              More useful PDF workflows will be added over time.
            </p>
          </div>
        </Container>
      </section>

      {/* 7. Small CTA */}
      <section>
        <Container size="lg">
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto shadow-xs">
            <div className="space-y-1.5">
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Try PDFly.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose a tool and work with your PDF directly in your browser.
              </p>
            </div>

            <div className="pt-1">
              <Link to={ROUTES.TOOLS}>
                <Button size="md">
                  <span>Explore PDF Tools</span>
                  <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </motion.div>
  );
};
