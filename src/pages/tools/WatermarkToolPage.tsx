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
  addWatermarkToPdf,
  PdfOperationError,
  type WatermarkPosition,
  type WatermarkRotation,
} from '@/lib/pdf';
import type { FileValidationError } from '@/types/file';

const WATERMARK_CONFIG = {
  ...PDF_ONLY_CONFIG,
  maxFiles: 1,
  minFiles: 1,
};

export const WatermarkToolPage: FC = () => {
  useDocumentTitle(
    'Watermark PDF',
    'Stamp custom text watermarks, draft notices, or confidentiality markers across your PDF document.',
  );

  const [pageCount, setPageCount] = useState<number | null>(null);
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
            Apply custom text stamps, confidentiality banners, or copyright markers across all pages of your PDF document. Processed entirely in browser memory.
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
                  {/* Watermark Text */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="watermark-text-input" className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                      Watermark Text
                    </label>
                    <input
                      id="watermark-text-input"
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL, DRAFT, NOT FOR DISTRIBUTION"
                      className="w-full px-3.5 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Position Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                      Position
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg border border-border bg-background">
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

                  {/* Rotation Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                      Orientation
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg border border-border bg-background">
                      <button
                        type="button"
                        onClick={() => setRotation('diagonal')}
                        className={`py-2 px-2 text-xs font-medium rounded transition-all text-center ${
                          rotation === 'diagonal'
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        Diagonal (45°)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotation('horizontal')}
                        className={`py-2 px-2 text-xs font-medium rounded transition-all text-center ${
                          rotation === 'horizontal'
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        Horizontal (0°)
                      </button>
                    </div>
                  </div>

                  {/* Opacity Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="watermark-opacity-range" className="font-semibold uppercase tracking-wider text-foreground">
                        Opacity
                      </label>
                      <span className="font-mono text-muted-foreground">{Math.round(opacity * 100)}%</span>
                    </div>
                    <input
                      id="watermark-opacity-range"
                      type="range"
                      min="0.05"
                      max="0.8"
                      step="0.05"
                      value={opacity}
                      onChange={(e) => setOpacity(parseFloat(e.target.value))}
                      className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Font Size Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="watermark-font-size-range" className="font-semibold uppercase tracking-wider text-foreground">
                        Font Size
                      </label>
                      <span className="font-mono text-muted-foreground">{fontSize} pt</span>
                    </div>
                    <input
                      id="watermark-font-size-range"
                      type="range"
                      min="20"
                      max="72"
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
                      <CheckCircle2 className="w-4 h-4 inline" aria-hidden="true" />
                      Ready to apply &quot;{watermarkText.trim()}&quot; across {pageCount || 'all'} pages.
                    </span>
                  </div>

                  <Button
                    size="lg"
                    disabled={isProcessing || !watermarkText.trim() || pageCount === null}
                    onClick={handleApplyWatermark}
                    className="w-full sm:w-auto shadow-sm"
                  >
                    <span>Apply Watermark</span>
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
                    <h3 className="text-sm font-semibold text-foreground">Alpha Transparency</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Embedded text elements use standard PDF Extended Graphics States to ensure background document text remains readable.
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

