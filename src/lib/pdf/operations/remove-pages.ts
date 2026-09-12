import { getPdfLib } from '../engine/loader';
import { PdfOperationError } from '../types';

export interface RemovePagesOptions {
  pagesToRemove?: number[];
  onProgress?: (progressPercent: number) => void;
}

export interface RemovePagesResult {
  pdfBytes: Uint8Array;
  remainingPageCount: number;
}

/**
 * Removes specified 1-based page numbers from a PDF document.
 * Preserves the original order and formatting of the remaining pages.
 */
export async function removePagesFromPdf(
  input: File | Uint8Array,
  pagesToRemoveOrOptions: number[] | RemovePagesOptions,
  options: RemovePagesOptions = {},
): Promise<RemovePagesResult> {
  const pagesToRemove = Array.isArray(pagesToRemoveOrOptions)
    ? pagesToRemoveOrOptions
    : pagesToRemoveOrOptions.pagesToRemove ?? [];

  const effectiveOptions = Array.isArray(pagesToRemoveOrOptions)
    ? options
    : pagesToRemoveOrOptions;

  const { onProgress } = effectiveOptions;

  if (!pagesToRemove || pagesToRemove.length === 0) {
    throw new PdfOperationError(
      'INVALID_PAGE_RANGE',
      'At least one page must be selected for removal.',
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
  if (totalPages === 0) {
    throw new PdfOperationError('INVALID_PDF', 'The source document contains no pages.');
  }

  // Convert 1-based to a Set for fast lookup and validate bounds
  const removeSet = new Set<number>();
  for (const p of pagesToRemove) {
    if (!Number.isInteger(p) || p < 1 || p > totalPages) {
      throw new PdfOperationError(
        'OUT_OF_BOUNDS_PAGE',
        `Page ${p} is outside the valid range of 1 to ${totalPages}.`,
      );
    }
    removeSet.add(p);
  }

  if (removeSet.size >= totalPages) {
    throw new PdfOperationError(
      'INVALID_PAGE_RANGE',
      'Cannot remove all pages from the document. At least one page must remain.',
    );
  }

  // Determine remaining 0-based indices in original order
  const remainingIndices: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (!removeSet.has(i)) {
      remainingIndices.push(i - 1);
    }
  }

  try {
    const outputDoc = await PDFDocument.create();
    const copiedPages = await outputDoc.copyPages(srcDoc, remainingIndices);
    const totalRemaining = copiedPages.length;

    for (let i = 0; i < totalRemaining; i++) {
      outputDoc.addPage(copiedPages[i]);
      onProgress?.(Math.round(((i + 1) / totalRemaining) * 90));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const pdfBytes = await outputDoc.save();
    onProgress?.(100);

    return {
      pdfBytes,
      remainingPageCount: totalRemaining,
    };
  } catch (err) {
    if (err instanceof PdfOperationError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new PdfOperationError('PROCESSING_FAILED', 'Failed to remove pages from PDF.', msg);
  }
}
