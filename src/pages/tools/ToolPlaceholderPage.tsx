import { type FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TOOL_MAP } from '@/constants/tools';
import { ROUTES } from '@/constants/routes';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Clock, Cpu, ShieldCheck } from '@/components/icons';
import type { ToolId } from '@/types/tools';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface ToolPlaceholderPageProps {
  toolId?: ToolId;
}

export const ToolPlaceholderPage: FC<ToolPlaceholderPageProps> = ({ toolId }) => {
  const { toolSlug } = useParams<{ toolSlug: string }>();
  const activeSlug = toolId ?? toolSlug;
  const tool = activeSlug ? TOOL_MAP[activeSlug] : undefined;

  useDocumentTitle(
    tool ? tool.name : 'Tool Not Found',
    tool?.description ?? 'Explore tools in the PDFly client-side PDF toolkit.',
  );

  if (!tool) {
    return (
      <div className="py-20 text-center">
        <Container size="sm">
          <h1 className="text-2xl font-bold text-foreground mb-3">Tool Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The requested PDF utility does not exist in our catalog.
          </p>
          <Link to={ROUTES.TOOLS}>
            <Button variant="outline" size="md">
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back to all tools
            </Button>
          </Link>
        </Container>
      </div>
    );
  }

  const IconComponent = tool.icon;

  return (
    <div className="py-12 sm:py-16">
      <Container size="md">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            to={ROUTES.TOOLS}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1.5 py-1"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to all tools</span>
          </Link>
        </div>

        {/* Tool Header Card */}
        <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <IconComponent className="w-8 h-8" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="warning" size="sm">
                    Coming Soon
                  </Badge>
                  <Badge variant="outline" size="sm" className="capitalize">
                    {tool.category}
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {tool.name}
                </h1>
              </div>
            </div>

            <Link to={ROUTES.TOOLS}>
              <Button variant="secondary" size="sm">
                Other Tools
              </Button>
            </Link>
          </div>

          <div className="pt-6 space-y-4">
            <p className="text-base text-muted-foreground leading-relaxed">
              {tool.description}
            </p>

            {/* Honest Status Notice */}
            <div className="p-4 rounded-xl bg-secondary/50 border border-border flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-foreground">
                  Planned for Future Release
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The interface shell and route contract for <strong>{tool.name}</strong> are verified and established. The client-side document processing engine will be introduced in a future update.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Architecture Preview Card */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="p-5 flex items-start gap-3">
              <Cpu className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Local Execution</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Document transformation for {tool.name} will run entirely inside your browser sandbox.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-5 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Zero Cloud Transfer</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  No remote servers will hold or process your files during execution.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
};
