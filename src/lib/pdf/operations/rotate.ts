import { getPdfLib } from '../engine/loader';
import { PdfOperationError, type PdfRotationAngle } from '../types';

export interface PageRotationConfig {
  /** 0-based page index */
  pageIndex: number;
  /** Degrees to rotate clockwise (90, 180, 270) */
  rotationAngle: PdfRotationAngle;
}

export interface RotatePdfOptions {
  /** Explicit rotations to apply per page. If omitted, defaultAngle applies to all pages. */
  pageRotations?: PageRotationConfig[];
  /** Default angle to add to all pages if pageRotations is not specified */
  defaultAngle?: PdfRotationAngle;
  onProgress?: (progressPercent: number) => void;
}

/**
 * Rotates specific pages or all pages of a PDF document by 90°, 180°, or 270°.
 *
 * Uses native PDF dictionary page rotation metadata (`page.setRotation`) without
 * rasterizing or converting pages to images, ensuring 100% preservation of text,
 * vectors, and document quality.
 */
export const MAX_ROTATE_PAGES = 2000; // Defensive limit against page expansion DoS

export async function rotatePdfDocument(
  input: File | Uint8Array,
  options: RotatePdfOptions = {},
): Promise<Uint8Array> {
  const { pageRotations, defaultAngle = 90, onProgress } = options;
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

  try {
    const pages = doc.getPages();
    const totalPages = pages.length;

    if (totalPages === 0) {
      throw new PdfOperationError('INVALID_PDF', 'The document contains no pages to rotate.');
    }

    if (totalPages > MAX_ROTATE_PAGES || (pageRotations && pageRotations.length > MAX_ROTATE_PAGES)) {
      throw new PdfOperationError(
        'LIMIT_EXCEEDED',
        `Rotation exceeds the maximum allowed page count of ${MAX_ROTATE_PAGES} pages.`,
      );
    }

    if (pageRotations && pageRotations.length > 0) {
      // Apply specific rotations per page
      const totalOps = pageRotations.length;
      for (let i = 0; i < totalOps; i++) {
        const { pageIndex, rotationAngle } = pageRotations[i]!;
        if (pageIndex >= 0 && pageIndex < totalPages) {
          const page = pages[pageIndex];
          if (page) {
            const currentRotation = page.getRotation().angle;
            const newAngle = ((currentRotation + rotationAngle) % 360 + 360) % 360;
            page.setRotation(degrees(newAngle));
          }
        }
        onProgress?.(Math.round(((i + 1) / totalOps) * 90));
        // Periodically yield to event loop
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    } else {
      // Apply defaultAngle to all pages
      for (let i = 0; i < totalPages; i++) {
        const page = pages[i];
        if (page) {
          const currentRotation = page.getRotation().angle;
          const newAngle = ((currentRotation + defaultAngle) % 360 + 360) % 360;
          page.setRotation(degrees(newAngle));
        }
        onProgress?.(Math.round(((i + 1) / totalPages) * 90));
        // Periodically yield to event loop
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    const outputBytes = await doc.save();
    onProgress?.(100);

    return outputBytes;
  } catch (err) {
    if (err instanceof PdfOperationError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new PdfOperationError('CORRUPT_PDF', 'Failed to rotate pages: The PDF contains corrupted page data.', msg);
  }
}

