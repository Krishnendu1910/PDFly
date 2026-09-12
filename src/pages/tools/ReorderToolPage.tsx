import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, ArrowLeft, ArrowRight, ShieldCheck, Zap, RotateCcw } from 'lucide-react';
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
  reorderPdfDocument,
  downloadPdfBytes,
  PdfOperationError,
  type PdfPageDescriptor,
} from '@/lib/pdf';
import type { FileValidationError } from '@/types/file';

const REORDER_TOOL_CONFIG = {
  ...PDF_ONLY_CONFIG,
  maxFiles: 1,
  minFiles: 1,
};

export const ReorderToolPage: FC = () => {
  useDocumentTitle(
    'Reorder PDF Pages',
    'Reorder and reorganize PDF pages in your browser memory. Fast, private, and client-side.',
  );

  const [pages, setPages] = useState<PdfPageDescriptor[]>([]);
  const [initialCount, setInitialCount] = useState<number>(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
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
    config: REORDER_TOOL_CONFIG,
  });

  const activeFile = files[0];

  // Ingest pages when active file changes
  useEffect(() => {
    let isCancelled = false;

    if (!activeFile) {
      setPages([]);
      setInitialCount(0);
      return;
    }

    getPdfPageCount(activeFile.file)
      .then(async (count) => {
        if (isCancelled) return;
        setInitialCount(count);

        // Initialize descriptors with loading state and stable unique IDs
        const initialPages: PdfPageDescriptor[] = Array.from({ length: count }, (_, idx) => ({
          id: `page_${idx}_${activeFile.id}`,
          pageNumber: idx + 1,
          originalIndex: idx,
          rotation: 0,
          thumbnailStatus: 'loading',
        }));
        setPages(initialPages);

        // Progressively load thumbnails
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

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= pages.length || toIndex < 0 || toIndex >= pages.length) return;
    setPages((prev) => {
      const updated = [...prev];
      const [item] = updated.splice(fromIndex, 1);
      if (item) {
        updated.splice(toIndex, 0, item);
      }
      return updated;
    });
  };

  const handleRemove = (pageNumber: number) => {
    setPages((prev) => prev.filter((p) => p.pageNumber !== pageNumber));
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const sourceIndex = draggedIndex ?? Number(e.dataTransfer.getData('text/plain'));
    if (sourceIndex !== null && !Number.isNaN(sourceIndex) && sourceIndex !== dropIndex) {
      handleMove(sourceIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleResetOrder = () => {
    setPages((prev) => [...prev].sort((a, b) => a.originalIndex - b.originalIndex));
  };

  const [processingStatus, setProcessingStatus] = useState<string>('Writing the reassembled document to disk. Please wait...');

  const handleSaveReorder = async () => {
    if (!activeFile || pages.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setProcessingStatus('Loading PDF document...');
    setOperationErrors([]);

    try {
      const pageOrderIndices = pages.map((p) => p.originalIndex);
      const resultBytes = await reorderPdfDocument(activeFile.file, pageOrderIndices, {
        onProgress: (pct) => {
          setProgressPercent(pct);
          setProcessingStatus(`Reordering pages (${pct}%)...`);
        },
      });

      const baseName = activeFile.name.replace(/\.[^/.]+$/, '');
      const outName = `${baseName}_reordered.pdf`;

      downloadPdfBytes(resultBytes, outName);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reorder PDF pages.';
      const code = err instanceof PdfOperationError ? err.code : 'PROCESSING_FAILED';
      setOperationErrors([{ code: code as FileValidationError['code'], message: msg }]);
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
      setProcessingStatus('Writing the reassembled document to disk. Please wait...');
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
                <ArrowUpDown className="w-7 h-7" aria-hidden="true" />
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
                  Reorder PDF Pages
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
            Organize, rearrange, or delete pages in your document. Easily shift pages left or right using intuitive accessible controls.
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
              config={REORDER_TOOL_CONFIG}
              multiple={false}
              title="Select or drop a PDF document to reorder"
              subtitle="Choose 1 PDF file (up to 50 MB)"
              disabled={isProcessing}
            />
          ) : (
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span>{activeFile?.name}</span>
                    <Badge variant="outline" size="sm" className="font-mono">
                      {pages.length} of {initialCount} pages
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Use the arrow buttons below each thumbnail to rearrange page sequence.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetOrder}
                    disabled={isProcessing || pages.length <= 1}
                    className="text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                    Reset Order
                  </Button>

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

              {/* Grid of Pages */}
              {pages.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  All pages have been removed. Click &quot;Reset Order&quot; or choose another file.
                </div>
              ) : (
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
                      draggable={true}
                      isDragTarget={dragOverIndex === idx}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onMoveLeft={(pos) => handleMove(pos, pos - 1)}
                      onMoveRight={(pos) => handleMove(pos, pos + 1)}
                      onRemove={handleRemove}
                      showReorderControls={true}
                      showRemoveControl={true}
                      disabled={isProcessing}
                    />
                  ))}
                </div>
              )}

              {/* Action Bar */}
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-muted-foreground">
                  {pages.length > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {pages.length} pages will be saved in the displayed sequence.
                    </span>
                  ) : (
                    <span className="text-destructive font-medium">
                      At least one page is required to generate a PDF.
                    </span>
                  )}
                </div>

                <Button
                  size="lg"
                  disabled={pages.length === 0 || isProcessing}
                  onClick={handleSaveReorder}
                  className="w-full sm:w-auto shadow-sm"
                >
                  <span>Save Reordered PDF</span>
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
                  <h3 className="text-sm font-semibold text-foreground">Local Memory Security</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Thumbnails and page structures are computed locally in your web browser. Nothing is ever sent to external cloud servers.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-5 flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Lossless Reordering</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Pages are reassembled directly from source PDF streams without lossy rasterization or compression degradation.
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
        title="Reordering PDF pages..."
        subtitle={processingStatus}
        progressPercent={progressPercent}
      />
    </div>
  );
};

