import { getPdfLib } from '../engine/loader';
import { PdfOperationError } from '../types';

export interface CropMarginsPercent {
  top: number; // 0 - 45%
  bottom: number; // 0 - 45%
  left: number; // 0 - 45%
  right: number; // 0 - 45%
}

export interface CropPdfOptions {
  margins: CropMarginsPercent;
  targetPageNumbers?: number[]; // If undefined, applies to all pages
  onProgress?: (progressPercent: number) => void;
}

export interface CropPdfResult {
  pdfBytes: Uint8Array;
  totalPages: number;
}

/**
 * Crops margins of PDF pages by updating their MediaBox and CropBox definitions.
 * Accurately translates viewport percentages to the PDF bottom-left coordinate system.
 */
export async function cropPdfDocument(
  input: File | Uint8Array,
  options: CropPdfOptions,
): Promise<CropPdfResult> {
  const { margins, targetPageNumbers, onProgress } = options;

  // Validate margin bounds
  const top = Math.max(0, margins.top || 0);
  const bottom = Math.max(0, margins.bottom || 0);
  const left = Math.max(0, margins.left || 0);
  const right = Math.max(0, margins.right || 0);

  if (left + right >= 90 || top + bottom >= 90) {
    throw new PdfOperationError(
      'INVALID_PAGE_RANGE',
      'Crop margins are too large. Total horizontal and vertical margins must be under 90%.',
    );
  }

  const { PDFDocument } = await getPdfLib();

  const bytes = input instanceof File
    ? new Uint8Array(await input.arrayBuffer())
    : input;

  let doc;
  try {
    doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypted')) {
      throw new PdfOperationError('ENCRYPTED_PDF', 'The PDF is encrypted or password-protected.');
    }
    throw new PdfOperationError('CORRUPT_PDF', 'Unable to parse the PDF document.', msg);
  }

  const totalPages = doc.getPageCount();
  if (totalPages === 0) {
    throw new PdfOperationError('INVALID_PDF', 'The source document contains no pages.');
  }

  const pages = doc.getPages();
  const targetSet = targetPageNumbers ? new Set(targetPageNumbers) : null;

  for (let i = 0; i < pages.length; i++) {
    const pageNum = i + 1;
    if (targetSet && !targetSet.has(pageNum)) {
      continue;
    }

    const page = pages[i];
    const { x: origX, y: origY, width: origWidth, height: origHeight } = page.getMediaBox();

    // Calculate crop boundaries in points
    const leftPts = (left / 100) * origWidth;
    const rightPts = (right / 100) * origWidth;
    const topPts = (top / 100) * origHeight;
    const bottomPts = (bottom / 100) * origHeight;

    const newX = origX + leftPts;
    const newY = origY + bottomPts;
    const newWidth = origWidth - leftPts - rightPts;
    const newHeight = origHeight - topPts - bottomPts;

    // Apply crop to both CropBox and MediaBox for universal reader compatibility
    page.setCropBox(newX, newY, newWidth, newHeight);
    page.setMediaBox(newX, newY, newWidth, newHeight);

    onProgress?.(Math.round(((i + 1) / pages.length) * 90));
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const pdfBytes = await doc.save();
  onProgress?.(100);

  return {
    pdfBytes,
    totalPages,
  };
}
