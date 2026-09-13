import { type FC } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { ShieldCheck, HardDrive, EyeOff } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export const PrivacyPage: FC = () => {
  useDocumentTitle(
    'Privacy Policy',
    'PDFly Privacy Policy: Local processing, zero server storage, and complete privacy.',
  );
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 15 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="py-12 sm:py-16"
    >
      <Container size="md">
        {/* Header */}
        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Privacy Policy</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Your Privacy Matters
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            PDFly is built from the ground up to protect your documents. Here is how we handle your data.
          </p>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Card className="border-border bg-card">
            <CardContent className="p-5 flex items-start gap-3">
              <HardDrive className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">Local Processing</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Files are processed directly in your browser and never leave your device.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-5 flex items-start gap-3">
              <EyeOff className="w-5 h-5 text-emerald shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">Zero Trackers</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  No tracking scripts, third-party analytics, or session recordings.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Privacy Points */}
        <div className="space-y-8 text-foreground">
          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold tracking-tight">1. Local Processing</h2>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              All PDF and image manipulation occurs directly inside your web browser. Documents are loaded into volatile browser memory and handled locally. We do not transmit your files over the network.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold tracking-tight">2. No Remote Storage</h2>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              We do not operate file-storage servers or document databases. Your documents are never uploaded, saved, or viewed by anyone. When you close the browser tab, all loaded file data is immediately discarded.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold tracking-tight">3. Local Storage</h2>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              PDFly does not use tracking cookies. The only data saved on your device is your interface theme preference (light, dark, or system mode) in browser <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-foreground">localStorage</code> under the key <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-foreground">pdfly_theme_preference</code>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold tracking-tight">4. Network Boundaries</h2>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              Network requests are limited to downloading the static website assets (HTML, CSS, and JavaScript bundles) required to run the application. No external telemetry, advertising networks, or third-party monitoring tools are loaded.
            </p>
          </section>
        </div>
      </Container>
    </motion.div>
  );
};
