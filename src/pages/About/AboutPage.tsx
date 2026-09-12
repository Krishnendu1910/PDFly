import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import {
  ArrowRight,
  Check,
  Cpu,
  FileText,
  Layers,
  LockKeyhole,
  MousePointer2,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export const AboutPage: FC = () => {
  useDocumentTitle(
    'About',
    "Learn about PDFly's client-side browser architecture, mission, and privacy-focused design philosophy.",
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">

      {/* ==================== AMBIENT BACKGROUND ==================== */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        {/* Warm orange glow */}
        <div className="absolute left-1/2 top-[-18rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-orange-500/[0.07] blur-[130px]" />

        {/* Terracotta glow */}
        <div className="absolute right-[-14rem] top-[40rem] h-[30rem] w-[30rem] rounded-full bg-rose-500/[0.045] blur-[130px]" />

        {/* Sage glow */}
        <div className="absolute left-[-15rem] top-[75rem] h-[30rem] w-[30rem] rounded-full bg-green-600/[0.045] blur-[130px]" />

        {/* Subtle paper-like grid */}
        <div
          className="absolute inset-0 opacity-[0.018] dark:opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
        />
      </div>

      {/* ==================== HERO ==================== */}
      <section>
        <Container size="md">
          <div className="flex flex-col items-center px-4 pb-20 pt-16 text-center sm:pb-28 sm:pt-24">

            {/* Badge */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600 backdrop-blur-xl dark:text-orange-400">
              <Sparkles className="h-3.5 w-3.5" />
              About PDFly
            </div>

            {/* Heading */}
            <h1 className="max-w-5xl text-5xl font-black tracking-[-0.065em] text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
              Your documents.
              <br />
              <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-rose-500 bg-clip-text text-transparent dark:from-orange-400 dark:via-amber-300 dark:to-rose-400">
                Your control.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              PDFly is a browser-first PDF toolkit built around one simple
              idea: powerful document tools should not require handing your
              files over to a remote server.
            </p>

            {/* CTA */}
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Link to={ROUTES.TOOLS}>
                <Button
                  size="md"
                  className="group h-12 rounded-xl bg-orange-600 px-6 text-white shadow-lg shadow-orange-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-orange-500/30 dark:bg-orange-500 dark:hover:bg-orange-400"
                >
                  Explore the Toolkit
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>

              <Link to={ROUTES.PRIVACY}>
                <Button
                  variant="outline"
                  size="md"
                  className="h-12 rounded-xl border-border bg-background/60 px-6 backdrop-blur-xl transition-all duration-300 hover:border-orange-500/30 hover:bg-orange-500/5"
                >
                  Our Privacy Approach
                </Button>
              </Link>
            </div>

            {/* ==================== HERO VISUAL ==================== */}
            <div className="relative mt-16 w-full max-w-3xl sm:mt-20">

              {/* Warm glow */}
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-rose-500/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 p-3 shadow-2xl shadow-black/[0.07] backdrop-blur-2xl dark:shadow-black/30 sm:p-5">

                <div className="rounded-[1.4rem] border border-border/60 bg-background/80 p-6 sm:p-10">

                  {/* Browser header */}
                  <div className="mb-8 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                    </div>

                    <div className="rounded-lg border border-border bg-muted/40 px-5 py-1.5 text-[10px] font-medium text-muted-foreground">
                      pdfly.app
                    </div>

                    <div className="w-10" />
                  </div>

                  {/* Processing flow */}
                  <div className="flex flex-col items-center justify-center gap-7 sm:flex-row sm:gap-8">

                    {/* PDF */}
                    <div className="group flex h-28 w-24 flex-col items-center justify-center rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-lg sm:h-32 sm:w-28">
                      <FileText className="mb-2 h-8 w-8 text-orange-600 transition-transform duration-300 group-hover:scale-110 dark:text-orange-400" />

                      <span className="text-[11px] font-semibold text-foreground">
                        Your PDF
                      </span>
                    </div>

                    {/* Connector */}
                    <div className="relative hidden h-px w-12 bg-gradient-to-r from-orange-500/50 to-amber-500/50 sm:block">
                      <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500 shadow-[0_0_14px] shadow-orange-500/60" />
                    </div>

                    {/* Browser */}
                    <div className="relative flex h-28 w-24 flex-col items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/[0.06] shadow-[0_0_45px] shadow-orange-500/10 sm:h-32 sm:w-28">

                      <Cpu className="mb-2 h-8 w-8 text-orange-600 dark:text-orange-400" />

                      <span className="text-[11px] font-semibold text-foreground">
                        Browser
                      </span>

                      <span className="mt-1 text-[9px] text-muted-foreground">
                        Processing
                      </span>
                    </div>

                    {/* Connector */}
                    <div className="relative hidden h-px w-12 bg-gradient-to-r from-amber-500/40 to-green-500/40 sm:block">
                      <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500 shadow-[0_0_14px] shadow-green-500/50" />
                    </div>

                    {/* Done */}
                    <div className="flex h-28 w-24 flex-col items-center justify-center rounded-2xl border border-green-600/20 bg-green-500/[0.05] shadow-[0_0_40px] shadow-green-500/5 sm:h-32 sm:w-28">

                      <Check className="mb-2 h-8 w-8 text-green-600 dark:text-green-400" />

                      <span className="text-[11px] font-semibold text-foreground">
                        Done
                      </span>

                      <span className="mt-1 text-[9px] text-muted-foreground">
                        Locally
                      </span>
                    </div>
                  </div>

                  {/* Privacy */}
                  <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-green-600 dark:text-green-400">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    Your file stays in your browser
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ==================== PHILOSOPHY ==================== */}
      <section className="border-y border-border/60 bg-muted/[0.18]">
        <Container size="md">
          <div className="px-4 py-20 sm:py-28">

            <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-20">

              <div>
                <div className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400">
                  <span className="h-px w-8 bg-orange-500" />
                  The idea
                </div>

                <h2 className="text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-5xl">
                  Privacy should be
                  <span className="text-orange-600 dark:text-orange-400">
                    {' '}
                    built in.
                  </span>
                </h2>
              </div>

              <div className="space-y-5 text-base leading-8 text-muted-foreground">
                <p>
                  Every day, people upload tax returns, signed agreements,
                  invoices, identification documents, and other sensitive
                  records to online PDF services without knowing exactly where
                  those files end up.
                </p>

                <p>
                  PDFly takes a different approach. Everyday operations like
                  merging, rotating, splitting, and extracting PDFs can happen
                  directly inside the browser.
                </p>

                <p className="font-medium text-foreground">
                  Your document does not need to leave your device just because
                  you need to change it.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ==================== ARCHITECTURE ==================== */}
      <section>
        <Container size="md">
          <div className="px-4 py-20 sm:py-28">

            <div className="mx-auto max-w-2xl text-center">

              <div className="mb-4 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                <span className="h-px w-8 bg-amber-500" />
                Built differently
                <span className="h-px w-8 bg-amber-500" />
              </div>

              <h2 className="text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-5xl">
                From file to result.
                <br />
                <span className="text-muted-foreground">
                  Without the detour.
                </span>
              </h2>
            </div>

            <div className="relative mt-16">

              <div className="absolute left-[16.66%] right-[16.66%] top-16 hidden h-px bg-gradient-to-r from-orange-500/20 via-amber-500/40 to-green-500/20 md:block" />

              <div className="grid gap-8 md:grid-cols-3">
                {[
                  {
                    number: '01',
                    icon: Upload,
                    title: 'Choose',
                    description:
                      'Select the document you want to work with.',
                  },
                  {
                    number: '02',
                    icon: Cpu,
                    title: 'Process',
                    description:
                      'Modern browser technologies handle the operation locally.',
                  },
                  {
                    number: '03',
                    icon: ShieldCheck,
                    title: 'Download',
                    description:
                      'Get your finished document without sending it away.',
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.number} className="relative text-center">

                      <div className="relative z-10 mx-auto flex h-32 w-32 flex-col items-center justify-center rounded-full border border-border bg-card shadow-xl shadow-black/[0.04] transition-all duration-500 hover:-translate-y-2 hover:border-orange-500/30 hover:shadow-orange-500/10 dark:shadow-black/20">

                        <span className="absolute right-3 top-3 text-[9px] font-bold text-muted-foreground">
                          {item.number}
                        </span>

                        <Icon className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                      </div>

                      <h3 className="mt-7 text-lg font-bold text-foreground">
                        {item.title}
                      </h3>

                      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ==================== PRINCIPLES ==================== */}
      <section className="border-y border-border/60 bg-muted/[0.18]">
        <Container size="md">
          <div className="px-4 py-20 sm:py-28">

            <div className="mb-12 max-w-xl">

              <div className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400">
                <span className="h-px w-8 bg-orange-500" />
                Our principles
              </div>

              <h2 className="text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-5xl">
                Three things we care about.
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-12">

              {/* Client first */}
              <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-orange-500/25 hover:shadow-xl md:col-span-7 md:p-10">

                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl transition-all duration-500 group-hover:bg-orange-500/15" />

                <div className="relative">

                  <div className="mb-12 flex items-center justify-between">
                    <span className="text-xs font-bold tracking-widest text-muted-foreground">
                      01
                    </span>

                    <Cpu className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>

                  <h3 className="text-2xl font-bold text-foreground sm:text-3xl">
                    Client-first architecture
                  </h3>

                  <p className="mt-4 max-w-lg leading-7 text-muted-foreground">
                    PDFly is engineered to take advantage of modern browser
                    JavaScript and WebAssembly capabilities, putting document
                    processing directly where your files already are.
                  </p>
                </div>
              </div>

              {/* Zero uploads */}
              <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-green-600/25 hover:shadow-xl md:col-span-5 md:p-8">

                <div className="absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-green-500/5 blur-3xl transition-all duration-500 group-hover:bg-green-500/10" />

                <div className="relative">

                  <div className="mb-14 flex items-center justify-between">
                    <span className="text-xs font-bold tracking-widest text-muted-foreground">
                      02
                    </span>

                    <LockKeyhole className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>

                  <h3 className="text-2xl font-bold text-foreground">
                    Zero uploads
                  </h3>

                  <p className="mt-4 leading-7 text-muted-foreground">
                    Your files are read into local browser memory instead of
                    being dispatched to a remote processing queue.
                  </p>
                </div>
              </div>

              {/* No clutter */}
              <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-amber-500/25 hover:shadow-xl md:col-span-5 md:p-8">

                <div className="mb-14 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest text-muted-foreground">
                    03
                  </span>

                  <Layers className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>

                <h3 className="text-2xl font-bold text-foreground">
                  No clutter
                </h3>

                <p className="mt-4 leading-7 text-muted-foreground">
                  No subscriptions, hidden conversion limits, or invasive
                  popups. Just focused tools that work.
                </p>
              </div>

              {/* Quote */}
              <div className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.08] to-amber-500/[0.04] p-7 md:col-span-7 md:p-8">

                <MousePointer2 className="mb-8 h-6 w-6 text-orange-600 dark:text-orange-400" />

                <p className="max-w-2xl text-xl font-semibold leading-8 tracking-tight text-foreground sm:text-2xl">
                  Powerful enough to get the job done.
                  <br />
                  <span className="text-muted-foreground">
                    Simple enough that you don't have to think about it.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ==================== FINAL CTA ==================== */}
      <section>
        <Container size="md">
          <div className="px-4 py-24 sm:py-32">

            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-16 text-center shadow-2xl shadow-black/[0.06] dark:shadow-black/30 sm:px-12 sm:py-20">

              {/* Warm glow */}
              <div className="absolute left-1/2 top-0 h-64 w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-[100px]" />

              <div className="relative">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10">
                  <ShieldCheck className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>

                <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-black tracking-[-0.05em] text-foreground sm:text-5xl">
                  Your PDFs.
                  <br />
                  <span className="text-muted-foreground">
                    Nothing else needs to know.
                  </span>
                </h2>

                <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Open the toolkit and start working with your documents.
                </p>

                <div className="mt-8">
                  <Link to={ROUTES.TOOLS}>
                    <Button
                      size="md"
                      className="group h-12 rounded-xl bg-orange-600 px-7 text-white shadow-lg shadow-orange-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-orange-500/30 dark:bg-orange-500 dark:hover:bg-orange-400"
                    >
                      Start Using PDFly
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>

              </div>
            </div>
          </div>
        </Container>
      </section>

    </div>
  );
};