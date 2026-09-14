import { getPdfJs } from '../engine/loader';
import { configurePdfJs, getHardenedDocumentOptions } from './pdfjs-config';
import { PdfOperationError } from '../types';

export interface RenderThumbnailOptions {
  /** Target width for thumbnail in pixels (default 200) */
  targetWidth?: number;
  /** Additional rotation angle in degrees (0, 90, 180, 270) */
  additionalRotation?: number;
}

export interface RenderPagePreviewResult {
  dataUrl: string;
  pageWidth: number;
  pageHeight: number;
  renderedWidth: number;
  renderedHeight: number;
}

/**
 * Loads a PDF document in PDF.js and returns its total page count.
 */
export async function getPdfPageCount(fileOrBytes: File | Uint8Array): Promise<number> {
  const pdfjs = await getPdfJs();
  configurePdfJs(pdfjs);

  const data = fileOrBytes instanceof File
    ? new Uint8Array(await fileOrBytes.arrayBuffer())
    : fileOrBytes;

  const loadingTask = pdfjs.getDocument(getHardenedDocumentOptions(data));

  try {
    const doc = await loadingTask.promise;
    const count = doc.numPages;
    await doc.cleanup();
    await loadingTask.destroy();
    return count;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('password')) {
      throw new PdfOperationError('ENCRYPTED_PDF', 'The PDF is encrypted or password-protected.');
    }
    throw new PdfOperationError('INVALID_PDF', 'Unable to parse PDF document.', msg);
  }
}

/**
 * Renders a specific 1-based page of a PDF file to a full preview result containing
 * data URL and native PDF dimensions for responsive overlay alignment.
 */
export async function renderPagePreview(
  fileOrBytes: File | Uint8Array,
  pageNumber: number,
  options: RenderThumbnailOptions = {},
): Promise<RenderPagePreviewResult> {
  const { targetWidth = 420, additionalRotation = 0 } = options;
  const pdfjs = await getPdfJs();
  configurePdfJs(pdfjs);

  const data = fileOrBytes instanceof File
    ? new Uint8Array(await fileOrBytes.arrayBuffer())
    : fileOrBytes;

  const loadingTask = pdfjs.getDocument(getHardenedDocumentOptions(data));

  let doc;
  let page;
  try {
    doc = await loadingTask.promise;
    if (pageNumber < 1 || pageNumber > doc.numPages) {
      throw new PdfOperationError(
        'OUT_OF_BOUNDS_PAGE',
        `Requested page ${pageNumber} is outside the document (1-${doc.numPages}).`,
      );
    }

    page = await doc.getPage(pageNumber);

    // Combine document page native rotation with UI rotation
    const totalRotation = (page.rotate + additionalRotation) % 360;
    const unscaledViewport = page.getViewport({ scale: 1.0, rotation: totalRotation });
    const scale = targetWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale, rotation: totalRotation });

    // Render onto transient offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new PdfOperationError('RENDER_FAILED', 'Could not obtain 2D canvas context.');
    }

    // Set white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderTask = page.render({
      canvasContext: ctx,
      canvas,
      viewport,
      intent: 'display',
    });

    await renderTask.promise;

    // Convert to low-memory JPEG data URL (quality 0.85)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    const result: RenderPagePreviewResult = {
      dataUrl,
      pageWidth: unscaledViewport.width,
      pageHeight: unscaledViewport.height,
      renderedWidth: canvas.width,
      renderedHeight: canvas.height,
    };

    // Immediate cleanup
    canvas.width = 0;
    canvas.height = 0;

    return result;
  } catch (err) {
    if (err instanceof PdfOperationError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new PdfOperationError('RENDER_FAILED', `Failed to render page ${pageNumber} preview.`, msg);
  } finally {
    try {
      page?.cleanup();
      await doc?.cleanup();
      await loadingTask.destroy();
    } catch {
      // Ignore destruction errors
    }
  }
}

/**
 * Renders a specific 1-based page of a PDF file to a lightweight data URL thumbnail.
 * Cleans up all PDF.js page handles and document resources immediately to protect memory.
 */
export async function renderPageThumbnail(
  fileOrBytes: File | Uint8Array,
  pageNumber: number,
  options: RenderThumbnailOptions = {},
): Promise<string> {
  const result = await renderPagePreview(fileOrBytes, pageNumber, options);
  return result.dataUrl;
}
