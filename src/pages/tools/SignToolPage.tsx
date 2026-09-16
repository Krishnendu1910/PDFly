import { useState, useEffect, useRef, type FC, type MouseEvent, type TouchEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ToolIcon,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Info,
  ArrowCounterClockwise,
  CheckCircle,
  Stack,
  FileText,
  Signature,
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
import { ProcessingOverlay } from '@/components/pdf/ProcessingOverlay';
import { DownloadResultDocket, type OutputFileItem } from '@/components/download';
import { getDefaultDownloadFilename } from '@/utils/filenameUtils';
import {
  getPdfPageCount,
  renderPageThumbnail,
  signPdfDocument,
  PdfOperationError,
  type SignaturePlacement,
} from '@/lib/pdf';
import type { FileValidationError } from '@/types/file';

const SIGN_CONFIG = {
  ...PDF_ONLY_CONFIG,
  maxFiles: 1,
  minFiles: 1,
};

type PlacementPreset = 'bottom-right' | 'bottom-left' | 'bottom-center' | 'center';
type SignatureScope = 'page' | 'all';

const DEFAULT_PLACEMENT: SignaturePlacement = {
  xPercent: 65,
  yPercent: 82,
  widthPercent: 28,
  heightPercent: 12,
};

export const SignToolPage: FC = () => {
  useDocumentTitle(
    'Sign PDF',
    'Draw and embed a visual signature stamp onto any page or all pages of your PDF document.',
  );

  const [pageCount, setPageCount] = useState<number | null>(null);
  const [targetPage, setTargetPage] = useState<number>(1);
  const [scope, setScope] = useState<SignatureScope>('page');
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preset, setPreset] = useState<PlacementPreset | null>('bottom-right');
  const [pagePlacements, setPagePlacements] = useState<Record<number, SignaturePlacement>>({});
  const [allPagesPlacement, setAllPagesPlacement] = useState<SignaturePlacement>(DEFAULT_PLACEMENT);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [operationErrors, setOperationErrors] = useState<FileValidationError[]>([]);
  const [outputResult, setOutputResult] = useState<OutputFileItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startXPercent: number; startYPercent: number }>({
    clientX: 0,
    clientY: 0,
    startXPercent: 0,
    startYPercent: 0,
  });

  const {
    files,
    errors: pipelineErrors,
    hasFiles,
    addFiles,
    clearFiles,
    clearErrors,
  } = useFilePipeline({
    config: SIGN_CONFIG,
  });

  const activeFile = files[0];

  // Active placement coordinates for the currently displayed page or all pages
  const currentPlacement: SignaturePlacement =
    scope === 'all'
      ? allPagesPlacement
      : pagePlacements[targetPage] ?? DEFAULT_PLACEMENT;

  // Helper to detect if a given placement matches one of the 4 standard presets
  const detectPreset = (p: SignaturePlacement): PlacementPreset | null => {
    if (p.xPercent === 65 && p.yPercent === 82) return 'bottom-right';
    if (p.xPercent === 7 && p.yPercent === 82) return 'bottom-left';
    if (p.xPercent === 36 && p.yPercent === 82) return 'bottom-center';
    if (p.xPercent === 36 && p.yPercent === 44) return 'center';
    return null;
  };

  const updatePlacement = (newPlacement: SignaturePlacement) => {
    if (scope === 'all') {
      setAllPagesPlacement(newPlacement);
    } else {
      setPagePlacements((prev) => ({
        ...prev,
        [targetPage]: newPlacement,
      }));
    }
  };

  // Inspect page count upon file selection
  useEffect(() => {
    let isCancelled = false;

    if (!activeFile) {
      setPageCount(null);
      setPreviewThumbnail(null);
      setOutputResult(null);
      setOperationErrors([]);
      setTargetPage(1);
      setScope('page');
      setPagePlacements({});
      setAllPagesPlacement(DEFAULT_PLACEMENT);
      setPreset('bottom-right');
      setSignatureDataUrl(null);
      setHasDrawn(false);
      return;
    }

    getPdfPageCount(activeFile.file)
      .then((count) => {
        if (!isCancelled) {
          setPageCount(count);
          setTargetPage(1);
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

  // Render preview thumbnail for the target page
  useEffect(() => {
    let isCancelled = false;
    if (!activeFile || !targetPage) return;

    setPreviewLoading(true);
    renderPageThumbnail(activeFile.file, targetPage, { targetWidth: 350 })
      .then((dataUrl) => {
        if (!isCancelled) setPreviewThumbnail(dataUrl);
      })
      .catch(() => {
        // Non-critical preview failure
      })
      .finally(() => {
        if (!isCancelled) setPreviewLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeFile, targetPage]);

  // Sync preset indicator when changing target page or scope
  const handlePageChange = (newPage: number) => {
    setTargetPage(newPage);
    const existing = pagePlacements[newPage] ?? DEFAULT_PLACEMENT;
    setPreset(detectPreset(existing));
  };

  const handleScopeChange = (newScope: SignatureScope) => {
    setScope(newScope);
    const active = newScope === 'all' ? allPagesPlacement : (pagePlacements[targetPage] ?? DEFAULT_PLACEMENT);
    setPreset(detectPreset(active));
  };

  // Update placement coordinates based on preset selection
  const applyPreset = (p: PlacementPreset) => {
    setPreset(p);
    let coords: SignaturePlacement;
    switch (p) {
      case 'bottom-right':
        coords = { xPercent: 65, yPercent: 82, widthPercent: 28, heightPercent: 12 };
        break;
      case 'bottom-left':
        coords = { xPercent: 7, yPercent: 82, widthPercent: 28, heightPercent: 12 };
        break;
      case 'bottom-center':
        coords = { xPercent: 36, yPercent: 82, widthPercent: 28, heightPercent: 12 };
        break;
      case 'center':
        coords = { xPercent: 36, yPercent: 44, widthPercent: 28, heightPercent: 12 };
        break;
    }
    updatePlacement(coords);
  };

  // Dragging & pointer placement mechanics
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture errors in unsupported browsers
    }

    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startXPercent: currentPlacement.xPercent,
      startYPercent: currentPlacement.yPercent,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !previewContainerRef.current) return;
    e.preventDefault();

    const rect = previewContainerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const deltaX = e.clientX - dragStartRef.current.clientX;
    const deltaY = e.clientY - dragStartRef.current.clientY;

    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;

    const rawX = dragStartRef.current.startXPercent + deltaXPercent;
    const rawY = dragStartRef.current.startYPercent + deltaYPercent;

    const clampedX = Math.max(0, Math.min(100 - currentPlacement.widthPercent, rawX));
    const clampedY = Math.max(0, Math.min(100 - currentPlacement.heightPercent, rawY));

    updatePlacement({
      ...currentPlacement,
      xPercent: Math.round(clampedX * 10) / 10,
      yPercent: Math.round(clampedY * 10) / 10,
    });
    setPreset(null); // Manual dragging overrides preset
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      isDraggingRef.current = false;
      setIsDragging(false);
    }
  };

  // Keyboard accessibility: arrow keys adjust position
  const handlePlacementKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 5 : 1;
    let newX = currentPlacement.xPercent;
    let newY = currentPlacement.yPercent;
    let handled = false;

    if (e.key === 'ArrowLeft') {
      newX = Math.max(0, newX - step);
      handled = true;
    } else if (e.key === 'ArrowRight') {
      newX = Math.min(100 - currentPlacement.widthPercent, newX + step);
      handled = true;
    } else if (e.key === 'ArrowUp') {
      newY = Math.max(0, newY - step);
      handled = true;
    } else if (e.key === 'ArrowDown') {
      newY = Math.min(100 - currentPlacement.heightPercent, newY + step);
      handled = true;
    }

    if (handled) {
      e.preventDefault();
      updatePlacement({
        ...currentPlacement,
        xPercent: Math.round(newX * 10) / 10,
        yPercent: Math.round(newY * 10) / 10,
      });
      setPreset(null);
    }
  };

  // Canvas drawing handlers
  const startDrawing = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);

    isDrawingRef.current = true;
    setHasDrawn(true);
  };

  const draw = (clientX: number, clientY: number) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    startDrawing(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    draw(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      e.preventDefault();
      startDrawing(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      e.preventDefault();
      draw(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
    setSignatureDataUrl(null);
  };

  const handleApplySignature = async () => {
    const canvas = canvasRef.current;
    if (!activeFile || !canvas || !hasDrawn || isProcessing) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setOperationErrors([]);

    try {
      // Export signature canvas as PNG bytes
      const pngBytes = await new Promise<Uint8Array>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to extract signature image.'));
            return;
          }
          blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf))).catch(reject);
        }, 'image/png');
      });

      const result = await signPdfDocument(activeFile.file, {
        pageNumber: targetPage,
        scope,
        signaturePngBytes: pngBytes,
        placement: currentPlacement,
        pagePlacements: scope === 'page' ? pagePlacements : undefined,
        onProgress: (pct) => setProgressPercent(pct),
      });

      const defaultFilename = getDefaultDownloadFilename('sign', activeFile.name);
      setOutputResult({
        id: 'signed-output',
        pdfBytes: result.pdfBytes,
        defaultFilename,
        byteSize: result.pdfBytes.byteLength,
        pageCount: pageCount || 1,
        label:
          scope === 'all'
            ? `Signed Document (All ${result.signedPageCount} pages)`
            : `Signed Document (Page ${result.signedPageNumber})`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to apply signature.';
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
    setPageCount(null);
    setPreviewThumbnail(null);
    setHasDrawn(false);
    setSignatureDataUrl(null);
    setTargetPage(1);
    setScope('page');
    setPagePlacements({});
    setAllPagesPlacement(DEFAULT_PLACEMENT);
    setPreset('bottom-right');
    handleClearSignature();
  };

  const allErrors = [...pipelineErrors, ...operationErrors];

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
              <div className="w-14 h-14 rounded-xl bg-violet/10 text-violet dark:bg-violet/20 dark:text-violet flex items-center justify-center shrink-0">
                <ToolIcon toolId="sign" className="w-7 h-7" weight="duotone" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" size="sm">
                    Sign
                  </Badge>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Sign PDF
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
            Draw your handwritten signature on an interactive pad and embed it visually into any page or all pages of your PDF document.
          </p>
        </div>

        {/* Informational Disclaimer Notice */}
        <div className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <span className="font-semibold">Visual Signature Notice:</span> This tool embeds a visual graphic stamp into the document page stream. It is not a cryptographic certificate or digital signature (PKI/eIDAS compliant).
          </div>
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
            toolName="Signed Document"
            onBackToEditing={() => setOutputResult(null)}
            onReset={handleReset}
          />
        ) : (
          <div className="space-y-8">
            {/* File Ingestion Dropzone */}
            {!hasFiles && (
              <Dropzone
                onFilesSelected={addFiles}
                config={SIGN_CONFIG}
                multiple={false}
                title="Select or drop a PDF document to sign"
                subtitle="Choose 1 PDF file (up to 50 MB)"
                disabled={isProcessing}
              />
            )}

            {/* Selected File & Signature Controls */}
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Signature Canvas & Scope */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                        Draw Your Signature
                      </label>
                      <button
                        type="button"
                        onClick={handleClearSignature}
                        disabled={!hasDrawn}
                        className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors disabled:opacity-40"
                      >
                        <ArrowCounterClockwise className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    </div>

                    <div className="border-2 border-dashed border-border rounded-xl bg-white p-2 flex flex-col items-center justify-center relative touch-none select-none">
                      <canvas
                        ref={canvasRef}
                        width={360}
                        height={160}
                        className="w-full max-w-[360px] h-[160px] cursor-crosshair bg-white"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={stopDrawing}
                      />
                      {!hasDrawn && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-zinc-400">
                          Sign here with mouse or finger
                        </div>
                      )}
                    </div>

                    {/* Signature Scope Selector */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                        Signature Scope
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleScopeChange('page')}
                          className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center flex items-center justify-center gap-1.5 ${
                            scope === 'page'
                              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                              : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>This Page</span>
                          {pageCount && pageCount > 1 && (
                            <span className="text-[10px] opacity-80">(Page {targetPage})</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScopeChange('all')}
                          className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center flex items-center justify-center gap-1.5 ${
                            scope === 'all'
                              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                              : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <Stack className="w-3.5 h-3.5" />
                          <span>All Pages</span>
                          {pageCount && (
                            <span className="text-[10px] opacity-80">({pageCount})</span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Target Page Selector (Active only when scope is 'page') */}
                    {scope === 'page' && pageCount && pageCount > 1 && (
                      <div className="space-y-1.5 pt-1">
                        <label htmlFor="sign-page-select" className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                          Apply to Page
                        </label>
                        <select
                          id="sign-page-select"
                          value={targetPage}
                          onChange={(e) => handlePageChange(parseInt(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                            <option key={p} value={p}>
                              Page {p} of {pageCount}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {scope === 'all' && pageCount && pageCount > 1 && (
                      <div className="p-3 rounded-lg border border-border bg-secondary/30 text-xs text-muted-foreground">
                        Signature will be embedded proportionally at this position across all <span className="font-semibold text-foreground">{pageCount} pages</span>.
                      </div>
                    )}

                    {/* Position Presets & Free Placement Indicator */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                          Signature Placement
                        </label>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {preset ? 'Quick preset' : 'Free placement'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            ['bottom-right', 'Bottom Right'],
                            ['bottom-left', 'Bottom Left'],
                            ['bottom-center', 'Bottom Center'],
                            ['center', 'Center Page'],
                          ] as [PlacementPreset, string][]
                        ).map(([pKey, pLabel]) => (
                          <button
                            key={pKey}
                            type="button"
                            onClick={() => applyPreset(pKey)}
                            className={`py-2 px-2.5 text-xs font-medium rounded-lg border transition-all text-center ${
                              preset === pKey
                                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                          >
                            {pLabel}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        Drag the signature onto the document preview or choose a preset.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Page Placement Preview & Draggable Overlay */}
                  <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 rounded-xl border border-border bg-secondary/15 min-h-[360px]">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      {scope === 'all'
                        ? `Placement Preview (Page ${targetPage} Reference)`
                        : `Page ${targetPage} Placement Preview`}
                    </div>

                    <div
                      ref={previewContainerRef}
                      className="relative border border-border rounded shadow-md overflow-hidden w-full max-w-[280px] sm:max-w-[320px] bg-background select-none touch-none"
                    >
                      {previewThumbnail ? (
                        <img
                          src={previewThumbnail}
                          alt={`Page ${targetPage} preview`}
                          className="w-full h-auto block select-none pointer-events-none"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-52 h-72 flex items-center justify-center text-xs text-muted-foreground">
                          {previewLoading ? 'Loading page...' : `Page ${targetPage}`}
                        </div>
                      )}

                      {/* Interactive Draggable Signature Overlay */}
                      <div
                        tabIndex={0}
                        role="region"
                        aria-label={`Signature placement on page ${targetPage}. Position: ${Math.round(currentPlacement.xPercent)}% from left, ${Math.round(currentPlacement.yPercent)}% from top. Use arrow keys to reposition.`}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onKeyDown={handlePlacementKeyDown}
                        style={{
                          left: `${currentPlacement.xPercent}%`,
                          top: `${currentPlacement.yPercent}%`,
                          width: `${currentPlacement.widthPercent}%`,
                          height: `${currentPlacement.heightPercent}%`,
                          touchAction: 'none',
                        }}
                        className={`absolute rounded-[3px] border-2 flex items-center justify-center p-1 cursor-grab active:cursor-grabbing transition-shadow select-none ${
                          isDragging
                            ? 'border-primary bg-primary/20 shadow-lg ring-2 ring-primary/40 cursor-grabbing'
                            : 'border-primary/80 bg-primary/10 hover:border-primary hover:bg-primary/15'
                        } focus:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                        title="Drag signature to reposition"
                      >
                        {signatureDataUrl ? (
                          <img
                            src={signatureDataUrl}
                            alt="Drawn signature"
                            className="w-full h-full object-contain pointer-events-none select-none"
                            draggable={false}
                          />
                        ) : (
                          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-primary/80 select-none">
                            Signature
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1 mt-3 text-center">
                      <p className="text-[11px] font-mono text-muted-foreground">
                        Drag signature or use arrow keys to position
                      </p>
                      <span className="text-[10px] font-mono text-muted-foreground/80 bg-muted/40 px-2 py-0.5 rounded border border-border/50">
                        X: {Math.round(currentPlacement.xPercent)}% · Y: {Math.round(currentPlacement.yPercent)}%
                        {preset ? ` · [${preset.replace('-', ' ').toUpperCase()}]` : ' · [CUSTOM]'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Conversion Trigger Bar */}
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 inline" aria-hidden="true" />
                      {hasDrawn
                        ? scope === 'all'
                          ? `Signature ready to embed across all ${pageCount} pages.`
                          : `Signature ready to embed onto page ${targetPage}.`
                        : 'Please draw your signature above.'}
                    </span>
                  </div>

                  <Button
                    size="lg"
                    disabled={isProcessing || !hasDrawn || pageCount === null}
                    onClick={handleApplySignature}
                    className="w-full sm:w-auto shadow-sm"
                  >
                    <span>
                      {scope === 'all'
                        ? `Sign All ${pageCount} Pages`
                        : `Sign Document (Page ${targetPage})`}
                    </span>
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
                    <h3 className="text-sm font-semibold text-foreground">100% In-Memory Ink Processing</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Your handwritten signature stroke never leaves your device. It is embedded directly into the PDF binary locally.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-5 flex items-start gap-3">
                  <Signature className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Clean PNG Compression</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Converts vector strokes to a crisp transparent PNG graphic stamp, preserving document background fidelity.
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
        title="Signing document..."
        subtitle="Rendering signature graphic and embedding onto page stream..."
        progressPercent={progressPercent}
      />
    </div>
  );
};
