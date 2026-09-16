import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import {
  ToolIcon,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Lightning,
  CheckCircle,
} from '@/components/icons';
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
import { DownloadResultDocket, type OutputFileItem } from '@/components/download';
import { getDefaultDownloadFilename } from '@/utils/filenameUtils';
import {
  getPdfPageCount,
  addPageNumbersToPdf,
  PdfOperationError,
  type PageNumberPosition,
  type PageNumberFormat,
} from '@/lib/pdf';
import type { FileValidationError } from '@/types/file';

const PAGE_NUMBERS_CONFIG = {
  ...PDF_ONLY_CONFIG,
  maxFiles: 1,
  minFiles: 1,
};

export const PageNumbersToolPage: FC = () => {
  useDocumentTitle(
    'Add Page Numbers to PDF',
    'Insert customizable page numbers, headers, and footers into your PDF document locally.',
  );

  const [pageCount, setPageCount] = useState<number | null>(null);
  const [position, setPosition] = useState<PageNumberPosition>('bottom-center');
  const [format, setFormat] = useState<PageNumberFormat>('page-n-of-total');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [operationErrors, setOperationErrors] = useState<FileValidationError[]>([]);
  const [outputResult, setOutputResult] = useState<OutputFileItem | null>(null);

  const {
    files,
    errors: pipelineErrors,
    hasFiles,
    addFiles,
    clearFiles,
    clearErrors,
  } = useFilePipeline({
    config: PAGE_NUMBERS_CONFIG,
  });

  const activeFile = files[0];

  useEffect(() => {
    let isCancelled = false;

    if (!activeFile) {
      setPageCount(null);
      setOutputResult(null);
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

  const handleAddNumbers = async () => {
    if (!activeFile || isProcessing) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setOperationErrors([]);

    try {
      const result = await addPageNumbersToPdf(activeFile.file, {
        position,
        format,
        startNumber,
        fontSize,
        onProgress: (pct) => setProgressPercent(pct),
      });

      const defaultFilename = getDefaultDownloadFilename('page-numbers', activeFile.name);
      setOutputResult({
        id: 'numbered-output',
        pdfBytes: result.pdfBytes,
        defaultFilename,
        byteSize: result.pdfBytes.byteLength,
        pageCount: result.totalPages,
        label: `Numbered Document (${result.totalPages} pages)`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add page numbers.';
      const code = err instanceof PdfOperationError ? err.code : 'PROCESSING_FAILED';
      setOperationErrors([{ code: code as FileValidationError['code'], message: msg }]);
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
    }
  };

  const handleReset = () => {
    setOutputResult(null);
    clearFiles();
    setPageCount(null);
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
              <div className="w-14 h-14 rounded-xl bg-cobalt/10 text-cobalt dark:bg-cobalt/20 dark:text-cobalt flex items-center justify-center shrink-0">
                <ToolIcon toolId="page-numbers" className="w-7 h-7" weight="duotone" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" size="sm">
                    Edit
                  </Badge>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Add Page Numbers
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
            Number your PDF document with customizable formatting, position, and starting values. Processed 100% locally in your browser memory.
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

        {/* Workspace or Download Docket */}
        {outputResult ? (
          <DownloadResultDocket
            outputs={[outputResult]}
            toolName="Numbered Document"
            onBackToEditing={() => setOutputResult(null)}
            onReset={handleReset}
          />
        ) : (
          <div className="space-y-8">
            {/* File Ingestion Dropzone */}
            {!hasFiles && (
              <Dropzone
                onFilesSelected={addFiles}
                config={PAGE_NUMBERS_CONFIG}
                multiple={false}
                title="Select or drop a PDF document to add page numbers"
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

                {/* Configuration Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl border border-border bg-secondary/20">
                  {/* Position Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                      Placement Position
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg border border-border bg-background">
                      {(
                        [
                          ['top-left', 'Top Left'],
                          ['top-center', 'Top Center'],
                          ['top-right', 'Top Right'],
                          ['bottom-left', 'Bottom Left'],
                          ['bottom-center', 'Bottom Center'],
                          ['bottom-right', 'Bottom Right'],
                        ] as [PageNumberPosition, string][]
                      ).map(([posKey, posLabel]) => (
                        <button
                          key={posKey}
                          type="button"
                          onClick={() => setPosition(posKey)}
                          className={`py-2 px-2 text-xs font-medium rounded transition-all text-center ${
                            position === posKey
                              ? 'bg-primary text-primary-foreground shadow-xs'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }`}
                        >
                          {posLabel}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Format Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                      Number Format
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg border border-border bg-background">
                      {(
                        [
                          ['n', '1, 2, 3'],
                          ['page-n', 'Page 1'],
                          ['n-of-total', `1 / ${pageCount || 'N'}`],
                          ['page-n-of-total', `Page 1 of ${pageCount || 'N'}`],
                        ] as [PageNumberFormat, string][]
                      ).map(([fmtKey, fmtLabel]) => (
                        <button
                          key={fmtKey}
                          type="button"
                          onClick={() => setFormat(fmtKey)}
                          className={`py-2 px-2 text-xs font-medium rounded transition-all text-center ${
                            format === fmtKey
                              ? 'bg-primary text-primary-foreground shadow-xs'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }`}
                        >
                          {fmtLabel}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Start Number */}
                  <div className="space-y-1.5">
                    <label htmlFor="start-number-input" className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                      Start Number
                    </label>
                    <input
                      id="start-number-input"
                      type="number"
                      min="1"
                      value={startNumber}
                      onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Font Size */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="font-size-range" className="font-semibold uppercase tracking-wider text-foreground">
                        Font Size
                      </label>
                      <span className="font-mono text-muted-foreground">{fontSize} pt</span>
                    </div>
                    <input
                      id="font-size-range"
                      type="range"
                      min="8"
                      max="16"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Conversion Trigger Bar */}
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 inline" aria-hidden="true" />
                      Ready to number {pageCount || 'all'} pages starting at {startNumber}.
                    </span>
                  </div>

                  <Button
                    size="lg"
                    disabled={isProcessing || pageCount === null}
                    onClick={handleAddNumbers}
                    className="w-full sm:w-auto shadow-sm"
                  >
                    <span>Apply Page Numbers</span>
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
                    <h3 className="text-sm font-semibold text-foreground">100% In-Memory Indexing</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Typography is rendered directly into the PDF content stream in browser memory without external server communication.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-5 flex items-start gap-3">
                  <Lightning className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Boundary Safe</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Text coordinate metrics are computed dynamically for every page to ensure numbers never clip outside printable margins.
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
        title="Adding page numbers..."
        subtitle="Writing page indexes into document streams..."
        progressPercent={progressPercent}
      />
    </div>
  );
};

