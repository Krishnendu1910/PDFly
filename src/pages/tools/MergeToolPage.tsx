import { useState, type FC } from 'react';
import { Link } from 'react-router-dom';
import { ToolIcon, ArrowLeft, CheckCircle, ShieldCheck, ArrowRight, Lightning } from '@/components/icons';
import { ROUTES } from '@/constants/routes';
import { MERGE_PDF_CONFIG } from '@/constants/file';
import { useFilePipeline } from '@/hooks/useFilePipeline';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Dropzone } from '@/components/file/Dropzone';
import { FileList } from '@/components/file/FileList';
import { FileErrorBanner } from '@/components/file/FileErrorBanner';
import { ProcessingOverlay } from '@/components/pdf/ProcessingOverlay';
import { DownloadResultDocket, type OutputFileItem } from '@/components/download';
import { getDefaultDownloadFilename } from '@/utils/filenameUtils';
import { mergePdfDocuments, PdfOperationError } from '@/lib/pdf';
import type { FileValidationError } from '@/types/file';

export const MergeToolPage: FC = () => {
  useDocumentTitle(
    'Merge PDF',
    'Combine multiple PDF documents into a single file in your browser memory. Fast, private, and client-side.',
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [operationErrors, setOperationErrors] = useState<FileValidationError[]>([]);
  const [outputResult, setOutputResult] = useState<OutputFileItem | null>(null);

  const {
    files,
    errors: pipelineErrors,
    formattedTotalSize,
    hasFiles,
    canAddMore,
    isValidForAction,
    minFilesRequired,
    addFiles,
    removeFile,
    clearFiles,
    clearErrors,
    moveUp,
    moveDown,
  } = useFilePipeline({
    config: MERGE_PDF_CONFIG,
  });

  const [processingStatus, setProcessingStatus] = useState<string>('Combining pages into your output document locally. Please wait...');

  const allErrors = [...pipelineErrors, ...operationErrors];

  const handleMerge = async () => {
    if (!isValidForAction || files.length < 2 || isProcessing) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setProcessingStatus('Reading input PDF files...');
    setOperationErrors([]);

    try {
      const nativeFiles = files.map((f) => f.file);
      const mergedBytes = await mergePdfDocuments(nativeFiles, {
        onProgress: (pct) => {
          setProgressPercent(pct);
          setProcessingStatus(`Merging files (${pct}%)...`);
        },
      });

      const defaultFilename = getDefaultDownloadFilename('merge', files[0]?.file.name);
      setOutputResult({
        id: 'merged-output',
        pdfBytes: mergedBytes,
        defaultFilename,
        byteSize: mergedBytes.byteLength,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during merging.';
      const code = err instanceof PdfOperationError ? err.code : 'UNKNOWN_ERROR';

      setOperationErrors([
        {
          code: code as FileValidationError['code'],
          message: msg,
        },
      ]);
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
      setProcessingStatus('Combining pages into your output document locally. Please wait...');
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
              <div className="w-14 h-14 rounded-xl bg-cobalt/10 text-cobalt dark:bg-cobalt/20 dark:text-cobalt flex items-center justify-center shrink-0">
                <ToolIcon toolId="merge" className="w-7 h-7" weight="duotone" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" size="sm">
                    Organize
                  </Badge>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Merge PDF
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
            Combine multiple PDF files into a single unified document in your preferred sequence. Everything is processed directly inside your browser memory without server uploads.
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

        {/* Pipeline Workspace / Download Docket */}
        {outputResult ? (
          <DownloadResultDocket
            outputs={[outputResult]}
            toolName="Merged PDF"
            onBackToEditing={() => setOutputResult(null)}
            onReset={() => {
              setOutputResult(null);
              clearFiles();
            }}
          />
        ) : (
          <div className="space-y-8">
            {/* File Ingestion Dropzone */}
            {canAddMore && (
              <div>
                <Dropzone
                  onFilesSelected={addFiles}
                  config={MERGE_PDF_CONFIG}
                  title={hasFiles ? 'Add more PDF files' : 'Select or drop PDF documents to merge'}
                  subtitle="Only PDF documents are accepted. Maximum 50 MB per file."
                  disabled={isProcessing}
                />
              </div>
            )}

            {/* Selected File List & Controls */}
            {hasFiles && (
              <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-6">
                <FileList
                  files={files}
                  totalSizeFormatted={formattedTotalSize}
                  onRemoveFile={removeFile}
                  onClearFiles={clearFiles}
                  onMoveUp={moveUp}
                  onMoveDown={moveDown}
                  disabled={isProcessing}
                />

                {/* Action Bar */}
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground">
                    {!isValidForAction ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        Select at least {minFilesRequired} files to enable merging (currently {files.length}).
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 inline" aria-hidden="true" />
                        {files.length} PDF files ready to merge (total size: {formattedTotalSize}).
                      </span>
                    )}
                  </div>

                  <div className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      disabled={!isValidForAction || isProcessing}
                      onClick={handleMerge}
                      className="w-full sm:w-auto shadow-sm"
                    >
                      <span>Merge {files.length} PDFs</span>
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
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">100% Client-Side Privacy</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Documents are merged directly inside browser memory via WebAssembly/Web APIs. Files never leave your device.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-5 flex items-start gap-3">
                  <Lightning className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Instant Download</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Merged documents are generated instantaneously without queue times or server-side bandwidth limits.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </Container>

      {/* Processing Indicator Modal */}
      <ProcessingOverlay
        isOpen={isProcessing}
        title="Merging PDF documents..."
        subtitle={processingStatus}
        progressPercent={progressPercent}
      />
    </div>
  );
};
