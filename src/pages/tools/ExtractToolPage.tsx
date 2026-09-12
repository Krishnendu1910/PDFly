import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import {
  FileOutput,
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
import { RangeInput } from '@/components/pdf/RangeInput';
import { PageThumbnailCard } from '@/components/pdf/PageThumbnailCard';
import { ProcessingOverlay } from '@/components/pdf/ProcessingOverlay';
import { DownloadResultDocket, type OutputFileItem } from '@/components/download';
import { getDefaultDownloadFilename } from '@/utils/filenameUtils';
import {
  getPdfPageCount,
  renderPageThumbnail,
  extractPagesFromPdf,
  PdfOperationError,
  type PdfPageDescriptor,
} from '@/lib/pdf';
import type { FileValidationError } from '@/types/file';

const EXTRACT_TOOL_CONFIG = {
  ...PDF_ONLY_CONFIG,
  maxFiles: 1,
  minFiles: 1,
};

export const ExtractToolPage: FC = () => {
  useDocumentTitle(
    'Extract PDF Pages',
    'Extract specific pages or custom ranges into a single new PDF document directly in your browser.',
  );

  const [pageCount, setPageCount] = useState<number | null>(null);
  const [pages, setPages] = useState<PdfPageDescriptor[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rangeString, setRangeString] = useState('');
  const [isRangeValid, setIsRangeValid] = useState(false);
  const [inputMode, setInputMode] = useState<'visual' | 'range'>('visual');
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
    config: EXTRACT_TOOL_CONFIG,
  });

  const activeFile = files[0];

  useEffect(() => {
    let isCancelled = false;

    if (!activeFile) {
      setPageCount(null);
      setPages([]);
      setSelectedPages(new Set());
      setRangeString('');
      setOutputResult(null);
      return;
    }

    getPdfPageCount(activeFile.file)
      .then(async (count) => {
        if (isCancelled) return;
        setPageCount(count);

        const initialPages: PdfPageDescriptor[] = Array.from({ length: count }, (_, idx) => ({
          id: `page_${idx}_${activeFile.id}`,
          pageNumber: idx + 1,
          originalIndex: idx,
          rotation: 0,
          thumbnailStatus: 'loading',
        }));
        setPages(initialPages);

        // Pre-select first page by default
        setSelectedPages(new Set([1]));
        setRangeString('1');
        setIsRangeValid(true);

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

  // Visual toggle
  const toggleSelect = (pageNumber: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      // Sync range string from visual selection
      const sorted = Array.from(next).sort((a, b) => a - b);
      setRangeString(sorted.join(', '));
      setIsRangeValid(sorted.length > 0);
      return next;
    });
  };

  const handleExtract = async () => {
    if (!activeFile || isProcessing) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setOperationErrors([]);

    try {
      // Use rangeString or selectedPages array
      const selection = inputMode === 'range' ? rangeString : Array.from(selectedPages).sort((a, b) => a - b);
      const result = await extractPagesFromPdf(activeFile.file, selection, {
        onProgress: (pct) => setProgressPercent(pct),
      });

      const defaultFilename = getDefaultDownloadFilename('extract', activeFile.name);
      setOutputResult({
        id: 'extracted-output',
        pdfBytes: result.pdfBytes,
        defaultFilename,
        byteSize: result.pdfBytes.byteLength,
        pageCount: result.extractedCount,
        label: `Extracted ${result.extractedCount} ${result.extractedCount === 1 ? 'page' : 'pages'}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to extract pages.';
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
    setRangeString('');
  };

  const effectiveCount = inputMode === 'range'
    ? (isRangeValid ? rangeString.split(',').length : 0)
    : selectedPages.size;

  const canExtract = inputMode === 'range' ? isRangeValid : selectedPages.size > 0;

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
                <FileOutput className="w-7 h-7" aria-hidden="true" />
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
                  Extract PDF Pages
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
            Pick specific pages or define range expressions to extract into a single standalone PDF document. Fast, private, and strictly in-memory.
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
            toolName="Extracted Document"
            toolIdentifier="[TOOL // 08 · PAGE EXTRACTOR]"
            onReset={handleReset}
          />
        ) : (
          <div className="space-y-8">
            {/* File Ingestion */}
            {!hasFiles && (
              <Dropzone
                onFilesSelected={addFiles}
                config={EXTRACT_TOOL_CONFIG}
                multiple={false}
                title="Select or drop a PDF document to extract pages"
                subtitle="Choose 1 PDF file (up to 50 MB)"
                disabled={isProcessing}
              />
            )}

            {/* Selected File & Extraction Workspace */}
            {hasFiles && activeFile && (
              <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-6">
                {/* Header with Mode Switch */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                  <div>
                    <h2 className="text-base font-bold text-foreground truncate max-w-sm sm:max-w-md">
                      {activeFile.name}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pageCount} {pageCount === 1 ? 'page' : 'pages'} &bull; {activeFile.formattedSize}
                    </p>
                  </div>

                  {/* Mode Toggles */}
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-lg border border-border p-0.5 bg-secondary/50 text-xs">
                      <button
                        type="button"
                        onClick={() => setInputMode('visual')}
                        className={`px-3 py-1 rounded-md font-medium transition-colors ${
                          inputMode === 'visual'
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Visual Selection
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode('range')}
                        className={`px-3 py-1 rounded-md font-medium transition-colors ${
                          inputMode === 'range'
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Range Text
                      </button>
                    </div>

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

                {/* Range Input Mode */}
                {inputMode === 'range' && pageCount !== null && (
                  <div className="space-y-4">
                    <RangeInput
                      totalPages={pageCount}
                      value={rangeString}
                      onChange={(val, valid) => {
                        setRangeString(val);
                        setIsRangeValid(valid);
                      }}
                      disabled={isProcessing}
                    />
                  </div>
                )}

                {/* Visual Thumbnail Grid Mode */}
                {inputMode === 'visual' && (
                  <div className="space-y-4">
                    <div className="text-xs text-muted-foreground">
                      Click thumbnails to toggle inclusion in the extracted document.
                    </div>
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
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground">
                    {canExtract ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 inline" aria-hidden="true" />
                        Ready to extract {effectiveCount} {effectiveCount === 1 ? 'page' : 'pages'} into a single PDF.
                      </span>
                    ) : (
                      <span>Select or enter at least 1 page to extract.</span>
                    )}
                  </div>

                  <Button
                    size="lg"
                    disabled={!canExtract || isProcessing}
                    onClick={handleExtract}
                    className="w-full sm:w-auto shadow-sm"
                  >
                    <span>Extract {effectiveCount > 0 ? `${effectiveCount} Pages` : 'Pages'}</span>
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
                    <h3 className="text-sm font-semibold text-foreground">Zero Cloud Exposure</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Pages are parsed and copied strictly in your local browser runtime.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-5 flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Single File Output</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Unlike Split, Extract compiles all selected pages into a single consolidated PDF.
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
        title="Extracting pages..."
        subtitle="Compiling selected pages into a new document..."
        progressPercent={progressPercent}
      />
    </div>
  );
};

