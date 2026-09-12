import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Container } from '@/components/ui/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Cpu, Layers, ArrowRight } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export const AboutPage: FC = () => {
  useDocumentTitle(
    'About',
    'Learn about PDFly\'s client-side browser architecture, mission, and privacy-focused design philosophy.',
  );
  return (
    <div className="py-12 sm:py-16">
      <Container size="md">
        {/* Header */}
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            <span>Our Mission</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            About PDFly
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            PDFly is an open-access, browser-first toolkit created to make document management fast, straightforward, and inherently private.
          </p>
        </div>

        {/* Narrative Content */}
        <div className="space-y-10 text-foreground">
          {/* Philosophy Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">The Core Philosophy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Every day, millions of people upload sensitive tax returns, signed agreements, and personal identification documents to online PDF conversion websites without knowing where those files are stored, who has access to them, or how long they persist on remote servers.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We believe everyday document operations — like combining two invoices, rotating a scanned page, or extracting a page range — shouldn&apos;t require transmitting your confidential records across the internet.
            </p>
          </section>

          {/* 3 Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <Card className="border-border bg-card">
              <CardContent className="p-5 space-y-2">
                <Cpu className="w-6 h-6 text-primary" aria-hidden="true" />
                <h3 className="font-semibold text-base">Client-First</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Engineered to leverage modern browser JavaScript and WebAssembly capabilities directly on your device.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-5 space-y-2">
                <ShieldCheck className="w-6 h-6 text-emerald-500" aria-hidden="true" />
                <h3 className="font-semibold text-base">Zero Uploads</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your files are read into local browser memory and never dispatched to an external processing queue.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-5 space-y-2">
                <Layers className="w-6 h-6 text-indigo-500" aria-hidden="true" />
                <h3 className="font-semibold text-base">No Clutter</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No subscriptions, hidden conversion limits, or invasive popups. Just focused tools that work.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Phased Roadmap Notice */}
          <section className="p-6 rounded-2xl border border-border bg-secondary/30 space-y-3">
            <h2 className="text-lg font-bold text-foreground">Phased Engineering Approach</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              PDFly is being constructed step-by-step with production rigor:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>
                <strong className="text-foreground">Phase 1 (Completed):</strong> Foundational architecture, strict TypeScript setup, and accessible routing shell.
              </li>
              <li>
                <strong className="text-foreground">Phase 2 (Active):</strong> Reusable design tokens, component primitives, responsive marketing views, and motion system.
              </li>
              <li>
                <strong className="text-foreground">Phase 3 (Upcoming):</strong> Client-side PDF engine integration, file handling pipeline, and document transformations.
              </li>
            </ul>
          </section>

          {/* Explore CTA */}
          <div className="pt-4 flex items-center gap-4">
            <Link to={ROUTES.TOOLS}>
              <Button size="md">
                Explore the Toolkit
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            </Link>
            <Link to={ROUTES.PRIVACY}>
              <Button variant="outline" size="md">
                Read Privacy Statement
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
};
