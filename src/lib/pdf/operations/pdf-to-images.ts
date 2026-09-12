import { getPdfJs } from '../engine/loader';
import { configurePdfJs, getHardenedDocumentOptions } from '../rendering/pdfjs-config';
import { PdfOperationError } from '../types';

export interface RenderedPdfImage {
  pageNumber: number;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  filename: string;
}

export interface ConvertPdfToImagesOptions {
  format?: 'png' | 'jpeg';
  quality?: number; // 0.1 to 1.0, used for JPEG
  scale?: number; // Scale factor, default 2.0 for crisp rendering
  baseFilename?: string;
  onProgress?: (currentPage: number, totalPages: number, progressPercent: number) => void;
}

/**
 * Sequentially converts pages of a PDF document into high-resolution images.
 * Disposes of canvas and PDF.js page handles after each iteration to prevent memory leaks.
 */
export async function convertPdfToImages(
  fileOrBytes: File | Uint8Array,
  options: ConvertPdfToImagesOptions = {},
): Promise<RenderedPdfImage[]> {
  const {
    format = 'png',
    quality = 0.92,
    scale = 2.0,
    baseFilename = 'page',
    onProgress,
  } = options;

  const isJpeg = format === 'jpeg' || (format as string) === 'image/jpeg';
  const mimeType = isJpeg ? 'image/jpeg' : 'image/png';
  const fileExt = isJpeg ? 'jpg' : 'png';

  const pdfjs = await getPdfJs();
  configurePdfJs(pdfjs);

  const data = fileOrBytes instanceof File
    ? new Uint8Array(await fileOrBytes.arrayBuffer())
    : fileOrBytes;

  const loadingTask = pdfjs.getDocument(getHardenedDocumentOptions(data));

  let doc;
  try {
    doc = await loadingTask.promise;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('password')) {
      throw new PdfOperationError('ENCRYPTED_PDF', 'The PDF is encrypted or password-protected.');
    }
    throw new PdfOperationError('INVALID_PDF', 'Unable to parse the PDF document.', msg);
  }

  const totalPages = doc.numPages;
  if (totalPages === 0) {
    await doc.cleanup();
    await loadingTask.destroy();
    throw new PdfOperationError('INVALID_PDF', 'The PDF document contains no pages.');
  }

  const results: RenderedPdfImage[] = [];

  try {
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext('2d', { alpha: format === 'png' });
      if (!ctx) {
        page.cleanup();
        throw new PdfOperationError('RENDER_FAILED', `Failed to obtain 2D canvas for page ${pageNum}.`);
      }

      // Fill white background for JPEG
      if (format === 'jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const renderTask = page.render({
        canvasContext: ctx,
        canvas,
        viewport,
        intent: 'display',
      });

      await renderTask.promise;

      // Extract Blob from canvas
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error(`Failed to export image blob for page ${pageNum}`));
          },
          mimeType,
          format === 'jpeg' ? quality : undefined,
        );
      });

      const dataUrl = canvas.toDataURL(mimeType, format === 'jpeg' ? quality : undefined);

      const pageIndexStr = String(pageNum).padStart(totalPages >= 100 ? 3 : 2, '0');
      const filename = `${baseFilename}-${pageIndexStr}.${fileExt}`;

      results.push({
        pageNumber: pageNum,
        blob,
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        filename,
      });

      // Explicit cleanup of canvas and page handle
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();

      const pct = Math.round((pageNum / totalPages) * 100);
      onProgress?.(pageNum, totalPages, pct);

      // Yield briefly to event loop between pages
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return results;
  } finally {
    await doc.cleanup();
    await loadingTask.destroy();
  }
}
