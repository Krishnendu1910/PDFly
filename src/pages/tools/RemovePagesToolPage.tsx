import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import {
  ToolIcon,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Lightning,
  ArrowCounterClockwise,
  CheckSquare,
  Square,
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
import { PageThumbnailCard } from '@/components/pdf/PageThumbnailCard';
import { ProcessingOverlay } from '@/components/pdf/ProcessingOverlay';
import { DownloadResultDocket, type OutputFileItem } from '@/components/download';
import { getDefaultDownloadFilename } from '@/utils/filenameUtils';
import {
  getPdfPageCount,
  renderPageThumbnail,
  removePagesFromPdf,
  PdfOperationError,
  type PdfPageDescriptor,
} from '@/lib/pdf';
import type { FileValidationError } from '@/types/file';

const REMOVE_TOOL_CONFIG = {
  ...PDF_ONLY_CONFIG,
  maxFiles: 1,
  minFiles: 1,
};

export const RemovePagesToolPage: FC = () => {
  useDocumentTitle(
    'Remove PDF Pages',
    'Delete unwanted or sensitive pages from your PDF document locally in your browser.',
  );

  const [pages, setPages] = useState<PdfPageDescriptor[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
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
    config: REMOVE_TOOL_CONFIG,
  });

  const activeFile = files[0];

  useEffect(() => {
    let isCancelled = false;

    if (!activeFile) {
      setPages([]);
      setSelectedPages(new Set());
      setOutputResult(null);
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

  const toggleSelect = (pageNumber: number) => {
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
    setSelectedPages(new Set(pages.map((p) => p.pageNumber)));
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
  };

  const invertSelection = () => {
    setSelectedPages((prev) => {
      const next = new Set<number>();
      for (const p of pages) {
        if (!prev.has(p.pageNumber)) {
          next.add(p.pageNumber);
        }
      }
      return next;
    });
  };

  const remainingCount = pages.length - selectedPages.size;
  const canRemove = selectedPages.size > 0 && remainingCount > 0;

  const handleRemove = async () => {
    if (!activeFile || !canRemove || isProcessing) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setOperationErrors([]);

    try {
      const pagesToRemove = Array.from(selectedPages);
      const result = await removePagesFromPdf(activeFile.file, pagesToRemove, {
        onProgress: (pct) => setProgressPercent(pct),
      });

      const defaultFilename = getDefaultDownloadFilename('remove-pages', activeFile.name);
      setOutputResult({
        id: 'removed-output',
        pdfBytes: result.pdfBytes,
        defaultFilename,
        byteSize: result.pdfBytes.byteLength,
        pageCount: result.remainingPageCount,
        label: `PDF with ${selectedPages.size} ${selectedPages.size === 1 ? 'page' : 'pages'} removed`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove pages.';
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
    setPages([]);
    setSelectedPages(new Set());
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
              <div className="w-14 h-14 rounded-xl bg-vermillion/10 text-vermillion dark:bg-vermillion/20 dark:text-vermillion flex items-center justify-center shrink-0">
                <ToolIcon toolId="remove-pages" className="w-7 h-7" weight="duotone" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" size="sm">
                    Organize
                  </Badge>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Remove PDF Pages
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
            Select one or more pages to remove from your document. The remaining pages will be compiled into a fresh, private PDF directly on your device.
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
            toolName="Pruned Document"
            onBackToEditing={() => setOutputResult(null)}
            onReset={handleReset}
          />
        ) : (
          <div className="space-y-8">
            {/* File Ingestion */}
            {!hasFiles && (
              <Dropzone
                onFilesSelected={addFiles}
                config={REMOVE_TOOL_CONFIG}
                multiple={false}
                title="Select or drop a PDF document to remove pages"
                subtitle="Choose 1 PDF file (up to 50 MB)"
                disabled={isProcessing}
              />
            )}

            {/* Selected File & Page Selection Grid */}
            {hasFiles && activeFile && (
              <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-6">
                {/* File Header & Selection Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                  <div>
                    <h2 className="text-base font-bold text-foreground truncate max-w-sm sm:max-w-md">
                      {activeFile.name}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pages.length} {pages.length === 1 ? 'page' : 'pages'} &bull; {activeFile.formattedSize}
                    </p>
                  </div>

                  {/* Batch Selection Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                      disabled={isProcessing || pages.length === 0}
                      title="Select all pages"
                    >
                      <CheckSquare className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                      <span>Select All</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      disabled={isProcessing || selectedPages.size === 0}
                      title="Deselect all pages"
                    >
                      <Square className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                      <span>Clear</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={invertSelection}
                      disabled={isProcessing || pages.length === 0}
                      title="Invert selection"
                    >
                      <ArrowCounterClockwise className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                      <span>Invert</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      disabled={isProcessing}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Change File
                    </Button>
                  </div>
                </div>

                {/* Page Thumbnails Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {pages.map((p, idx) => {
                    const isSelected = selectedPages.has(p.pageNumber);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleSelect(p.pageNumber)}
                        className="cursor-pointer"
                      >
                        <PageThumbnailCard
                          pageNumber={p.pageNumber}
                          displayIndex={idx}
                          totalDisplayPages={pages.length}
                          rotation={p.rotation}
                          thumbnailUrl={p.thumbnailUrl}
                          thumbnailStatus={p.thumbnailStatus}
                          isSelected={isSelected}
                          onToggleSelect={toggleSelect}
                          showSelectControl={true}
                          disabled={isProcessing}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Action Bar */}
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground">
                    {selectedPages.size === 0 ? (
                      <span>Select the pages you wish to remove from the document.</span>
                    ) : remainingCount === 0 ? (
                      <span className="text-destructive font-medium">
                        Cannot remove all pages. At least 1 page must remain.
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 inline" aria-hidden="true" />
                        Removing {selectedPages.size} {selectedPages.size === 1 ? 'page' : 'pages'} ({remainingCount} remaining).
                      </span>
                    )}
                  </div>

                  <Button
                    size="lg"
                    variant="destructive"
                    disabled={!canRemove || isProcessing}
                    onClick={handleRemove}
                    className="w-full sm:w-auto shadow-sm"
                  >
                    <span>Remove {selectedPages.size} {selectedPages.size === 1 ? 'Page' : 'Pages'}</span>
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
                    <h3 className="text-sm font-semibold text-foreground">100% In-Memory Privacy</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Pages are stripped entirely inside browser memory. Removed page streams are completely omitted from the new file.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-5 flex items-start gap-3">
                  <Lightning className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Lossless Recompilation</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Text vectors, fonts, and annotations on surviving pages remain untouched without loss of quality.
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
        title="Removing pages..."
        subtitle="Extracting remaining pages..."
        progressPercent={progressPercent}
      />
    </div>
  );
};

