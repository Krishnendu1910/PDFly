import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import { RotateCw, RotateCcw, ArrowLeft, ArrowRight, ShieldCheck, Zap, Rotate3D } from 'lucide-react';
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
import { PageThumbnailCard } from '@/components/pdf/PageThumbnailCard';
import { ProcessingOverlay } from '@/components/pdf/ProcessingOverlay';
import {
  getPdfPageCount,
  renderPageThumbnail,
  rotatePdfDocument,
  downloadPdfBytes,
  PdfOperationError,
  type PdfPageDescriptor,
  type PdfRotationAngle,
} from '@/lib/pdf';
import type { FileValidationError } from '@/types/file';

const ROTATE_TOOL_CONFIG = {
  ...PDF_ONLY_CONFIG,
  maxFiles: 1,
  minFiles: 1,
};

export const RotateToolPage: FC = () => {
  useDocumentTitle(
    'Rotate PDF Pages',
    'Rotate specific or all PDF pages in your browser memory. Fast, private, and client-side.',
  );

  const [pages, setPages] = useState<PdfPageDescriptor[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [operationErrors, setOperationErrors] = useState<FileValidationError[]>([]);

  const {
    files,
    errors: pipelineErrors,
    hasFiles,
    addFiles,
    clearFiles,
    clearErrors,
  } = useFilePipeline({
    config: ROTATE_TOOL_CONFIG,
  });

  const activeFile = files[0];

  useEffect(() => {
    let isCancelled = false;

    if (!activeFile) {
      setPages([]);
      setSelectedPages(new Set());
      return;
    }

    getPdfPageCount(activeFile.file)
      .then(async (count) => {
        if (isCancelled) return;

        const initialPages: PdfPageDescriptor[] = Array.from({ length: count }, (_, idx) => ({
          id: `page_${idx}_${activeFile.id}`,
          pageNumber: idx + 1,
          originalIndex: idx,
          rotation: 0,
          thumbnailStatus: 'loading',
        }));
        setPages(initialPages);

        for (let i = 1; i <= count; i++) {
          if (isCancelled) break;
          try {
            const url = await renderPageThumbnail(activeFile.file, i, { targetWidth: 180 });
            if (isCancelled) break;
            setPages((prev) =>
              prev.map((p) =>
                p.originalIndex === i - 1
                  ? { ...p, thumbnailUrl: url, thumbnailStatus: 'loaded' }
                  : p,
              ),
            );
          } catch {
            if (isCancelled) break;
            setPages((prev) =>
              prev.map((p) =>
                p.originalIndex === i - 1 ? { ...p, thumbnailStatus: 'error' } : p,
              ),
            );
          }
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Could not read PDF structure.';
          const code = err instanceof PdfOperationError ? err.code : 'INVALID_PDF';
          setOperationErrors([{ code: code as FileValidationError['code'], message: msg }]);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeFile]);

  const allErrors = [...pipelineErrors, ...operationErrors];

  // Rotate a single page
  const rotateSingle = (pageNumber: number, delta: 90 | 270 | 180) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.pageNumber !== pageNumber) return p;
        const newAngle = (((p.rotation + delta) % 360 + 360) % 360) as PdfRotationAngle;
        return { ...p, rotation: newAngle };
      }),
    );
  };

  // Bulk rotate (either all or selected)
  const bulkRotate = (delta: 90 | 270 | 180) => {
    const hasSelection = selectedPages.size > 0;
    setPages((prev) =>
      prev.map((p) => {
        if (hasSelection && !selectedPages.has(p.pageNumber)) return p;
        const newAngle = (((p.rotation + delta) % 360 + 360) % 360) as PdfRotationAngle;
        return { ...p, rotation: newAngle };
      }),
    );
  };

  const resetAllRotations = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: 0 })));
  };

  const toggleSelectPage = (pageNumber: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedPages.size === pages.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(pages.map((p) => p.pageNumber)));
    }
  };

  const hasAnyRotation = pages.some((p) => p.rotation !== 0);

  const [processingStatus, setProcessingStatus] = useState<string>('Writing rotation metadata directly to document streams. Please wait...');

  const handleApplyRotation = async () => {
    if (!activeFile || pages.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setProcessingStatus('Loading PDF document...');
    setOperationErrors([]);

    try {
      const pageRotations = pages.map((p) => ({
        pageIndex: p.originalIndex,
        rotationAngle: p.rotation,
      }));

      const rotatedBytes = await rotatePdfDocument(activeFile.file, {
        pageRotations,
        onProgress: (pct) => {
          setProgressPercent(pct);
          setProcessingStatus(`Rotating pages (${pct}%)...`);
        },
      });

      const baseName = activeFile.name.replace(/\.[^/.]+$/, '');
      const outName = `${baseName}_rotated.pdf`;

      downloadPdfBytes(rotatedBytes, outName);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to apply rotation.';
      const code = err instanceof PdfOperationError ? err.code : 'PROCESSING_FAILED';
      setOperationErrors([{ code: code as FileValidationError['code'], message: msg }]);
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
      setProcessingStatus('Writing rotation metadata directly to document streams. Please wait...');
    }
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
                <Rotate3D className="w-7 h-7" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="success" size="sm">
                    Client-Side Engine Active
                  </Badge>
                  <Badge variant="outline" size="sm">
                    Organize
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Rotate PDF Pages
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
            Rotate individual pages or entire documents clockwise or counter-clockwise. Zero rasterization guarantees 100% preservation of text and vector quality.
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

        {/* Main Workspace */}
        <div className="space-y-8">
          {!hasFiles ? (
            <Dropzone
              onFilesSelected={addFiles}
              config={ROTATE_TOOL_CONFIG}
              multiple={false}
              title="Select or drop a PDF document to rotate"
              subtitle="Choose 1 PDF file (up to 50 MB)"
              disabled={isProcessing}
            />
          ) : (
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-6">
              {/* Batch Action Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span>{activeFile?.name}</span>
                    <Badge variant="outline" size="sm" className="font-mono">
                      {pages.length} pages
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedPages.size > 0
                      ? `Rotating ${selectedPages.size} selected pages`
                      : 'Click individual buttons or use bulk rotation tools below'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => bulkRotate(90)}
                    disabled={isProcessing}
                    className="text-xs"
                  >
                    <RotateCw className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                    Rotate 90° CW
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => bulkRotate(270)}
                    disabled={isProcessing}
                    className="text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                    Rotate 90° CCW
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => bulkRotate(180)}
                    disabled={isProcessing}
                    className="text-xs"
                  >
                    180°
                  </Button>

                  {hasAnyRotation && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetAllRotations}
                      disabled={isProcessing}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Reset
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFiles}
                    disabled={isProcessing}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Change File
                  </Button>
                </div>
              </div>

              {/* Selection Bar */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={selectAll}
                  className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                >
                  {selectedPages.size === pages.length ? 'Deselect All' : 'Select All Pages'}
                </button>
                <span>{selectedPages.size} of {pages.length} selected</span>
              </div>

              {/* Page Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-1">
                {pages.map((page, idx) => (
                  <PageThumbnailCard
                    key={page.id}
                    pageNumber={page.pageNumber}
                    displayIndex={idx}
                    totalDisplayPages={pages.length}
                    rotation={page.rotation}
                    thumbnailUrl={page.thumbnailUrl}
                    thumbnailStatus={page.thumbnailStatus}
                    isSelected={selectedPages.has(page.pageNumber)}
                    onToggleSelect={toggleSelectPage}
                    onRotateClockwise={(num) => rotateSingle(num, 90)}
                    onRotateCounterClockwise={(num) => rotateSingle(num, 270)}
                    showRotateControls={true}
                    showSelectControl={true}
                    disabled={isProcessing}
                  />
                ))}
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-muted-foreground">
                  {hasAnyRotation ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Rotations ready to be saved permanently to document dictionary.
                    </span>
                  ) : (
                    <span>Adjust page orientations above to apply rotation.</span>
                  )}
                </div>

                <Button
                  size="lg"
                  disabled={!hasAnyRotation || isProcessing}
                  onClick={handleApplyRotation}
                  className="w-full sm:w-auto shadow-sm"
                >
                  <span>Apply &amp; Download PDF</span>
                  <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}

          {/* Privacy Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-border bg-card">
              <CardContent className="p-5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Zero Image Conversion</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Modifies native PDF rotation attributes without rasterization. Vector fonts, links, and text selection remain sharp.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-5 flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Instantaneous Execution</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Because pages are not re-rendered or converted to bitmaps, output generation takes milliseconds.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>

      {/* Processing Indicator Modal */}
      <ProcessingOverlay
        isOpen={isProcessing}
        title="Applying page rotations..."
        subtitle={processingStatus}
        progressPercent={progressPercent}
      />
    </div>
  );
};

