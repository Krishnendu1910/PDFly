import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCode,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  Download,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { PDF_ONLY_CONFIG } from '@/constants/file';
import { useFilePipeline } from '@/hooks/useFilePipeline';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Dropzone } from '@/components/file/Dropzone';
import { FileErrorBanner } from '@/components/file/FileErrorBanner';
import { ProcessingOverlay } from '@/components/pdf/ProcessingOverlay';
import {
  getPdfPageCount,
  convertPdfToMarkdown,
  PdfOperationError,
  type ConvertPdfToMarkdownResult,
} from '@/lib/pdf';
import type { FileValidationError } from '@/types/file';

const MARKDOWN_CONFIG = {
  ...PDF_ONLY_CONFIG,
  maxFiles: 1,
  minFiles: 1,
};

export const PdfToMarkdownToolPage: FC = () => {
  useDocumentTitle(
    'PDF to Markdown',
    'Extract and transform PDF document contents into structured GitHub-flavored Markdown text.',
  );

  const [pageCount, setPageCount] = useState<number | null>(null);
  const [includeSeparators, setIncludeSeparators] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [operationErrors, setOperationErrors] = useState<FileValidationError[]>([]);
  const [result, setResult] = useState<ConvertPdfToMarkdownResult | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    files,
    errors: pipelineErrors,
    hasFiles,
    addFiles,
    clearFiles,
    clearErrors,
  } = useFilePipeline({
    config: MARKDOWN_CONFIG,
  });

  const activeFile = files[0];

  useEffect(() => {
    let isCancelled = false;

    if (!activeFile) {
      setPageCount(null);
      setResult(null);
      setOperationErrors([]);
      return;
    }

    getPdfPageCount(activeFile.file)
      .then((count) => {
        if (!isCancelled) setPageCount(count);
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Could not inspect PDF structure.';
          const code = err instanceof PdfOperationError ? err.code : 'INVALID_PDF';
          setOperationErrors([{ code: code as FileValidationError['code'], message: msg }]);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeFile]);

  const allErrors = [...pipelineErrors, ...operationErrors];

  const handleConvert = async () => {
    if (!activeFile || isProcessing) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setOperationErrors([]);

    try {
      const res = await convertPdfToMarkdown(activeFile.file, {
        includePageSeparators: includeSeparators,
        onProgress: (_curr, _total, pct) => setProgressPercent(pct),
      });
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to extract Markdown.';
      const code = err instanceof PdfOperationError ? err.code : 'PROCESSING_FAILED';
      setOperationErrors([{ code: code as FileValidationError['code'], message: msg }]);
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    if (!result || !activeFile) return;

    const base = activeFile.name.replace(/\.[^/.]+$/, '');
    const filename = `${base}.md`;

    const blob = new Blob([result.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const handleReset = () => {
    setResult(null);
    clearFiles();
    setPageCount(null);
    setCopied(false);
  };

  return (
    <div className="py-10 sm:py-16">
      <Container size="md">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to={ROUTES.TOOLS}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1.5 py-1"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to all tools</span>
          </Link>
        </div>

        {/* Tool Header */}
        <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileCode className="w-7 h-7" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="success" size="sm">
                    Client-Side Engine Active
                  </Badge>
                  <Badge variant="outline" size="sm">
                    Convert
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  PDF to Markdown
                </h1>
              </div>
            </div>

            <Link to={ROUTES.TOOLS}>
              <Button variant="secondary" size="sm">
                Other Tools
              </Button>
            </Link>
          </div>

          <p className="pt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Extract text from PDF pages and reconstruct structured Markdown paragraphs and headers for notes, documentation, or LLM pipelines.
          </p>
        </div>

        {/* Error Notification */}
        {allErrors.length > 0 && (
          <div className="mb-6">
            <FileErrorBanner
              errors={allErrors}
              onDismiss={() => {
                clearErrors();
                setOperationErrors([]);
              }}
            />
          </div>
        )}

        {/* Output Viewer or Ingestion */}
        {result ? (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
              {/* Docket Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                    [TOOL // 12 · MARKDOWN EXTRACTOR]
                  </div>
                  <h2 className="text-lg font-bold text-foreground">
                    Markdown Extraction Complete
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{result.pageCount} pages parsed</span>
                    <span>&bull;</span>
                    <span>{result.wordCount.toLocaleString()} words</span>
                    <span>&bull;</span>
                    <span>{result.charCount.toLocaleString()} characters</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleDownload}
                    className="flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .md</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </Button>
                </div>
              </div>

              {/* Monospaced Markdown Text Output */}
              <div className="space-y-2">
                <label htmlFor="markdown-output" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Markdown Content
                </label>
                <textarea
                  id="markdown-output"
                  readOnly
                  value={result.markdown}
                  rows={18}
                  className="w-full p-4 rounded-xl border border-border bg-muted/40 font-mono text-xs sm:text-sm text-foreground leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* File Ingestion Dropzone */}
            {!hasFiles && (
              <Dropzone
                onFilesSelected={addFiles}
                config={MARKDOWN_CONFIG}
                multiple={false}
                title="Select or drop a PDF document to convert to Markdown"
                subtitle="Choose 1 PDF file (up to 50 MB)"
                disabled={isProcessing}
              />
            )}

            {/* Selected File & Settings */}
            {hasFiles && activeFile && (
              <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                  <div>
                    <h2 className="text-base font-bold text-foreground truncate max-w-sm sm:max-w-md">
                      {activeFile.name}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pageCount !== null ? `${pageCount} pages` : 'Reading pages...'} &bull; {activeFile.formattedSize}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="text-xs text-muted-foreground hover:text-destructive self-start sm:self-auto"
                  >
                    Change File
                  </Button>
                </div>

                {/* Conversion Settings */}
                <div className="p-4 rounded-xl border border-border bg-secondary/20">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSeparators}
                      onChange={(e) => setIncludeSeparators(e.target.checked)}
                      className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-semibold text-foreground block">
                        Include page divider rules (<code className="font-mono text-xs">---</code>)
                      </span>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        Inserts Markdown horizontal dividers between consecutive pages in the output document.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Conversion Trigger Bar */}
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                      <FileText className="w-4 h-4 inline" aria-hidden="true" />
                      Ready to parse {pageCount || 'all'} pages into clean Markdown text.
                    </span>
                  </div>

                  <Button
                    size="lg"
                    disabled={isProcessing || pageCount === null}
                    onClick={handleConvert}
                    className="w-full sm:w-auto shadow-sm"
                  >
                    <span>Extract Markdown</span>
                    <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            )}

            {/* Architecture Assurance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-border bg-card">
                <CardContent className="p-5 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">100% Client-Side Parsing</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Extracts text streams and layout geometry entirely within your browser session. Zero data reaches external servers.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-5 flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Coordinate-Based Reconstruction</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Sorts characters top-to-bottom and left-to-right using PDF glyph coordinates, detecting headings and preserving natural reading flow.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </Container>

      {/* Processing Overlay Dialog */}
      <ProcessingOverlay
        isOpen={isProcessing}
        title="Extracting Markdown..."
        subtitle="Parsing text coordinates and compiling Markdown structures..."
        progressPercent={progressPercent}
      />
    </div>
  );
};

