import { getPdfLib } from '../engine/loader';
import { PdfOperationError } from '../types';

export interface ReorderPdfOptions {
  onProgress?: (progressPercent: number) => void;
}

/**
 * Reorders the pages of a PDF document based on an array of 0-based page indices.
 *
 * Example: For a 3-page PDF, newOrder = [2, 0, 1] puts page 3 first, then page 1, then page 2.
 */
export async function reorderPdfDocument(
  input: File | Uint8Array,
  newOrder: number[],
  options: ReorderPdfOptions = {},
): Promise<Uint8Array> {
  if (!newOrder || newOrder.length === 0) {
    throw new PdfOperationError(
      'PROCESSING_FAILED',
      'At least one page must be included in the reordered output.',
    );
  }

  const { PDFDocument } = await getPdfLib();

  const bytes = input instanceof File
    ? new Uint8Array(await input.arrayBuffer())
    : input;

  let srcDoc;
  try {
    srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypted')) {
      throw new PdfOperationError('ENCRYPTED_PDF', 'The PDF is encrypted or password-protected.');
    }
    throw new PdfOperationError('CORRUPT_PDF', 'Unable to parse the PDF document.', msg);
  }

  const totalPages = srcDoc.getPageCount();

  // Validate all indices in newOrder
  for (const idx of newOrder) {
    if (!Number.isInteger(idx) || idx < 0 || idx >= totalPages) {
      throw new PdfOperationError(
        'OUT_OF_BOUNDS_PAGE',
        `Page index ${idx} is invalid for a document with ${totalPages} pages.`,
      );
    }
  }

  const outputDoc = await PDFDocument.create();
  const copiedPages = await outputDoc.copyPages(srcDoc, newOrder);
  const totalPagesToReorder = copiedPages.length;

  for (let i = 0; i < totalPagesToReorder; i++) {
    outputDoc.addPage(copiedPages[i]);
    options.onProgress?.(Math.round(((i + 1) / totalPagesToReorder) * 90));
    // Periodically yield to event loop
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const resultBytes = await outputDoc.save();
  options.onProgress?.(100);

  return resultBytes;
}

