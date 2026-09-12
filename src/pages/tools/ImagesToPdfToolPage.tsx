import { useState, useEffect, useRef, useCallback, type FC } from 'react';
import { Link } from 'react-router-dom';
import {
  FileImage,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCw,
  RefreshCw,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { IMAGE_TO_PDF_CONFIG } from '@/constants/file';
import { useFilePipeline } from '@/hooks/useFilePipeline';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Dropzone } from '@/components/file/Dropzone';
import { FileErrorBanner } from '@/components/file/FileErrorBanner';
import { ProcessingOverlay } from '@/components/pdf/ProcessingOverlay';
import { ImageThumbnailCard } from '@/components/image/ImageThumbnailCard';
import {
  validateImageFile,
  readImageDimensions,
  convertImagesToPdf,
  downloadPdfBytes,
  PdfOperationError,
  type ImageDescriptor,
  type PdfRotationAngle,
} from '@/lib/pdf';
import type { FileValidationError } from '@/types/file';

export const ImagesToPdfToolPage: FC = () => {
  useDocumentTitle(
    'Images to PDF',
    'Convert multiple JPG, PNG, or WebP images into a single high-quality PDF document locally in your browser.',
  );

  const [imageItems, setImageItems] = useState<ImageDescriptor[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('Preparing image conversion...');
  const [operationErrors, setOperationErrors] = useState<FileValidationError[]>([]);

  // Ref to track active object URLs for memory leak prevention
  const activeUrlsRef = useRef<Set<string>>(new Set());

  const {
    files,
    errors: pipelineErrors,
    formattedTotalSize,
    hasFiles,
    canAddMore,
    isValidForAction,
    addFiles,
    removeFile,
    clearFiles,
    clearErrors,
    reorderFiles,
  } = useFilePipeline({
    config: IMAGE_TO_PDF_CONFIG,
  });

  // Sync image descriptors with pipeline files
  useEffect(() => {
    let isCancelled = false;

    setImageItems((prevItems) => {
      // Build lookup of existing items by file id
      const itemMap = new Map(prevItems.map((item) => [item.managedFile.id, item]));

      // Create updated items array preserving user modifications (rotation, dimensions)
      const nextItems: ImageDescriptor[] = files.map((file) => {
        const existing = itemMap.get(file.id);
        if (existing) {
          itemMap.delete(file.id);
          return existing;
        }

        // Create ephemeral object URL for new file
        const previewUrl = URL.createObjectURL(file.file);
        activeUrlsRef.current.add(previewUrl);

        const newItem: ImageDescriptor = {
          id: file.id,
          managedFile: file,
          previewUrl,
          rotation: 0,
          format: file.extension === '.png' ? 'png' : file.extension === '.webp' ? 'webp' : 'jpeg',
          status: 'pending',
        };

        // Asynchronously validate signature and read dimensions
        (async () => {
          try {
            const valResult = await validateImageFile(file.file);
            if (isCancelled) return;

            if (!valResult.valid || !valResult.format) {
              setImageItems((current) =>
                current.map((item) =>
                  item.id === file.id
                    ? {
                        ...item,
                        status: 'error',
                        errorMessage: valResult.error || 'Invalid image signature',
                      }
                    : item,
                ),
              );
              return;
            }

            const dims = await readImageDimensions(file.file, valResult.format);
            if (isCancelled) return;

            setImageItems((current) =>
              current.map((item) =>
                item.id === file.id
                  ? {
                      ...item,
                      dimensions: dims,
                      format: valResult.format!,
                      status: 'ready',
                    }
                  : item,
              ),
            );
          } catch {
            if (isCancelled) return;
            setImageItems((current) =>
              current.map((item) =>
                item.id === file.id ? { ...item, status: 'ready' } : item,
              ),
            );
          }
        })();

        return newItem;
      });

      // Revoke URLs for removed items
      for (const removedItem of itemMap.values()) {
        URL.revokeObjectURL(removedItem.previewUrl);
        activeUrlsRef.current.delete(removedItem.previewUrl);
      }

      return nextItems;
    });

    return () => {
      isCancelled = true;
    };
  }, [files]);

  // Clean up all object URLs when component unmounts
  useEffect(() => {
    const activeUrls = activeUrlsRef.current;
    return () => {
      for (const url of activeUrls) {
        URL.revokeObjectURL(url);
      }
      activeUrls.clear();
    };
  }, []);

  const allErrors = [...pipelineErrors, ...operationErrors];

  // Rotate individual image
  const handleRotateCw = useCallback((id: string) => {
    setImageItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextRot = ((item.rotation + 90) % 360) as PdfRotationAngle;
          return { ...item, rotation: nextRot };
        }
        return item;
      }),
    );
  }, []);

  const handleRotateCcw = useCallback((id: string) => {
    setImageItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextRot = ((item.rotation + 270) % 360) as PdfRotationAngle;
          return { ...item, rotation: nextRot };
        }
        return item;
      }),
    );
  }, []);

  // Rotate all images
  const handleRotateAllCw = useCallback(() => {
    setImageItems((prev) =>
      prev.map((item) => ({
        ...item,
        rotation: ((item.rotation + 90) % 360) as PdfRotationAngle,
      })),
    );
  }, []);

  // Reordering handlers
  const handleMove = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex < 0 || fromIndex >= imageItems.length || toIndex < 0 || toIndex >= imageItems.length) {
        return;
      }
      reorderFiles(fromIndex, toIndex);
    },
    [imageItems.length, reorderFiles],
  );

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
    // Sort files by original ingestion index/timestamp
    const sorted = [...imageItems].sort(
      (a, b) => a.managedFile.file.lastModified - b.managedFile.file.lastModified,
    );
    setImageItems(sorted);
  };

  // Convert to PDF
  const handleGeneratePdf = async () => {
    if (!isValidForAction || imageItems.length === 0 || isProcessing) return;

    // Check if any images are in error status
    const faulty = imageItems.find((img) => img.status === 'error');
    if (faulty) {
      setOperationErrors([
        {
          code: 'INVALID_TYPE',
          message: `"${faulty.managedFile.name}" has an error: ${faulty.errorMessage}. Please remove it before converting.`,
        },
      ]);
      return;
    }

    setIsProcessing(true);
    setProgressPercent(0);
    setProgressMessage(`Preparing ${imageItems.length} images...`);
    setOperationErrors([]);

    try {
      const pdfBytes = await convertImagesToPdf(imageItems, {
        onProgress: (curr, total, pct) => {
          setProgressPercent(pct);
          setProgressMessage(`Processing image ${Math.min(curr + 1, total)} of ${total} (${pct}%)...`);
        },
      });

      downloadPdfBytes(pdfBytes, 'images-to-pdf.pdf');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred during PDF generation.';
      const code = err instanceof PdfOperationError ? err.code : 'PROCESSING_FAILED';
      setOperationErrors([{ code: code as FileValidationError['code'], message: msg }]);
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
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
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Images to PDF
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
            Convert JPG, PNG, or WebP images into a single PDF document. Reorder, rotate, and organize each page with complete privacy directly in your browser.
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
          {/* File Ingestion Dropzone */}
          {canAddMore && (
            <div>
              <Dropzone
                onFilesSelected={addFiles}
                config={IMAGE_TO_PDF_CONFIG}
                title={hasFiles ? 'Add more images' : 'Select or drop image files to convert'}
                subtitle="Accepts JPEG, PNG, and WebP images. Up to 50 files, maximum 25 MB each."
                disabled={isProcessing}
              />
            </div>
          )}

          {/* Selected Images Workspace */}
          {hasFiles && (
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-6">
              {/* Workspace Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {imageItems.length} {imageItems.length === 1 ? 'image' : 'images'} selected
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    ({formattedTotalSize})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRotateAllCw}
                    disabled={isProcessing}
                    title="Rotate all images 90° clockwise"
                  >
                    <RotateCw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    <span>Rotate All</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetOrder}
                    disabled={isProcessing}
                    title="Reset image sequence to initial order"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    <span>Reset Order</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFiles}
                    disabled={isProcessing}
                    className="text-destructive hover:bg-destructive/10"
                    title="Remove all images"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    <span>Clear</span>
                  </Button>
                </div>
              </div>

              {/* Responsive Image Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {imageItems.map((item, index) => (
                  <ImageThumbnailCard
                    key={item.id}
                    item={item}
                    displayIndex={index}
                    totalDisplayCount={imageItems.length}
                    onRotateClockwise={handleRotateCw}
                    onRotateCounterClockwise={handleRotateCcw}
                    onMoveLeft={(idx) => handleMove(idx, idx - 1)}
                    onMoveRight={(idx) => handleMove(idx, idx + 1)}
                    onRemove={removeFile}
                    draggable={!isProcessing}
                    isDragTarget={dragOverIndex === index}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    disabled={isProcessing}
                  />
                ))}
              </div>

              {/* Bottom Conversion Action Bar */}
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-muted-foreground">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 inline" aria-hidden="true" />
                    {imageItems.length} {imageItems.length === 1 ? 'image' : 'images'} ready for conversion (total size: {formattedTotalSize}).
                  </span>
                </div>

                <div className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    disabled={!isValidForAction || isProcessing}
                    onClick={handleGeneratePdf}
                    className="w-full sm:w-auto shadow-sm"
                  >
                    <span>Convert {imageItems.length} Images to PDF</span>
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
                    All images are decoded and compiled into PDF pages directly in your browser memory. No photos are ever transmitted to any external server.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-5 flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Proportional Aspect Ratio</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Pages are dynamically scaled to match image proportions without stretching, distortion, or quality degradation.
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
        title="Generating PDF from images..."
        subtitle={progressMessage}
        progressPercent={progressPercent}
      />
    </div>
  );
};
