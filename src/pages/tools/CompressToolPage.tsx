import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import {
  Minimize2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { COMPRESS_PDF_CONFIG } from '@/constants/file';
import { useFilePipeline } from '@/hooks/useFilePipeline';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Dropzone } from '@/components/file/Dropzone';
import { FileErrorBanner } from '@/components/file/FileErrorBanner';
import { ProcessingOverlay } from '@/components/pdf/ProcessingOverlay';
import { CompressionModeSelector } from '@/components/compression/CompressionModeSelector';
import { CompressionStatsCard } from '@/components/compression/CompressionStatsCard';
import { DownloadResultDocket } from '@/components/download';
import { getDefaultDownloadFilename } from '@/utils/filenameUtils';
import {
  detectPdfCharacteristics,
  compressPdfDocument,
  PdfOperationError,
  type CompressionMode,
  type CompressionResult,
  type PdfCharacteristics,
} from '@/lib/pdf';
import type { FileValidationError } from '@/types/file';

export const CompressToolPage: FC = () => {
  useDocumentTitle(
    'Compress PDF',
    'Reduce PDF file size locally in your browser with adjustable compression levels while preserving text and layout.',
  );

  const [selectedMode, setSelectedMode] = useState<CompressionMode>('balanced');
  const [characteristics, setCharacteristics] = useState<PdfCharacteristics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStage, setProgressStage] = useState('Analyzing document structure...');
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [operationErrors, setOperationErrors] = useState<FileValidationError[]>([]);

  const {
    files,
    errors: pipelineErrors,
    hasFiles,
    isValidForAction,
    addFiles,
    clearFiles,
    clearErrors,
  } = useFilePipeline({
    config: COMPRESS_PDF_CONFIG,
  });

  const activeFile = files[0];

  // Inspect PDF characteristics when active file changes
  useEffect(() => {
    let isCancelled = false;

    if (!activeFile) {
      setCharacteristics(null);
      setCompressionResult(null);
      setOperationErrors([]);
      return;
    }

    setIsAnalyzing(true);
    setCompressionResult(null);
    setOperationErrors([]);

    (async () => {
      try {
        const buf = await activeFile.file.arrayBuffer();
        if (isCancelled) return;
        const bytes = new Uint8Array(buf);
        const detected = await detectPdfCharacteristics(bytes);
        if (isCancelled) return;
        setCharacteristics(detected);
      } catch (err) {
        if (isCancelled) return;
        const msg = err instanceof Error ? err.message : 'Could not inspect PDF structure.';
        const code = err instanceof PdfOperationError ? err.code : 'INVALID_PDF';
        setOperationErrors([{ code: code as FileValidationError['code'], message: msg }]);
      } finally {
        if (!isCancelled) {
          setIsAnalyzing(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [activeFile]);

  const allErrors = [...pipelineErrors, ...operationErrors];

  const handleCompress = async () => {
    if (!activeFile || isProcessing) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setProgressStage('Analyzing document structure...');
    setOperationErrors([]);

    try {
      const buf = await activeFile.file.arrayBuffer();
      const bytes = new Uint8Array(buf);

      const result = await compressPdfDocument(bytes, {
        mode: selectedMode,
        onProgress: (stage, pct) => {
          setProgressStage(stage);
          setProgressPercent(pct);
        },
      });

      setCompressionResult(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to compress document.';
      const code = err instanceof PdfOperationError ? err.code : 'PROCESSING_FAILED';
      setOperationErrors([{ code: code as FileValidationError['code'], message: msg }]);
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
    }
  };

  const handleReset = () => {
    clearFiles();
    setCharacteristics(null);
    setCompressionResult(null);
    setOperationErrors([]);
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
              <div className="w-14 h-14 rounded-xl bg-emerald/10 text-emerald dark:bg-emerald/20 dark:text-emerald flex items-center justify-center shrink-0">
                <Minimize2 className="w-7 h-7" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="success" size="sm">
                    Client-Side Engine Active
                  </Badge>
                  <Badge variant="outline" size="sm">
                    Optimize
                  </Badge>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Compress PDF
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
            Optimize and reduce PDF file sizes locally inside your browser. Select your preferred compression intensity while preserving selectable text, layout, and document readability.
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

        {/* Pipeline Workspace */}
        <div className="space-y-8">
          {/* File Dropzone */}
          {!hasFiles && (
            <div>
              <Dropzone
                onFilesSelected={addFiles}
                config={COMPRESS_PDF_CONFIG}
                title="Select or drop a PDF document to compress"
                subtitle="Accepts single PDF files up to 50 MB. Processing is 100% client-side."
                disabled={isProcessing}
              />
            </div>
          )}

          {/* Populated State: File Card & Mode Selection */}
          {hasFiles && activeFile && (
            <div className="space-y-6">
              {/* Active Document Overview Card */}
              <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 text-primary">
                      <FileText className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-foreground truncate" title={activeFile.name}>
                        {activeFile.name}
                      </h2>
                      <span className="text-xs text-muted-foreground font-mono">
                        {activeFile.formattedSize}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="text-muted-foreground hover:text-foreground"
                    title="Change document"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    <span>Change File</span>
                  </Button>
                </div>

                {/* Characteristics Profile */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {isAnalyzing ? (
                    <span className="text-muted-foreground animate-pulse">
                      Analyzing document profile...
                    </span>
                  ) : characteristics ? (
                    <>
                      <Badge variant="outline" size="sm">
                        {characteristics.pageCount} {characteristics.pageCount === 1 ? 'Page' : 'Pages'}
                      </Badge>
                      <Badge variant="secondary" size="sm" className="capitalize">
                        {characteristics.contentType === 'image-heavy' && (
                          <ImageIcon className="w-3 h-3 mr-1 inline" aria-hidden="true" />
                        )}
                        {characteristics.contentType === 'text-vector' && (
                          <Sparkles className="w-3 h-3 mr-1 inline" aria-hidden="true" />
                        )}
                        {characteristics.contentType.replace('-', ' ')}
                      </Badge>
                      {characteristics.imageCount > 0 && (
                        <span className="text-muted-foreground font-mono">
                          ({characteristics.imageCount} embedded {characteristics.imageCount === 1 ? 'image' : 'images'})
                        </span>
                      )}
                    </>
                  ) : null}
                </div>
              </div>

              {/* Compression Mode Selector */}
              <div className="p-6 rounded-2xl border border-border bg-card shadow-xs">
                <CompressionModeSelector
                  selectedMode={selectedMode}
                  onChange={setSelectedMode}
                  disabled={isProcessing}
                />

                <div className="pt-6 mt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground">
                    Selectable text, vector shapes, bookmarks, and fonts are strictly preserved.
                  </div>

                  <Button
                    size="lg"
                    disabled={!isValidForAction || isProcessing || isAnalyzing}
                    onClick={handleCompress}
                    className="w-full sm:w-auto shadow-sm"
                  >
                    <span>Compress PDF</span>
                    <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {/* Compression Results Display */}
              {compressionResult && (
                <div className="space-y-6">
                  <CompressionStatsCard
                    result={compressionResult}
                    disabled={isProcessing}
                  />

                  <DownloadResultDocket
                    outputs={[
                      {
                        id: 'output-compressed',
                        pdfBytes: compressionResult.outputBytes,
                        defaultFilename: getDefaultDownloadFilename('compress', activeFile.name),
                        byteSize: compressionResult.compressedBytes,
                        label: 'Compressed Document',
                      },
                    ]}
                    toolName="Compressed PDF"
                    toolIdentifier="[TOOL // 09 · STREAM COMPACTOR]"
                    onBackToEditing={() => setCompressionResult(null)}
                    onReset={handleReset}
                  />
                </div>
              )}
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
                    PDF streams are analyzed and recompressed entirely inside browser memory. Files are never uploaded to any remote server.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-5 flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Zero Text Degradation</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Unlike destructive full-page rasterizers, PDFly targets embedded image streams and syntax structures, preserving razor-sharp text and vectors.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>

      {/* Processing Overlay Dialog */}
      <ProcessingOverlay
        isOpen={isProcessing}
        title="Compressing PDF..."
        subtitle={progressStage}
        progressPercent={progressPercent}
      />
    </div>
  );
};

