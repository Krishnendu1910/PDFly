import { type FC } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Desktop,
  CloudSlash,
  Stack,
  ShieldCheck,
  Sparkle,
  Heart,
  type PDFlyIcon,
} from "@/components/icons";
import { POPULAR_TOOL_IDS, TOOL_MAP } from "@/constants/tools";
import { ROUTES } from "@/constants/routes";
import { Container } from "@/components/ui/Container";
import { Hero } from "@/components/marketing/Hero";
import { ToolCard } from "@/components/marketing/ToolCard";
import { OrganizeVisual } from "@/components/marketing/OrganizeVisual";
import { ConvertVisual } from "@/components/marketing/ConvertVisual";
import { EditVisual } from "@/components/marketing/EditVisual";
import { cn } from "@/lib/utils/cn";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface BenefitItem {
  id: string;
  title: string;
  description: string;
  icon: PDFlyIcon;
  iconBg: string;
}

const BENEFITS: readonly BenefitItem[] = [
  {
    id: "runs-in-browser",
    title: "Runs in your browser",
    description: "PDF processing happens locally in your browser.",
    icon: Desktop,
    iconBg: "bg-cobalt/10 text-cobalt",
  },
  {
    id: "no-file-uploads",
    title: "No file uploads",
    description: "Your documents aren't uploaded to a server for PDF processing.",
    icon: CloudSlash,
    iconBg: "bg-emerald/10 text-emerald",
  },
  {
    id: "everyday-pdf-work",
    title: "Built for everyday PDF work",
    description: "Merge, split, compress, convert, edit, and sign with simple tools.",
    icon: Stack,
    iconBg: "bg-coral/10 text-coral",
  },
  {
    id: "files-under-control",
    title: "Your files stay under your control",
    description: "PDFly works with files you select directly in your browser.",
    icon: ShieldCheck,
    iconBg: "bg-violet/10 text-violet",
  },
  {
    id: "simple-by-design",
    title: "Simple by design",
    description: "Focused PDF tools without unnecessary complexity.",
    icon: Sparkle,
    iconBg: "bg-amber/10 text-amber",
  },
  {
    id: "free-to-use",
    title: "Free to use",
    description: "Use the available PDFly tools directly in your browser.",
    icon: Heart,
    iconBg: "bg-primary/10 text-primary",
  },
] as const;

export const HomePage: FC = () => {
  const shouldReduceMotion = useReducedMotion();
  useDocumentTitle(
    "",
    "Fast, private, browser-based PDF toolkit designed for merging, splitting, reordering, rotating, and converting documents locally.",
  );

  const popularTools = POPULAR_TOOL_IDS.map((id) => TOOL_MAP[id]).filter(Boolean);

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-16 sm:space-y-24 lg:space-y-28 overflow-hidden pb-16 sm:pb-20"
    >
      {/* 1. Hero Section */}
      <Container size="lg">
        <Hero />
      </Container>

      {/* 2. Popular PDF Tools */}
      <section id="popular-tools" className="scroll-mt-16">
        <Container size="lg">
          <div className="space-y-1.5 mb-6 text-center sm:text-left">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Popular PDF Tools
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Simple tools for the tasks you do most.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {popularTools.map((tool, index) => (
              <ToolCard key={tool.id} tool={tool} index={index} variant="minimal" />
            ))}
          </div>

          {/* View All Tools Secondary Action */}
          <div className="flex justify-center pt-6">
            <Link
              to={ROUTES.TOOLS}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-xs"
            >
              <span>View all tools</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </section>

      {/* 3. Product Section 1: Organize */}
      <section className="scroll-mt-16">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1 flex justify-center">
              <OrganizeVisual />
            </div>
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-cobalt/10 text-cobalt">
                Organize
              </div>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight">
                Take control of your PDF pages.
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                Merge, split, reorder, rotate, remove, or extract pages without complicated software.
              </p>
              <div className="pt-2">
                <Link
                  to={ROUTES.TOOLS}
                  className="inline-flex items-center gap-1.5 text-sm sm:text-base font-semibold text-primary hover:underline underline-offset-4 group"
                >
                  <span>Explore organize tools</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. Product Section 2: Convert */}
      <section className="scroll-mt-16">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-teal/10 text-teal">
                Convert
              </div>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight">
                Convert documents without the extra steps.
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                Turn images into PDFs, convert PDF pages to images, or extract structured content as Markdown.
              </p>
              <div className="pt-2">
                <Link
                  to={ROUTES.TOOLS}
                  className="inline-flex items-center gap-1.5 text-sm sm:text-base font-semibold text-primary hover:underline underline-offset-4 group"
                >
                  <span>Explore conversion tools</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="lg:col-span-6 flex justify-center">
              <ConvertVisual />
            </div>
          </div>
        </Container>
      </section>

      {/* 5. Product Section 3: Edit */}
      <section className="scroll-mt-16">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1 flex justify-center">
              <EditVisual />
            </div>
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-violet/10 text-violet">
                Edit & Finish
              </div>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight">
                Make the final touches simple.
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                Crop pages, add page numbers, apply watermarks, and sign documents before you download them.
              </p>
              <div className="pt-2">
                <Link
                  to={ROUTES.TOOLS}
                  className="inline-flex items-center gap-1.5 text-sm sm:text-base font-semibold text-primary hover:underline underline-offset-4 group"
                >
                  <span>Explore editing tools</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. Why choose PDFly? Section */}
      <section id="why-choose-pdfly" className="scroll-mt-16 pt-4">
        <Container size="lg">
          <div className="max-w-2xl mb-10 sm:mb-12 text-center sm:text-left">
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Why choose PDFly?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-150",
                      item.iconBg,
                    )}
                  >
                    <Icon className="w-5 h-5" weight="duotone" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>
    </motion.div>
  );
};
