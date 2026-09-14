import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import {
  Stamp,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
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
  renderPagePreview,
  addWatermarkToPdf,
  PdfOperationError,
  type WatermarkPosition,
  type WatermarkRotation,
  type RenderPagePreviewResult,
} from '@/lib/pdf';
import { WatermarkLivePreview } from '@/components/pdf/WatermarkLivePreview';
import type { FileValidationError } from '@/types/file';

const WATERMARK_CONFIG = {
  ...PDF_ONLY_CONFIG,
  maxFiles: 1,
  minFiles: 1,
};

export const WatermarkToolPage: FC = () => {
  useDocumentTitle(
    'Watermark PDF',
    'Stamp custom text watermarks, draft notices, or confidentiality markers across your PDF document with instant live preview.',
  );

  const [pageCount, setPageCount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagePreviews, setPagePreviews] = useState<Record<number, RenderPagePreviewResult>>({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [position, setPosition] = useState<WatermarkPosition>('center');
  const [rotation, setRotation] = useState<WatermarkRotation>('diagonal');
  const [opacity, setOpacity] = useState<number>(0.25);
  const [fontSize, setFontSize] = useState<number>(48);

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
    config: WATERMARK_CONFIG,
  });

  const activeFile = files[0];

  // Inspect page count upon file selection
  useEffect(() => {
    let isCancelled = false;

    if (!activeFile) {
      setPageCount(null);
      setCurrentPage(1);
      setPagePreviews({});
      setPreviewError(null);
      setOutputResult(null);
      setOperationErrors([]);
      return;
    }

    getPdfPageCount(activeFile.file)
      .then((count) => {
        if (!isCancelled) {
          setPageCount(count);
          setCurrentPage(1);
          setPagePreviews({});
          setPreviewError(null);
        }
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

  // Render preview thumbnail for the currently selected page
  useEffect(() => {
    let isCancelled = false;
    if (!activeFile || !currentPage) return;

    // Use cached render if already present
    if (pagePreviews[currentPage]) {
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);

    renderPagePreview(activeFile.file, currentPage, { targetWidth: 420 })
      .then((result) => {
        if (!isCancelled) {
          setPagePreviews((prev) => ({
            ...prev,
            [currentPage]: result,
          }));
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Preview generation failed';
          setPreviewError(msg);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setPreviewLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeFile, currentPage, pagePreviews]);

  const allErrors = [...pipelineErrors, ...operationErrors];

  const handleApplyWatermark = async () => {
    if (!activeFile || !watermarkText.trim() || isProcessing) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setOperationErrors([]);

    try {
      const result = await addWatermarkToPdf(activeFile.file, {
        text: watermarkText.trim(),
        position,
        rotation,
        opacity,
        fontSize,
        onProgress: (pct) => setProgressPercent(pct),
      });

      const defaultFilename = getDefaultDownloadFilename('watermark', activeFile.name);
      setOutputResult({
        id: 'watermarked-output',
        pdfBytes: result.pdfBytes,
        defaultFilename,
        byteSize: result.pdfBytes.byteLength,
        pageCount: result.totalPages,
        label: `Watermarked Document (${result.totalPages} pages)`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to apply watermark.';
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
    setCurrentPage(1);
    setPagePreviews({});
    setPreviewError(null);
  };

  return (
    <div className="py-10 sm:py-16">
      <Container size="lg">
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
              <div className="w-14 h-14 rounded-xl bg-violet/10 text-violet dark:bg-violet/20 dark:text-violet flex items-center justify-center shrink-0">
                <Stamp className="w-7 h-7" aria-hidden="true" />
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
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Watermark PDF
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
            Apply custom text stamps, confidentiality banners, or copyright markers across all pages of your PDF document. Processed entirely in browser memory with live visual preview.
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
            toolName="Watermarked Document"
            toolIdentifier="[TOOL // 10 · TEXT STAMPER]"
            onBackToEditing={() => setOutputResult(null)}
            onReset={handleReset}
          />
        ) : (
          <div className="space-y-8">
            {/* File Ingestion Dropzone */}
            {!hasFiles && (
              <Dropzone
                onFilesSelected={addFiles}
                config={WATERMARK_CONFIG}
                multiple={false}
                title="Select or drop a PDF document to watermark"
                subtitle="Choose 1 PDF file (up to 50 MB)"
                disabled={isProcessing}
              />
            )}

            {/* Selected File & Live Editor Workspace */}
            {hasFiles && activeFile && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Live Visual Preview */}
                <div className="lg:col-span-6 xl:col-span-7 order-1">
                  <WatermarkLivePreview
                    pagePreview={pagePreviews[currentPage] || null}
                    loading={previewLoading}
                    error={previewError}
                    currentPage={currentPage}
                    totalPages={pageCount}
                    watermarkText={watermarkText}
                    position={position}
                    rotation={rotation}
                    opacity={opacity}
                    fontSize={fontSize}
                    onPageChange={(p) => setCurrentPage(p)}
                    disabled={isProcessing}
                  />
                </div>

                {/* Right Column: Configuration Controls */}
                <div className="lg:col-span-6 xl:col-span-5 order-2 p-6 rounded-2xl border border-border bg-card shadow-xs space-y-6">
                  {/* Selected File Bar */}
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
                    <div className="truncate">
                      <h2 className="text-base font-bold text-foreground truncate">
                        {activeFile.name}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        {pageCount !== null ? `${pageCount} pages` : 'Reading pages...'} &bull; {activeFile.formattedSize}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      disabled={isProcessing}
                      className="text-xs text-muted-foreground hover:text-destructive shrink-0"
                    >
                      Change File
                    </Button>
                  </div>

                  {/* Watermark Controls Group */}
                  <div className="space-y-5">
                    {/* Watermark Text Input */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="watermark-text-input"
                        className="text-xs font-semibold uppercase tracking-wider text-foreground block"
                      >
                        Watermark Text
                      </label>
                      <input
                        id="watermark-text-input"
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="e.g. CONFIDENTIAL, DRAFT, DO NOT COPY"
                        disabled={isProcessing}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Orientation Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                        Orientation
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg border border-border bg-muted/30">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => setRotation('diagonal')}
                          className={`py-2 px-3 text-xs font-medium rounded transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            rotation === 'diagonal'
                              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                          }`}
                        >
                          Diagonal (45°)
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => setRotation('horizontal')}
                          className={`py-2 px-3 text-xs font-medium rounded transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            rotation === 'horizontal'
                              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                          }`}
                        >
                          Horizontal (0°)
                        </button>
                      </div>
                    </div>

                    {/* Position Selector (active when horizontal or indicator) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                          Position
                        </label>
                        {rotation === 'diagonal' && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Centered on diagonal
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg border border-border bg-muted/30">
                        {(
                          [
                            ['top', 'Top'],
                            ['center', 'Center'],
                            ['bottom', 'Bottom'],
                          ] as [WatermarkPosition, string][]
                        ).map(([posKey, posLabel]) => (
                          <button
                            key={posKey}
                            type="button"
                            disabled={isProcessing || rotation === 'diagonal'}
                            onClick={() => setPosition(posKey)}
                            className={`py-2 px-2 text-xs font-medium rounded transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              position === posKey && rotation === 'horizontal'
                                ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                                : rotation === 'diagonal' && posKey === 'center'
                                ? 'bg-muted text-foreground font-semibold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                            } ${rotation === 'diagonal' && posKey !== 'center' ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            {posLabel}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Opacity Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label
                          htmlFor="watermark-opacity-range"
                          className="font-semibold uppercase tracking-wider text-foreground"
                        >
                          Opacity
                        </label>
                        <span className="font-mono text-muted-foreground font-medium">
                          {Math.round(opacity * 100)}%
                        </span>
                      </div>
                      <input
                        id="watermark-opacity-range"
                        type="range"
                        min="0.05"
                        max="0.8"
                        step="0.05"
                        value={opacity}
                        disabled={isProcessing}
                        aria-valuemin={5}
                        aria-valuemax={80}
                        aria-valuenow={Math.round(opacity * 100)}
                        aria-label="Watermark opacity"
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Font Size Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label
                          htmlFor="watermark-font-size-range"
                          className="font-semibold uppercase tracking-wider text-foreground"
                        >
                          Font Size
                        </label>
                        <span className="font-mono text-muted-foreground font-medium">
                          {fontSize} pt
                        </span>
                      </div>
                      <input
                        id="watermark-font-size-range"
                        type="range"
                        min="20"
                        max="72"
                        value={fontSize}
                        disabled={isProcessing}
                        aria-valuemin={20}
                        aria-valuemax={72}
                        aria-valuenow={fontSize}
                        aria-label="Watermark font size in points"
                        onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                        className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald shrink-0" aria-hidden="true" />
                      <span>
                        Applies &quot;{watermarkText.trim() || 'watermark'}&quot; across {pageCount ? `${pageCount} pages` : 'document'}.
                      </span>
                    </div>

                    <Button
                      size="lg"
                      disabled={isProcessing || !watermarkText.trim() || !activeFile}
                      onClick={handleApplyWatermark}
                      className="w-full shadow-sm"
                    >
                      <span>Apply Watermark</span>
                      <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Architecture Assurance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-border bg-card">
                <CardContent className="p-5 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">100% Client-Side Stamping</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Watermark graphics are layered directly into PDF page streams in local memory. Zero files are uploaded.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-5 flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Live Layout Preview</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Real-time visual overlay synchronizes text placement, scaling, and opacity directly over your document pages before generating.
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
        title="Applying watermark..."
        subtitle="Stamping watermark text across document pages..."
        progressPercent={progressPercent}
      />
    </div>
  );
};
