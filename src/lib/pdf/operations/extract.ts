import { getPdfLib } from '../engine/loader';
import { parsePageRange } from '../utils/range-parser';
import { PdfOperationError } from '../types';

export interface ExtractPagesOptions {
  pageNumbers?: number[];
  rangeString?: string;
  onProgress?: (progressPercent: number) => void;
}

export interface ExtractPagesResult {
  pdfBytes: Uint8Array;
  extractedCount: number;
}

/**
 * Extracts specified pages or page ranges into a single new consolidated PDF document.
 * Preserves the order of pages as requested.
 *
 * Example: Pages [2, 4, 5, 6, 9] creates a single 5-page PDF.
 */
export async function extractPagesFromPdf(
  input: File | Uint8Array,
  pageSelectionOrOptions: number[] | string | ExtractPagesOptions,
  options: ExtractPagesOptions = {},
): Promise<ExtractPagesResult> {
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

  let oneBasedPages: number[];

  if (typeof pageSelectionOrOptions === 'string') {
    if (!pageSelectionOrOptions.trim()) {
      throw new PdfOperationError('INVALID_PAGE_RANGE', 'Page range expression cannot be empty.');
    }
    const parsed = parsePageRange(pageSelectionOrOptions, totalPages);
    oneBasedPages = parsed.pages;
  } else if (Array.isArray(pageSelectionOrOptions)) {
    if (pageSelectionOrOptions.length === 0) {
      throw new PdfOperationError('INVALID_PAGE_RANGE', 'At least one page must be selected for extraction.');
    }
    oneBasedPages = pageSelectionOrOptions;
  } else {
    // Options object
    if (pageSelectionOrOptions.rangeString) {
      const parsed = parsePageRange(pageSelectionOrOptions.rangeString, totalPages);
      oneBasedPages = parsed.pages;
    } else if (pageSelectionOrOptions.pageNumbers && pageSelectionOrOptions.pageNumbers.length > 0) {
      oneBasedPages = pageSelectionOrOptions.pageNumbers;
    } else {
      throw new PdfOperationError('INVALID_PAGE_RANGE', 'At least one page must be selected for extraction.');
    }
  }

  if (oneBasedPages.length === 0) {
    throw new PdfOperationError('INVALID_PAGE_RANGE', 'No valid pages found to extract.');
  }

  // Validate bounds
  for (const p of oneBasedPages) {
    if (!Number.isInteger(p) || p < 1 || p > totalPages) {
      throw new PdfOperationError(
        'OUT_OF_BOUNDS_PAGE',
        `Page ${p} is outside the valid document range of 1 to ${totalPages}.`,
      );
    }
  }

  // Convert to 0-based indices for copying
  const zeroBasedIndices = oneBasedPages.map((p) => p - 1);

  try {
    const outputDoc = await PDFDocument.create();
    const copiedPages = await outputDoc.copyPages(srcDoc, zeroBasedIndices);
    const totalExtracted = copiedPages.length;

    for (let i = 0; i < totalExtracted; i++) {
      outputDoc.addPage(copiedPages[i]);
      options.onProgress?.(Math.round(((i + 1) / totalExtracted) * 90));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const pdfBytes = await outputDoc.save();
    options.onProgress?.(100);

    return {
      pdfBytes,
      extractedCount: totalExtracted,
    };
  } catch (err) {
    if (err instanceof PdfOperationError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new PdfOperationError('PROCESSING_FAILED', 'Failed to extract pages from PDF.', msg);
  }
}
