import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { TOOLS } from '@/constants/tools';
import { ROUTES } from '@/constants/routes';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Hero } from '@/components/marketing/Hero';
import { ToolCard } from '@/components/marketing/ToolCard';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export const HomePage: FC = () => {
  useDocumentTitle(
    '',
    'Fast, private, browser-based PDF toolkit designed for merging, splitting, reordering, rotating, and converting documents locally.',
  );
  return (
    <div className="pb-20 space-y-16 sm:space-y-24 overflow-hidden">
      {/* 1. Hero Section */}
      <Container size="lg">
        <Hero />
      </Container>

      {/* 2. Tool Grid Section */}
      <section id="tools" className="scroll-mt-20">
        <Container size="lg">
          <SectionHeading
            badge="Tools"
            title="Choose a Tool"
            description="Select an action to get started. All operations run directly in your browser."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOOLS.map((tool, index) => (
              <ToolCard key={tool.id} tool={tool} index={index} />
            ))}
          </div>
        </Container>
      </section>

      {/* 3. Short Privacy Reassurance Note */}
      <section className="py-12 bg-secondary/30 border-y border-border">
        <Container size="md">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald/10 text-emerald mx-auto">
              <Shield className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Files stay in your browser. No uploads.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              PDFly processes documents locally using client-side JavaScript. Your files never leave your device or touch a remote server.
            </p>
            <div className="pt-2">
              <Link to={ROUTES.PRIVACY} className="text-sm font-medium text-primary hover:underline">
                Read our Privacy Policy &rarr;
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};
