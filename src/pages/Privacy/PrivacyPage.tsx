import type { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ShieldCheck,
  Check,
  X,
  Desktop,
  CloudSlash,
  Sliders,
  ArrowRight,
  Cpu,
  Database,
  HardDrive,
  Globe,
  EyeSlash,
  type PDFlyIcon,
} from '@/components/icons';
import { ROUTES } from '@/constants/routes';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { PrivacyBoundaryVisual } from '@/components/marketing/PrivacyBoundaryVisual';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface TechnicalItem {
  label: string;
  status: string;
  statusClass: string;
  icon: PDFlyIcon;
  description: ReactNode;
}

export const PrivacyPage: FC = () => {
  useDocumentTitle(
    'Privacy Policy',
    'PDFly Privacy Policy: Local document processing in your browser, zero remote storage, and no tracking.',
  );
  const shouldReduceMotion = useReducedMotion();

  const privacyPoints = [
    {
      label: 'LOCAL',
      title: 'Local Processing',
      description: 'Your document is processed in your browser memory.',
      icon: Desktop,
    },
    {
      label: 'NO UPLOAD',
      title: 'No Processing Uploads',
      description: 'PDFly does not upload your document for PDF processing.',
      icon: CloudSlash,
    },
    {
      label: 'YOUR CONTROL',
      title: 'Direct Output',
      description: 'The resulting file is generated locally and downloaded through your browser.',
      icon: Sliders,
    },
  ];

  const doesItems = [
    'Process PDF and image files locally in the browser',
    'Generate processed files locally on your device',
    'Use browser storage only for the interface theme preference',
  ];

  const doesntItems = [
    'Upload documents for PDF processing to remote servers',
    'Store processed documents on a remote file server',
    'Use third-party tracking scripts or analytics services',
    'Add telemetry or document monitoring code',
  ];

  const technicalItems: TechnicalItem[] = [
    {
      label: 'DOCUMENT PROCESSING',
      status: 'LOCAL',
      statusClass:
        'px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold tracking-wide uppercase bg-emerald/10 text-emerald border border-emerald/20 shrink-0',
      icon: Cpu,
      description: 'Runs locally in volatile browser memory on your device.',
    },
    {
      label: 'REMOTE STORAGE',
      status: 'NONE',
      statusClass:
        'px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold tracking-wide uppercase bg-muted text-muted-foreground border border-border shrink-0',
      icon: Database,
      description: 'PDFly does not operate document-storage servers or databases for uploaded files.',
    },
    {
      label: 'BROWSER STORAGE',
      status: 'LOCAL',
      statusClass:
        'px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold tracking-wide uppercase bg-emerald/10 text-emerald border border-emerald/20 shrink-0',
      icon: HardDrive,
      description: (
        <span>
          Only your theme mode preference is saved in browser{' '}
          <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-foreground">
            localStorage
          </code>{' '}
          under the key{' '}
          <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-foreground">
            pdfly_theme_preference
          </code>
          .
        </span>
      ),
    },
    {
      label: 'NETWORK REQUESTS',
      status: 'STATIC ONLY',
      statusClass:
        'px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0',
      icon: Globe,
      description:
        'Limited to downloading static website assets (HTML, CSS, JS) needed to run the application.',
    },
    {
      label: 'TRACKING & TELEMETRY',
      status: 'NONE',
      statusClass:
        'px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold tracking-wide uppercase bg-muted text-muted-foreground border border-border shrink-0',
      icon: EyeSlash,
      description:
        'No third-party analytics, tracking pixels, session recorders, or advertising networks.',
    },
  ];

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="space-y-16 sm:space-y-20 lg:space-y-24 py-10 sm:py-16 pb-20"
    >
      {/* 1. Hero Section */}
      <section>
        <Container size="lg">
          <div className="max-w-3xl space-y-4 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald/10 text-emerald border border-emerald/20">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Privacy Policy</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Your files stay with you.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              PDFly processes documents locally in your browser. Files are not uploaded to a server for PDF processing.
            </p>

            {/* Status Indicator Line */}
            <div className="pt-2 flex items-center justify-center sm:justify-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald/10 text-emerald border border-emerald/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                <span>LOCAL PROCESSING · ZERO SERVER UPLOADS</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Privacy by Design Visual Explanation */}
      <section className="scroll-mt-16">
        <Container size="lg">
          <div className="space-y-2 mb-6 text-center sm:text-left">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Privacy by design
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
              PDFly was built around a simple principle: your documents should not need to leave your device just to perform everyday PDF tasks.
            </p>
          </div>

          <PrivacyBoundaryVisual />
        </Container>
      </section>

      {/* 3. Why Privacy Matters */}
      <section className="scroll-mt-16">
        <Container size="lg">
          <div className="py-8 sm:py-12 border-y border-border space-y-8">
            <div className="max-w-3xl space-y-3">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Why privacy matters
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                PDFs can contain invoices, identity documents, contracts, notes, business records, and other information people may not want uploaded to another service. PDFly is designed so everyday PDF processing can happen without sending those documents to a remote processing server.
              </p>
            </div>

            {/* 3 Compact Visual Points */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 pt-4">
              {privacyPoints.map((point) => {
                const PointIcon = point.icon;
                return (
                  <div
                    key={point.label}
                    className="p-5 rounded-lg border border-border bg-card space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald">
                      <PointIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{point.label}</span>
                    </div>

                    <h3 className="font-display text-base font-semibold text-foreground">
                      {point.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* 4. What PDFly Does / Doesn't Do */}
      <section className="scroll-mt-16">
        <Container size="lg">
          <div className="space-y-2 mb-8 text-center sm:text-left">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              What PDFly does and doesn&apos;t do
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Clear boundaries so you always know how your files are handled.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: What PDFly does */}
            <div className="p-6 rounded-xl border border-emerald/20 bg-emerald/5 space-y-4">
              <div className="flex items-center gap-2 text-emerald font-display text-lg font-bold">
                <Check className="w-5 h-5" aria-hidden="true" />
                <h3>PDFly does</h3>
              </div>

              <ul className="space-y-3 text-sm text-foreground">
                {doesItems.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald/15 text-emerald shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </span>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: What PDFly doesn't do */}
            <div className="p-6 rounded-xl border border-border bg-card space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground font-display text-lg font-bold">
                <X className="w-5 h-5 text-red-500" aria-hidden="true" />
                <h3>PDFly doesn&apos;t</h3>
              </div>

              <ul className="space-y-3 text-sm text-muted-foreground">
                {doesntItems.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground shrink-0 mt-0.5">
                      <X className="w-3 h-3" />
                    </span>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. Redesigned Technical Details (Privacy controls overview) */}
      <section className="scroll-mt-16">
        <Container size="lg">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Header with Title and Restrained Privacy Model Status */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
              <div className="space-y-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Technical details
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  A closer look at how PDFly handles your data.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full text-xs font-mono font-medium border border-emerald/25 bg-emerald/10 text-emerald">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
                <span>PRIVACY MODEL · LOCAL-FIRST</span>
              </div>
            </div>

            {/* Small Visual "LOCAL" Signal Banner */}
            <div className="p-3.5 sm:p-4 rounded-xl border border-emerald/20 bg-emerald/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald/15 text-emerald flex items-center justify-center shrink-0">
                  <Desktop className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald">
                    YOUR BROWSER
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Local document processing · Documents never leave this device
                  </div>
                </div>
              </div>
              <span className="hidden sm:inline-flex text-[11px] font-mono text-emerald/90 px-2.5 py-0.5 rounded-md bg-emerald/10 border border-emerald/20 font-medium">
                Local-Only
              </span>
            </div>

            {/* 5 Technical Privacy Items */}
            <div className="space-y-3 pt-1">
              {technicalItems.map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                    whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-20px' }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: 0.2, delay: idx * 0.04 }
                    }
                    className="group p-4 sm:p-4.5 rounded-xl border border-border/80 bg-background hover:border-border hover:bg-muted/30 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-muted/70 group-hover:bg-muted text-muted-foreground group-hover:text-foreground flex items-center justify-center shrink-0 transition-colors mt-0.5 sm:mt-0">
                        <ItemIcon className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                          {item.label}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <div className="self-start sm:self-center pl-11.5 sm:pl-0">
                      <span className={item.statusClass}>
                        {item.status}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* 6. Small Closing Statement / CTA */}
      <section>
        <Container size="lg">
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto shadow-xs">
            <div className="space-y-1.5">
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Work privately with your PDFs
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose a tool and process your documents directly in your browser.
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
