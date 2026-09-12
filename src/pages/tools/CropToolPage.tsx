import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import {
  Crop,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Maximize2,
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
import { DownloadResultDocket, type OutputFileItem } from '@/components/download';
import { getDefaultDownloadFilename } from '@/utils/filenameUtils';
import {
  getPdfPageCount,
  renderPageThumbnail,
  cropPdfDocument,
  PdfOperationError,
  type CropMarginsPercent,
} from '@/lib/pdf';
import type { FileValidationError } from '@/types/file';

const CROP_CONFIG = {
  ...PDF_ONLY_CONFIG,
  maxFiles: 1,
  minFiles: 1,
};

export const CropToolPage: FC = () => {
  useDocumentTitle(
    'Crop PDF',
    'Trim margins and adjust visible dimensions across pages in your PDF document.',
  );

  const [pageCount, setPageCount] = useState<number | null>(null);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [margins, setMargins] = useState<CropMarginsPercent>({
    top: 5,
    bottom: 5,
    left: 5,
    right: 5,
  });
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
    config: CROP_CONFIG,
  });

  const activeFile = files[0];

  useEffect(() => {
    let isCancelled = false;

    if (!activeFile) {
      setPageCount(null);
      setPreviewThumbnail(null);
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

    setPreviewLoading(true);
    renderPageThumbnail(activeFile.file, 1, { targetWidth: 400 })
      .then((dataUrl) => {
        if (!isCancelled) setPreviewThumbnail(dataUrl);
      })
      .catch(() => {
        // Non-critical fallback if preview fails
      })
      .finally(() => {
        if (!isCancelled) setPreviewLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeFile]);

  const allErrors = [...pipelineErrors, ...operationErrors];

  const updateMargin = (side: keyof CropMarginsPercent, val: number) => {
    setMargins((prev) => ({
      ...prev,
      [side]: Math.max(0, Math.min(40, val)),
    }));
  };

  const handleApplyCrop = async () => {
    if (!activeFile || isProcessing) return;

    if (margins.left + margins.right >= 90 || margins.top + margins.bottom >= 90) {
      setOperationErrors([
        {
          code: 'UNKNOWN_ERROR',
          message: 'Combined margins exceed 90%. Please reduce crop margins.',
        },
      ]);
      return;
    }

    setIsProcessing(true);
    setProgressPercent(0);
    setOperationErrors([]);

    try {
      const result = await cropPdfDocument(activeFile.file, {
        margins,
        onProgress: (pct) => setProgressPercent(pct),
      });

      const defaultFilename = getDefaultDownloadFilename('crop', activeFile.name);
      setOutputResult({
        id: 'cropped-output',
        pdfBytes: result.pdfBytes,
        defaultFilename,
        byteSize: result.pdfBytes.byteLength,
        pageCount: result.totalPages,
        label: `Cropped Document (${result.totalPages} pages)`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to crop PDF document.';
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
    setPreviewThumbnail(null);
    setMargins({ top: 5, bottom: 5, left: 5, right: 5 });
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
                <Crop className="w-7 h-7" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="success" size="sm">
                    Client-Side Engine Active
                  </Badge>
                  <Badge variant="outline" size="sm">
                    Edit
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Crop PDF
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
            Trim unnecessary borders, adjust page framing, and remove unwanted white margins across all document pages in private local memory.
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
            toolName="Cropped Document"
            toolIdentifier="[TOOL // 11 · MARGIN TRIMMER]"
            onReset={handleReset}
          />
        ) : (
          <div className="space-y-8">
            {/* File Ingestion Dropzone */}
            {!hasFiles && (
              <Dropzone
                onFilesSelected={addFiles}
                config={CROP_CONFIG}
                multiple={false}
                title="Select or drop a PDF document to crop"
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Visual Preview with Overlay Frame */}
                  <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 rounded-xl border border-border bg-secondary/15 min-h-[320px]">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Page 1 Crop Preview</span>
                    </div>

                    <div className="relative border-2 border-dashed border-border rounded shadow-md overflow-hidden max-w-[260px] bg-background">
                      {previewThumbnail ? (
                        <img
                          src={previewThumbnail}
                          alt="Page 1 preview"
                          className="w-full h-auto block select-none"
                        />
                      ) : (
                        <div className="w-56 h-72 flex items-center justify-center text-xs text-muted-foreground">
                          {previewLoading ? 'Generating preview...' : 'Document Page'}
                        </div>
                      )}

                      {/* Crop Shading Overlay */}
                      <div
                        className="absolute inset-0 pointer-events-none transition-all duration-150"
                        style={{
                          top: `${margins.top}%`,
                          bottom: `${margins.bottom}%`,
                          left: `${margins.left}%`,
                          right: `${margins.right}%`,
                          border: '2px solid rgb(225, 46, 0)',
                          boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.45)',
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-3 font-mono">
                      Red outline indicates preserved content box
                    </p>
                  </div>

                  {/* Margin Adjustment Sliders */}
                  <div className="lg:col-span-6 space-y-5 p-4 rounded-xl border border-border bg-secondary/20">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                        Crop Margins (%)
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setMargins({ top: 0, bottom: 0, left: 0, right: 0 })}
                          className="text-[11px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors"
                        >
                          Reset (0%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setMargins({ top: 5, bottom: 5, left: 5, right: 5 })}
                          className="text-[11px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors"
                        >
                          5% All
                        </button>
                        <button
                          type="button"
                          onClick={() => setMargins({ top: 10, bottom: 10, left: 10, right: 10 })}
                          className="text-[11px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors"
                        >
                          10% All
                        </button>
                      </div>
                    </div>

                    {/* Top Margin */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <label htmlFor="crop-top-slider" className="font-medium text-foreground">Top Margin</label>
                        <span className="font-mono text-muted-foreground">{margins.top}%</span>
                      </div>
                      <input
                        id="crop-top-slider"
                        type="range"
                        min="0"
                        max="40"
                        value={margins.top}
                        onChange={(e) => updateMargin('top', parseInt(e.target.value))}
                        className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Bottom Margin */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <label htmlFor="crop-bottom-slider" className="font-medium text-foreground">Bottom Margin</label>
                        <span className="font-mono text-muted-foreground">{margins.bottom}%</span>
                      </div>
                      <input
                        id="crop-bottom-slider"
                        type="range"
                        min="0"
                        max="40"
                        value={margins.bottom}
                        onChange={(e) => updateMargin('bottom', parseInt(e.target.value))}
                        className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Left Margin */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <label htmlFor="crop-left-slider" className="font-medium text-foreground">Left Margin</label>
                        <span className="font-mono text-muted-foreground">{margins.left}%</span>
                      </div>
                      <input
                        id="crop-left-slider"
                        type="range"
                        min="0"
                        max="40"
                        value={margins.left}
                        onChange={(e) => updateMargin('left', parseInt(e.target.value))}
                        className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Right Margin */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <label htmlFor="crop-right-slider" className="font-medium text-foreground">Right Margin</label>
                        <span className="font-mono text-muted-foreground">{margins.right}%</span>
                      </div>
                      <input
                        id="crop-right-slider"
                        type="range"
                        min="0"
                        max="40"
                        value={margins.right}
                        onChange={(e) => updateMargin('right', parseInt(e.target.value))}
                        className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Conversion Trigger Bar */}
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 inline" aria-hidden="true" />
                      Preserving {100 - (margins.left + margins.right)}% width &times; {100 - (margins.top + margins.bottom)}% height across {pageCount || 'all'} pages.
                    </span>
                  </div>

                  <Button
                    size="lg"
                    disabled={isProcessing || pageCount === null}
                    onClick={handleApplyCrop}
                    className="w-full sm:w-auto shadow-sm"
                  >
                    <span>Crop Document</span>
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
                    <h3 className="text-sm font-semibold text-foreground">Direct Box Mutation</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Updates CropBox and MediaBox parameters directly in the local PDF data structure without re-encoding page content.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-5 flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Standard Reader Compatible</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Produces standard ISO 32000 compliant PDF boundaries supported by Adobe Acrobat, Apple Preview, and modern web browsers.
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
        title="Cropping document..."
        subtitle="Recalculating page bounds and trimming margins..."
        progressPercent={progressPercent}
      />
    </div>
  );
};
