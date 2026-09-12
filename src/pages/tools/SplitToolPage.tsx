import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, ArrowLeft, ArrowRight, ShieldCheck, Zap, FileText } from 'lucide-react';
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
import { ProcessingOverlay } from '@/components/pdf/ProcessingOverlay';
import {
  getPdfPageCount,
  splitPdfDocument,
  downloadPdfBytes,
  PdfOperationError,
} from '@/lib/pdf';
import type { FileValidationError } from '@/types/file';

const SPLIT_TOOL_CONFIG = {
  ...PDF_ONLY_CONFIG,
  maxFiles: 1,
  minFiles: 1,
};

export const SplitToolPage: FC = () => {
  useDocumentTitle(
    'Split PDF',
    'Extract individual pages or page ranges from a PDF document in your browser memory. Fast, private, and client-side.',
  );

  const [pageCount, setPageCount] = useState<number | null>(null);
  const [rangeString, setRangeString] = useState('');
  const [isRangeValid, setIsRangeValid] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
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
    config: SPLIT_TOOL_CONFIG,
  });

  const activeFile = files[0];

  // Inspect page count whenever the active file changes
  useEffect(() => {
    let isCancelled = false;

    if (!activeFile) {
      setPageCount(null);
      setRangeString('');
      setIsRangeValid(false);
      return;
    }

    getPdfPageCount(activeFile.file)
      .then((count) => {
        if (!isCancelled) {
          setPageCount(count);
          // Set sensible initial range (e.g. all pages or first page)
          const initial = count === 1 ? '1' : `1-${Math.min(count, 3)}`;
          setRangeString(initial);
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

  const [processingStatus, setProcessingStatus] = useState<string>('Generating your split document in browser memory. Please wait...');

  const allErrors = [...pipelineErrors, ...operationErrors];

  const handleSplit = async () => {
    if (!activeFile || !isRangeValid || isProcessing) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setProcessingStatus('Parsing PDF structure...');
    setOperationErrors([]);

    try {
      const result = await splitPdfDocument(activeFile.file, rangeString, {
        onProgress: (pct) => {
          setProgressPercent(pct);
          setProcessingStatus(`Extracting pages (${pct}%)...`);
        },
      });

      const baseName = activeFile.name.replace(/\.[^/.]+$/, '');
      const outName = `${baseName}_split.pdf`;

      downloadPdfBytes(result.pdfBytes, outName);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred while splitting the PDF.';
      const code = err instanceof PdfOperationError ? err.code : 'UNKNOWN_ERROR';
      setOperationErrors([{ code: code as FileValidationError['code'], message: msg }]);
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
      setProcessingStatus('Generating your split document in browser memory. Please wait...');
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
                <Scissors className="w-7 h-7" aria-hidden="true" />
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
                  Split PDF
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
            Extract custom page ranges or individual pages into a new PDF document. Completely processed on your device with zero cloud uploads.
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

        {/* Workspace */}
        <div className="space-y-8">
          {/* File Selection */}
          {!hasFiles ? (
            <Dropzone
              onFilesSelected={addFiles}
              config={SPLIT_TOOL_CONFIG}
              multiple={false}
              title="Select or drop a PDF document to split"
              subtitle="Choose 1 PDF file to extract pages from (up to 50 MB)"
              disabled={isProcessing}
            />
          ) : (
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-6">
              {/* Selected File Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground truncate max-w-xs sm:max-w-md">
                      {activeFile?.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeFile?.formattedSize} &bull;{' '}
                      {pageCount !== null ? (
                        <strong>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</strong>
                      ) : (
                        'Reading page count...'
                      )}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFiles}
                  disabled={isProcessing}
                  className="text-xs text-muted-foreground hover:text-destructive self-start sm:self-auto"
                >
                  Choose Different File
                </Button>
              </div>

              {/* Range Selector Form */}
              {pageCount !== null && (
                <div className="space-y-6">
                  <RangeInput
                    totalPages={pageCount}
                    value={rangeString}
                    onChange={(val, valid, count) => {
                      setRangeString(val);
                      setIsRangeValid(valid);
                      setSelectedCount(count);
                    }}
                    disabled={isProcessing}
                  />

                  {/* Action Bar */}
                  <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-muted-foreground">
                      {isRangeValid && selectedCount > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Ready to extract {selectedCount} {selectedCount === 1 ? 'page' : 'pages'} into a new document.
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Specify pages to enable extraction.
                        </span>
                      )}
                    </div>

                    <Button
                      size="lg"
                      disabled={!isRangeValid || isProcessing}
                      onClick={handleSplit}
                      className="w-full sm:w-auto shadow-sm"
                    >
                      <span>Extract {selectedCount > 0 ? `${selectedCount} Pages` : 'Pages'}</span>
                      <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Privacy & Speed Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-border bg-card">
              <CardContent className="p-5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Zero Server Ingestion</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Pages are extracted in-memory using WebAssembly and client-side PDF primitives.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-5 flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Lossless Extraction</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Vector typography, bookmarks, links, and layout metadata are maintained in the output file.
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
        title="Extracting PDF pages..."
        subtitle={processingStatus}
        progressPercent={progressPercent}
      />
    </div>
  );
};

