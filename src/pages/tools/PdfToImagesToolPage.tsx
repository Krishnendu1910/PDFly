import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import {
  FileImage,
  ArrowLeft,
  ArrowRight,
  Download,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Sliders,
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
import { formatFileSize } from '@/lib/utils/file';
import { extractBaseName } from '@/utils/filenameUtils';
import {
  getPdfPageCount,
  convertPdfToImages,
  PdfOperationError,
  type RenderedPdfImage,
} from '@/lib/pdf';
import type { FileValidationError } from '@/types/file';

const PDF_TO_IMAGES_CONFIG = {
  ...PDF_ONLY_CONFIG,
  maxFiles: 1,
  minFiles: 1,
};

export const PdfToImagesToolPage: FC = () => {
  useDocumentTitle(
    'PDF to Images',
    'Convert PDF pages into high-resolution PNG or JPEG images directly in your browser.',
  );

  const [pageCount, setPageCount] = useState<number | null>(null);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState<number>(0.92);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [operationErrors, setOperationErrors] = useState<FileValidationError[]>([]);
  const [renderedImages, setRenderedImages] = useState<RenderedPdfImage[] | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const {
    files,
    errors: pipelineErrors,
    hasFiles,
    addFiles,
    clearFiles,
    clearErrors,
  } = useFilePipeline({
    config: PDF_TO_IMAGES_CONFIG,
  });

  const activeFile = files[0];

  useEffect(() => {
    let isCancelled = false;

    if (!activeFile) {
      setPageCount(null);
      setRenderedImages(null);
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
    setProgressStatus('Initializing rendering worker...');
    setOperationErrors([]);

    try {
      const baseName = extractBaseName(activeFile.name) || 'document';
      const images = await convertPdfToImages(activeFile.file, {
        format,
        quality,
        baseFilename: baseName,
        onProgress: (current, total, pct) => {
          setProgressPercent(pct);
          setProgressStatus(`Rendering page ${current} of ${total} (${pct}%)...`);
        },
      });

      setRenderedImages(images);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to convert PDF pages to images.';
      const code = err instanceof PdfOperationError ? err.code : 'PROCESSING_FAILED';
      setOperationErrors([{ code: code as FileValidationError['code'], message: msg }]);
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
    }
  };

  const downloadSingleImage = (img: RenderedPdfImage) => {
    const url = URL.createObjectURL(img.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = img.filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const handleDownloadAll = async () => {
    if (!renderedImages || renderedImages.length === 0 || isDownloadingAll) return;

    setIsDownloadingAll(true);
    try {
      for (let i = 0; i < renderedImages.length; i++) {
        downloadSingleImage(renderedImages[i]);
        if (i < renderedImages.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    } finally {
      setTimeout(() => setIsDownloadingAll(false), 1000);
    }
  };

  const handleReset = () => {
    setRenderedImages(null);
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
              <div className="w-14 h-14 rounded-xl bg-teal/10 text-teal dark:bg-teal/20 dark:text-teal flex items-center justify-center shrink-0">
                <FileImage className="w-7 h-7" aria-hidden="true" />
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
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  PDF to Images
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
            Convert individual PDF pages into high-resolution PNG or JPEG graphics locally. Export individual slides or download all pages with full privacy.
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

        {/* Results View or File Ingestion */}
        {renderedImages ? (
          <div className="space-y-6">
            {/* Action Bar Header */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="success" size="sm">
                    {renderedImages.length} {renderedImages.length === 1 ? 'Image' : 'Images'} Ready
                  </Badge>
                  <span className="font-mono text-xs uppercase text-muted-foreground">
                    Format: {format.toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-foreground">Converted Image Gallery</h2>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  size="md"
                  onClick={handleDownloadAll}
                  disabled={isDownloadingAll}
                  className="font-mono text-xs uppercase tracking-wider flex-1 sm:flex-initial"
                >
                  <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                  <span>{isDownloadingAll ? 'Downloading...' : `Download All (${renderedImages.length})`}</span>
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={handleReset}
                  className="font-mono text-xs uppercase tracking-wider"
                >
                  Process Another
                </Button>
              </div>
            </div>

            {/* Rendered Images Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderedImages.map((img) => (
                <div
                  key={img.pageNumber}
                  className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs hover:border-primary/40 transition-colors"
                >
                  <div className="aspect-[3/4] bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center border border-border/50">
                    <img
                      src={img.dataUrl}
                      alt={`Rendered Page ${img.pageNumber}`}
                      className="max-h-full max-w-full object-contain shadow-xs"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
                    <div>
                      <span className="font-mono text-xs font-semibold text-foreground block">
                        Page {img.pageNumber}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {img.width}×{img.height} &bull; {formatFileSize(img.blob.size)}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadSingleImage(img)}
                      className="font-mono text-xs uppercase tracking-wider"
                      title={`Download ${img.filename}`}
                    >
                      <Download className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                      <span>Save</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Dropzone */}
            {!hasFiles && (
              <Dropzone
                onFilesSelected={addFiles}
                config={PDF_TO_IMAGES_CONFIG}
                multiple={false}
                title="Select or drop a PDF document to convert to images"
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

                {/* Configuration Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border bg-secondary/20">
                  {/* Format Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                      Target Format
                    </label>
                    <div className="inline-flex rounded-lg border border-border p-0.5 bg-background text-xs w-full">
                      <button
                        type="button"
                        onClick={() => setFormat('png')}
                        className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                          format === 'png'
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        PNG (Lossless)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormat('jpeg')}
                        className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                          format === 'jpeg'
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        JPEG (Compact)
                      </button>
                    </div>
                  </div>

                  {/* JPEG Quality Slider */}
                  {format === 'jpeg' ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="jpeg-quality" className="font-semibold uppercase tracking-wider text-foreground">
                          JPEG Quality
                        </label>
                        <span className="font-mono text-muted-foreground">
                          {Math.round(quality * 100)}%
                        </span>
                      </div>
                      <input
                        id="jpeg-quality"
                        type="range"
                        min="0.5"
                        max="1.0"
                        step="0.05"
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-5">
                      <Sliders className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                      <span>Full alpha transparency & vector crispness preserved.</span>
                    </div>
                  )}
                </div>

                {/* Conversion Trigger Bar */}
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 inline" aria-hidden="true" />
                      Ready to render {pageCount || 'all'} pages into {format.toUpperCase()} images.
                    </span>
                  </div>

                  <Button
                    size="lg"
                    disabled={isProcessing || pageCount === null}
                    onClick={handleConvert}
                    className="w-full sm:w-auto shadow-sm"
                  >
                    <span>Convert {pageCount ? `${pageCount} Pages` : 'Document'} to Images</span>
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
                    <h3 className="text-sm font-semibold text-foreground">100% In-Browser Rendering</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Pages are rendered off-screen via sandboxed Web Workers. Your files never touch external servers.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-5 flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Sequential Memory Guard</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Pages are processed sequentially with immediate canvas disposal to prevent memory spikes on large documents.
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
        title="Rendering pages..."
        subtitle={progressStatus}
        progressPercent={progressPercent}
      />
    </div>
  );
};
