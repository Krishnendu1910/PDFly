import { getPdfLib } from '../engine/loader';
import { PdfOperationError } from '../types';

export interface SignaturePlacement {
  xPercent: number; // 0 to 100, from left of viewport
  yPercent: number; // 0 to 100, from top of viewport
  widthPercent: number; // relative width, e.g. 25%
  heightPercent: number; // relative height, e.g. 10%
}

export interface SignPdfOptions {
  pageNumber?: number; // 1-based page (used when scope is 'page', defaults to 1)
  scope?: 'page' | 'all'; // 'page' (default) or 'all'
  signaturePngBytes: Uint8Array;
  placement: SignaturePlacement;
  pagePlacements?: Record<number, SignaturePlacement>; // Optional per-page override
  onProgress?: (progressPercent: number) => void;
}

export interface SignPdfResult {
  pdfBytes: Uint8Array;
  signedPageNumber: number; // Retained for backwards compatibility
  signedPages: number[];
  signedPageCount: number;
}

/**
 * Embeds a visual signature graphic into a single page or across all pages of a PDF document.
 * Translates viewport coordinates to PDF page geometry proportionally, preserving bounds
 * and aspect across mixed page orientations (portrait, landscape) and varying page dimensions.
 */
export async function signPdfDocument(
  input: File | Uint8Array,
  options: SignPdfOptions,
): Promise<SignPdfResult> {
  const { pageNumber, scope = 'page', signaturePngBytes, placement, pagePlacements, onProgress } = options;

  if (!signaturePngBytes || signaturePngBytes.byteLength === 0) {
    throw new PdfOperationError('PROCESSING_FAILED', 'Signature image data is missing or empty.');
  }

  const { PDFDocument, degrees } = await getPdfLib();

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

  if (scope === 'page') {
    const targetPage = pageNumber ?? 1;
    if (targetPage < 1 || targetPage > totalPages) {
      throw new PdfOperationError(
        'OUT_OF_BOUNDS_PAGE',
        `Target page ${targetPage} is outside the document bounds (1-${totalPages}).`,
      );
    }
  }

  onProgress?.(25);

  let pngImage;
  try {
    pngImage = await doc.embedPng(signaturePngBytes);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new PdfOperationError('PROCESSING_FAILED', 'Failed to embed signature PNG image.', msg);
  }

  onProgress?.(50);

  const targetPages = scope === 'all'
    ? Array.from({ length: totalPages }, (_, i) => i + 1)
    : [pageNumber ?? 1];

  for (let i = 0; i < targetPages.length; i++) {
    const pNum = targetPages[i];
    const page = doc.getPage(pNum - 1);
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const rot = ((page.getRotation().angle % 360) + 360) % 360;

    // Use page-specific placement if available, otherwise global placement
    const activePlacement = (pagePlacements && pagePlacements[pNum])
      ? pagePlacements[pNum]
      : placement;

    // Visual dimensions accounting for page orientation/rotation
    const isRotated90or270 = rot === 90 || rot === 270;
    const visualWidth = isRotated90or270 ? pageHeight : pageWidth;
    const visualHeight = isRotated90or270 ? pageWidth : pageHeight;

    const sigWidth = Math.max(20, (activePlacement.widthPercent / 100) * visualWidth);
    const sigHeight = Math.max(10, (activePlacement.heightPercent / 100) * visualHeight);

    const clampedXPercent = Math.max(0, Math.min(100 - activePlacement.widthPercent, activePlacement.xPercent));
    const clampedYPercent = Math.max(0, Math.min(100 - activePlacement.heightPercent, activePlacement.yPercent));

    const visualX = (clampedXPercent / 100) * visualWidth;
    const visualY = (clampedYPercent / 100) * visualHeight;

    let drawX = visualX;
    let drawY = visualHeight - (visualY + sigHeight);
    let drawRotate = degrees(0);

    if (rot === 90) {
      drawX = visualY + sigHeight;
      drawY = visualX;
      drawRotate = degrees(90);
    } else if (rot === 180) {
      drawX = pageWidth - visualX;
      drawY = pageHeight - visualY;
      drawRotate = degrees(180);
    } else if (rot === 270) {
      drawX = pageWidth - (visualY + sigHeight);
      drawY = pageHeight - visualX;
      drawRotate = degrees(270);
    }

    page.drawImage(pngImage, {
      x: drawX,
      y: Math.max(0, drawY),
      width: sigWidth,
      height: sigHeight,
      rotate: drawRotate,
    });

    onProgress?.(50 + Math.round(((i + 1) / targetPages.length) * 40));
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const pdfBytes = await doc.save();
  onProgress?.(100);

  return {
    pdfBytes,
    signedPageNumber: targetPages[0],
    signedPages: targetPages,
    signedPageCount: targetPages.length,
  };
}
