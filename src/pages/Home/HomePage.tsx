import { type FC } from 'react';
import { Link } from 'react-router-dom';
import {
  FileUp,
  Cpu,
  Download,
  Shield,
  Zap,
  Lock,
  Smartphone,
  ArrowRight,
} from 'lucide-react';
import { TOOLS } from '@/constants/tools';
import { ROUTES } from '@/constants/routes';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Hero } from '@/components/marketing/Hero';
import { ToolCard } from '@/components/marketing/ToolCard';
import { StepCard } from '@/components/marketing/StepCard';
import { FeatureCard } from '@/components/marketing/FeatureCard';
import { FAQSection } from '@/components/marketing/FAQSection';
import { CTASection } from '@/components/marketing/CTASection';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export const HomePage: FC = () => {
  useDocumentTitle(
    '',
    'Fast, private, browser-based PDF toolkit designed for merging, splitting, reordering, rotating, and converting documents locally.',
  );
  return (
    <div className="pb-20 space-y-20 sm:space-y-28 overflow-hidden">
      {/* 1. Hero Section with Workflow Visualizer */}
      <Container size="lg">
        <Hero />
      </Container>

      {/* 2. Tool Grid Section */}
      <section id="tools" className="scroll-mt-20">
        <Container size="lg">
          <SectionHeading
            badge="Essential Toolkit"
            title="Core Tools Built for Speed"
            description="Designed for focused daily document tasks. Each tool runs locally inside your browser memory."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOOLS.map((tool, index) => (
              <ToolCard key={tool.id} tool={tool} index={index} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link to={ROUTES.TOOLS}>
              <Button variant="outline" size="md">
                Browse All 7 Tools
                <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* 3. Privacy Architectural Highlight */}
      <section className="py-8 bg-secondary/30 border-y border-border">
        <Container size="lg">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto">
              <Shield className="w-6 h-6" aria-hidden="true" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Your documents stay in your browser
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Standard online PDF converters upload your confidential records, contracts, and personal tax returns to remote cloud servers. PDFly is architected around client-side execution — document parsing, manipulation, and rendering are engineered to run entirely on your local machine.
            </p>

            <div className="pt-2">
              <Link to={ROUTES.PRIVACY}>
                <Button variant="ghost" size="sm" className="text-primary font-semibold">
                  Read our client-side privacy statement &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="scroll-mt-20">
        <Container size="lg">
          <SectionHeading
            badge="Simple Workflow"
            title="How PDFly Works"
            description="A frictionless 3-step process engineered for efficiency without server overhead."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              number="01"
              title="Select File"
              description="Choose your PDF or image files from your computer or device. The file is held safely in temporary browser memory."
              icon={FileUp}
            />
            <StepCard
              number="02"
              title="Process Locally"
              description="PDFly executes document operations in your browser using client-side JavaScript and WebAssembly without network upload delay."
              icon={Cpu}
            />
            <StepCard
              number="03"
              title="Instant Download"
              description="Your resulting document is generated directly in your browser and saved to your device immediately."
              icon={Download}
            />
          </div>
        </Container>
      </section>

      {/* 5. Feature Highlights */}
      <section>
        <Container size="lg">
          <SectionHeading
            badge="Architecture"
            title="Engineered for Everyday Productivity"
            description="Built to deliver a modern, dependable toolkit that respects your privacy and your time."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              title="Client-Side Engine"
              description="Operations happen within your browser sandbox, eliminating unnecessary server dependencies."
              icon={Cpu}
            />
            <FeatureCard
              title="Zero Upload Lag"
              description="No uploading multi-megabyte files across slow connections before you can start working."
              icon={Zap}
            />
            <FeatureCard
              title="Private by Design"
              description="Your files do not enter third-party cloud queues or databases for temporary storage."
              icon={Lock}
            />
            <FeatureCard
              title="Responsive Controls"
              description="A clean, intuitive interface optimized for both desktop keyboards and touch devices."
              icon={Smartphone}
            />
          </div>
        </Container>
      </section>

      {/* 6. FAQ Section */}
      <section id="faq" className="scroll-mt-20">
        <Container size="lg">
          <SectionHeading
            badge="Questions & Answers"
            title="Frequently Asked Questions"
            description="Transparent answers about our client-side architecture, limits, and product roadmap."
          />

          <FAQSection />
        </Container>
      </section>

      {/* 7. Final Call to Action */}
      <Container size="lg">
        <CTASection />
      </Container>
    </div>
  );
};
