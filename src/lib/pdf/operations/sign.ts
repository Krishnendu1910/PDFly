import { getPdfLib } from '../engine/loader';
import { PdfOperationError } from '../types';

export interface SignaturePlacement {
  xPercent: number; // 0 to 100, from left of viewport
  yPercent: number; // 0 to 100, from top of viewport
  widthPercent: number; // relative width, e.g. 25%
  heightPercent: number; // relative height, e.g. 10%
}

export interface SignPdfOptions {
  pageNumber: number; // 1-based page
  signaturePngBytes: Uint8Array;
  placement: SignaturePlacement;
  onProgress?: (progressPercent: number) => void;
}

export interface SignPdfResult {
  pdfBytes: Uint8Array;
  signedPageNumber: number;
}

/**
 * Embeds a visual signature graphic into a designated page of a PDF document.
 * Translates viewport coordinates to PDF page geometry.
 */
export async function signPdfDocument(
  input: File | Uint8Array,
  options: SignPdfOptions,
): Promise<SignPdfResult> {
  const { pageNumber, signaturePngBytes, placement, onProgress } = options;

  if (!signaturePngBytes || signaturePngBytes.byteLength === 0) {
    throw new PdfOperationError('PROCESSING_FAILED', 'Signature image data is missing or empty.');
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
  if (pageNumber < 1 || pageNumber > totalPages) {
    throw new PdfOperationError(
      'OUT_OF_BOUNDS_PAGE',
      `Target page ${pageNumber} is outside the document bounds (1-${totalPages}).`,
    );
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

  const page = doc.getPage(pageNumber - 1);
  const { width: pageWidth, height: pageHeight } = page.getSize();

  // Convert top-left percentage coordinates to PDF bottom-left points
  const sigWidth = Math.max(20, (placement.widthPercent / 100) * pageWidth);
  const sigHeight = Math.max(10, (placement.heightPercent / 100) * pageHeight);

  const clampedXPercent = Math.max(0, Math.min(100 - placement.widthPercent, placement.xPercent));
  const clampedYPercent = Math.max(0, Math.min(100 - placement.heightPercent, placement.yPercent));

  const pdfX = (clampedXPercent / 100) * pageWidth;
  const pdfY = ((100 - (clampedYPercent + placement.heightPercent)) / 100) * pageHeight;

  page.drawImage(pngImage, {
    x: pdfX,
    y: Math.max(0, pdfY),
    width: sigWidth,
    height: sigHeight,
  });

  onProgress?.(80);

  const pdfBytes = await doc.save();
  onProgress?.(100);

  return {
    pdfBytes,
    signedPageNumber: pageNumber,
  };
}
