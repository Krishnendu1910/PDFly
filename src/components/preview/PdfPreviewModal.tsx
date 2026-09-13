import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FC,
} from 'react';
import {
  Download,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getPdfJs } from '@/lib/pdf/engine/loader';
import {
  configurePdfJs,
  getHardenedDocumentOptions,
} from '@/lib/pdf/rendering/pdfjs-config';
import type { PDFDocumentProxy, RenderTask, PDFDocumentLoadingTask } from 'pdfjs-dist';

export interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBytes: Uint8Array;
  filename: string;
  onDownload: () => void;
  onBackToEditing?: () => void;
  toolName?: string;
}

export const PdfPreviewModal: FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  pdfBytes,
  filename,
  onDownload,
  onBackToEditing,
  toolName = 'Generated PDF',
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(true);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // 1. Manage body scroll lock and capture active element for focus restoration
  useEffect(() => {
    if (isOpen) {
      if (document.activeElement instanceof HTMLElement) {
        previousActiveElementRef.current = document.activeElement;
      }
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Focus the modal container
      modalContainerRef.current?.focus();

      return () => {
        document.body.style.overflow = originalOverflow;
        if (
          previousActiveElementRef.current &&
          typeof previousActiveElementRef.current.focus === 'function' &&
          document.body.contains(previousActiveElementRef.current)
        ) {
          try {
            previousActiveElementRef.current.focus();
          } catch {
            // Ignore focus failures
          }
        }
      };
    }
  }, [isOpen]);

  // 2. Load PDF Document securely into PDF.js when modal opens or pdfBytes changes
  useEffect(() => {
    if (!isOpen || !pdfBytes || pdfBytes.byteLength === 0) {
      return;
    }

    let isSubscribed = true;
    setIsLoadingDoc(true);
    setRenderError(null);
    setCurrentPage(1);
    setScale(1.0);

    let activeLoadingTask: PDFDocumentLoadingTask | null = null;
    let pdfjs: Awaited<ReturnType<typeof getPdfJs>> | null = null;

    async function loadDocument() {
      try {
        pdfjs = await getPdfJs();
        configurePdfJs(pdfjs);

        const options = getHardenedDocumentOptions(pdfBytes);
        activeLoadingTask = pdfjs.getDocument(options);

        const loadedDoc = await activeLoadingTask.promise;
        if (!isSubscribed) {
          await loadedDoc.cleanup();
          await activeLoadingTask.destroy();
          return;
        }

        docRef.current = loadedDoc;
        setTotalPages(loadedDoc.numPages || 1);
        setIsLoadingDoc(false);
      } catch (err: unknown) {
        if (!isSubscribed) return;
        const msg = err instanceof Error ? err.message : String(err);
        setRenderError(msg || 'Unable to load PDF document.');
        setIsLoadingDoc(false);
      }
    }

    const canvasElement = canvasRef.current;
    loadDocument();

    return () => {
      isSubscribed = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        renderTaskRef.current = null;
      }
      if (docRef.current) {
        try {
          docRef.current.cleanup();
        } catch {
          // ignore
        }
        docRef.current = null;
      }
      if (activeLoadingTask) {
        try {
          activeLoadingTask.destroy();
        } catch {
          // ignore
        }
      }
      if (canvasElement) {
        canvasElement.width = 0;
        canvasElement.height = 0;
      }
    };
  }, [isOpen, pdfBytes]);

  // 3. Render current page to canvas with high-DPI scaling & cancelation support
  const renderCurrentPage = useCallback(async () => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas || isLoadingDoc) return;

    // Cancel in-flight render task if any
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // ignore
      }
      renderTaskRef.current = null;
    }

    setIsRenderingPage(true);

    try {
      const page = await doc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const pixelRatio = window.devicePixelRatio || 1;

      // Set internal pixel buffer size (Hi-DPI)
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);

      // Set CSS visual size
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        throw new Error('Canvas 2D context unavailable');
      }

      ctx.save();
      ctx.scale(pixelRatio, pixelRatio);

      // White document background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, viewport.width, viewport.height);

      const renderTask = page.render({
        canvasContext: ctx,
        canvas,
        viewport,
        intent: 'display',
      });

      renderTaskRef.current = renderTask;
      await renderTask.promise;

      ctx.restore();
      page.cleanup();
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'name' in err &&
        (err as { name: string }).name === 'RenderingCancelledException'
      ) {
        // Render was replaced or cancelled; do not treat as fatal
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      setRenderError(msg || 'Failed to render page.');
    } finally {
      setIsRenderingPage(false);
    }
  }, [currentPage, scale, isLoadingDoc]);

  // Trigger render when document is ready, page changes, or scale changes
  useEffect(() => {
    if (!isLoadingDoc && docRef.current) {
      renderCurrentPage();
    }
  }, [isLoadingDoc, currentPage, scale, renderCurrentPage]);

  // 4. Navigation & Zoom Handlers
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(2.5, Math.round((prev + 0.25) * 100) / 100));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(0.5, Math.round((prev - 0.25) * 100) / 100));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1.0);
  }, []);

  // 5. Global Keyboard Shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If active element is an input, skip
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isOpen,
    onClose,
    handlePrevPage,
    handleNextPage,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
  ]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Generated PDF Preview"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div
        ref={modalContainerRef}
        tabIndex={-1}
        className="relative w-full max-w-5xl h-[92vh] max-h-[900px] flex flex-col bg-card border border-border rounded-lg shadow-2xl overflow-hidden focus:outline-none"
      >
        {/* Header Bar */}
        <header className="px-4 sm:px-6 py-3 border-b border-border bg-card/95 backdrop-blur flex items-center justify-between gap-3 shrink-0">
          {/* Document Designation */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-emerald font-semibold truncate">
                  {`[PREVIEW // ${toolName.toUpperCase()}]`}
                </span>
                <span className="hidden md:inline-block font-mono text-[11px] text-muted-foreground">
                  · {totalPages} {totalPages === 1 ? 'PAGE' : 'PAGES'}
                </span>
              </div>
              <h2
                className="font-display font-semibold text-sm sm:text-base text-foreground tracking-tight truncate"
                title={filename}
              >
                {filename}
              </h2>
            </div>
          </div>

          {/* Primary Action Suite */}
          <div className="flex items-center gap-2 shrink-0">
            {onBackToEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onBackToEditing();
                }}
                className="font-mono text-xs uppercase tracking-wider hidden sm:inline-flex"
                title="Return to editing with current parameters intact"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                <span>Back to Editing</span>
              </Button>
            )}

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onDownload}
              className="font-mono text-xs uppercase tracking-wider font-semibold"
              title="Download this generated PDF"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
              <span>Download PDF</span>
            </Button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Control Rail (Pagination & Zoom) */}
        <div className="px-4 py-2 border-b border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 select-none">
          {/* Pagination Controls */}
          <div className="flex items-center gap-1.5 font-mono">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={currentPage <= 1 || isLoadingDoc}
              onClick={handlePrevPage}
              aria-label="Previous page"
              className="h-8 px-2"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Previous Page</span>
            </Button>

            <span className="px-2 text-foreground font-semibold text-xs tracking-wider">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={currentPage >= totalPages || isLoadingDoc}
              onClick={handleNextPage}
              aria-label="Next page"
              className="h-8 px-2"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Next Page</span>
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1.5 font-mono">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={scale <= 0.5 || isLoadingDoc}
              onClick={handleZoomOut}
              aria-label="Zoom out"
              className="h-8 px-2"
            >
              <ZoomOut className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Zoom Out</span>
            </Button>

            <span className="px-2 text-foreground font-medium text-xs min-w-[48px] text-center">
              {Math.round(scale * 100)}%
            </span>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={scale >= 2.5 || isLoadingDoc}
              onClick={handleZoomIn}
              aria-label="Zoom in"
              className="h-8 px-2"
            >
              <ZoomIn className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Zoom In</span>
            </Button>

            <div className="h-4 w-px bg-border mx-1" aria-hidden="true" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={scale === 1.0 || isLoadingDoc}
              onClick={handleResetZoom}
              aria-label="Reset zoom to 100%"
              className="h-8 px-2 text-[11px] uppercase tracking-wider"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              <span>Reset</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Viewport / Canvas Presentation */}
        <div className="flex-1 overflow-auto bg-muted/20 p-4 sm:p-8 flex items-center justify-center min-h-0 relative select-none">
          {isLoadingDoc && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
              <p className="font-mono text-xs uppercase tracking-wider">
                Loading PDF preview...
              </p>
            </div>
          )}

          {renderError && !isLoadingDoc && (
            <div className="max-w-md p-6 rounded-lg bg-card border border-destructive/40 text-center space-y-4 shadow-sm">
              <div className="mx-auto w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-base text-foreground">
                  Preview Unavailable
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Unable to render preview inside the browser: {renderError}. You can still download the generated PDF directly or return to editing.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                {onBackToEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onBackToEditing();
                    }}
                    className="font-mono text-xs uppercase tracking-wider w-full sm:w-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    <span>Back to Editing</span>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onDownload}
                  className="font-mono text-xs uppercase tracking-wider w-full sm:w-auto"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                  <span>Download PDF</span>
                </Button>
              </div>
            </div>
          )}

          {/* Canvas Element for Rendered Page */}
          <div
            className={`relative flex items-center justify-center ${
              isLoadingDoc || renderError ? 'hidden' : 'block'
            }`}
          >
            <canvas
              ref={canvasRef}
              className="shadow-2xl border border-border/70 rounded-[2px] bg-white transition-opacity duration-150"
            />

            {/* Subtle spinner while switching pages */}
            {isRenderingPage && (
              <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px] flex items-center justify-center rounded-[2px]">
                <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>

        {/* Mobile Bottom Fallback Bar for Back to Editing */}
        {onBackToEditing && (
          <div className="sm:hidden px-4 py-2 border-t border-border bg-card flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onBackToEditing();
              }}
              className="w-full font-mono text-xs uppercase tracking-wider"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
              <span>Back to Editing</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
