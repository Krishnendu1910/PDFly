import { getPdfLib } from '../engine/loader';
import { PdfOperationError } from '../types';

export interface CropMarginsPercent {
  top: number; // 0 - 45%
  bottom: number; // 0 - 45%
  left: number; // 0 - 45%
  right: number; // 0 - 45%
}

export interface CropPdfOptions {
  margins?: CropMarginsPercent;
  pageCrops?: Record<number, CropMarginsPercent> | CropMarginsPercent[];
  targetPageNumbers?: number[]; // If undefined, applies to all pages
  onProgress?: (progressPercent: number) => void;
}

export interface CropPdfResult {
  pdfBytes: Uint8Array;
  totalPages: number;
}

/**
 * Crops margins of PDF pages by updating their MediaBox and CropBox definitions.
 * Supports uniform margins or distinct per-page crop margins.
 * Accurately translates viewport percentages to the PDF coordinate system across
 * mixed orientations (portrait, landscape) and differing page dimensions.
 */
export async function cropPdfDocument(
  input: File | Uint8Array,
  options: CropPdfOptions,
): Promise<CropPdfResult> {
  const { margins, pageCrops, targetPageNumbers, onProgress } = options;

  const defaultMargins: CropMarginsPercent = margins || { top: 0, bottom: 0, left: 0, right: 0 };

  const getMarginsForPage = (pageNum: number): CropMarginsPercent => {
    if (pageCrops) {
      if (Array.isArray(pageCrops)) {
        if (pageCrops[pageNum - 1]) return pageCrops[pageNum - 1];
      } else {
        if (pageCrops[pageNum]) return pageCrops[pageNum];
        if (pageCrops[pageNum - 1]) return pageCrops[pageNum - 1];
      }
    }
    return defaultMargins;
  };

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

  // Validate margin bounds across all targeted pages
  for (let i = 0; i < pages.length; i++) {
    const pageNum = i + 1;
    if (targetSet && !targetSet.has(pageNum)) {
      continue;
    }

    const m = getMarginsForPage(pageNum);
    const top = Math.max(0, m.top || 0);
    const bottom = Math.max(0, m.bottom || 0);
    const left = Math.max(0, m.left || 0);
    const right = Math.max(0, m.right || 0);

    if (left + right >= 90 || top + bottom >= 90) {
      throw new PdfOperationError(
        'INVALID_PAGE_RANGE',
        `Crop margins are too large for page ${pageNum}. Total horizontal and vertical margins must be under 90%.`,
      );
    }
  }

  for (let i = 0; i < pages.length; i++) {
    const pageNum = i + 1;
    if (targetSet && !targetSet.has(pageNum)) {
      continue;
    }

    const m = getMarginsForPage(pageNum);
    const top = Math.max(0, m.top || 0);
    const bottom = Math.max(0, m.bottom || 0);
    const left = Math.max(0, m.left || 0);
    const right = Math.max(0, m.right || 0);

    const page = pages[i];
    const { x: origX, y: origY, width: origWidth, height: origHeight } = page.getMediaBox();

    // Handle orientation/rotation if present
    const rot = ((page.getRotation().angle % 360) + 360) % 360;
    let mTop = top;
    let mBottom = bottom;
    let mLeft = left;
    let mRight = right;

    if (rot === 90) {
      mTop = right;
      mBottom = left;
      mLeft = bottom;
      mRight = top;
    } else if (rot === 180) {
      mTop = bottom;
      mBottom = top;
      mLeft = right;
      mRight = left;
    } else if (rot === 270) {
      mTop = left;
      mBottom = right;
      mLeft = top;
      mRight = bottom;
    }

    // Calculate crop boundaries in points relative to this specific page's box
    const leftPts = (mLeft / 100) * origWidth;
    const rightPts = (mRight / 100) * origWidth;
    const topPts = (mTop / 100) * origHeight;
    const bottomPts = (mBottom / 100) * origHeight;

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
