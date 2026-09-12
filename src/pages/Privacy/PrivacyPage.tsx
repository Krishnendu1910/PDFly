import { type FC } from 'react';
import { Container } from '@/components/ui/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { ShieldCheck, HardDrive, EyeOff, Info } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export const PrivacyPage: FC = () => {
  useDocumentTitle(
    'Privacy Policy',
    'Transparent disclosure of PDFly\'s local processing architecture, network boundaries, and data storage policy.',
  );
  return (
    <div className="py-12 sm:py-16">
      <Container size="md">
        {/* Header */}
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Transparency & Privacy</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Privacy Policy & Statement
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            A plain-language explanation of how PDFly operates, what data is stored, and our commitment to client-side document processing.
          </p>
        </div>

        {/* Informational Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <Card className="border-border bg-card">
            <CardContent className="p-5 flex items-start gap-3">
              <HardDrive className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="text-base font-semibold text-foreground">Local Browser Memory</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Documents selected for processing remain inside your device’s volatile RAM and are deleted as soon as the tab is closed.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-5 flex items-start gap-3">
              <EyeOff className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="text-base font-semibold text-foreground">No Third-Party Trackers</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  We do not load third-party advertising scripts, telemetry SDKs, or session-recording trackers.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight">1. Client-Side Document Processing</h2>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              PDFly is designed to perform all document modifications directly in your web browser. When you use any tool, the document data is read locally using browser FileReader and WebAssembly APIs. It is not transmitted over HTTP/HTTPS to our servers or any third-party computing infrastructure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight">2. Information Stored Locally</h2>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              The only information stored across visits is your interface theme preference (light, dark, or system preference) using standard browser <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-foreground">localStorage</code>. This key is named <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-foreground">pdfly_theme_preference</code>. No user profile, document data, or identifying information is stored.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight">3. Network Requests</h2>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              The only network requests made by this application are for static website assets (HTML, CSS, JavaScript bundles, and icons) necessary to display and run the tool in your browser.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight">4. Current Development Status</h2>
            <div className="p-4 rounded-xl border border-border bg-secondary/40 flex items-start gap-3 text-sm">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Phase 2 Verification Notice</p>
                <p className="text-muted-foreground leading-relaxed">
                  This privacy policy accurately reflects the Phase 2 codebase. As subsequent phases introduce document processing engines in Phase 3, this statement will be updated to reflect the exact technical parameters of those local engines.
                </p>
              </div>
            </div>
          </section>
        </div>
      </Container>
    </div>
  );
};
